import os
import shutil
import tempfile
import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, BackgroundTasks, File as UploadFileField, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.dependencies import DBSession
from app.api.schemas.repository import (
    FileDetailResponse,
    FileResponse,
    ImportRepoRequest,
    IndexingJobResponse,
    RepositoryResponse,
    SymbolResponse,
)
from app.core.config import get_settings
from app.core.exceptions import NotFoundError, ValidationError
from app.core.logging import get_logger
from app.models.file import File
from app.models.indexing import IndexingJob, JobStatus, JobType
from app.models.repository import Repository, RepositoryStatus
from app.models.symbol import CodeChunk, Symbol
from app.services.ingestion.importer import RepositoryImporter
from app.services.ingestion.pipeline import IngestionPipeline

router = APIRouter(prefix="/repositories", tags=["Repositories"])
logger = get_logger("api.routes.repositories")


async def run_pipeline_task(repo_id: uuid.UUID, job_id: uuid.UUID, clone_path: Path):
    from app.core.database import get_sessionmaker
    session_maker = get_sessionmaker()
    async with session_maker() as session:
        pipeline = IngestionPipeline(session)
        try:
            await pipeline.run(repo_id, job_id, clone_path)
        except Exception as e:
            logger.error(f"Background ingestion failed: {e}")


@router.post("/import", response_model=RepositoryResponse, status_code=status.HTTP_201_CREATED)
async def import_repository(
    request: ImportRepoRequest,
    db: DBSession,
    background_tasks: BackgroundTasks,
) -> RepositoryResponse:
    repo_name = request.name
    if not repo_name:
        # Extract from URL e.g. https://github.com/owner/repo.git -> repo
        clean_url = request.url.rstrip("/")
        if clean_url.endswith(".git"):
            clean_url = clean_url[:-4]
        repo_name = clean_url.split("/")[-1] or "imported-repo"

    repo_id = uuid.uuid4()
    job_id = uuid.uuid4()

    settings = get_settings()
    target_dir = Path(settings.REPOSITORY_STORAGE_PATH) / str(repo_id)

    db_repo = Repository(
        id=repo_id,
        workspace_id=request.workspace_id,
        name=repo_name,
        url=request.url,
        description=request.description,
        default_branch=request.branch or "main",
        clone_path=str(target_dir),
        status=RepositoryStatus.CLONING,
    )
    db.add(db_repo)

    db_job = IndexingJob(
        id=job_id,
        repository_id=repo_id,
        job_type=JobType.FULL,
        status=JobStatus.PENDING,
    )
    db.add(db_job)
    await db.commit()
    await db.refresh(db_repo)

    importer = RepositoryImporter()
    # In background: clone and run pipeline
    async def clone_and_run():
        try:
            cloned_path = await importer.clone_git_repo(
                repo_url=request.url,
                target_dir_name=str(repo_id),
                branch=request.branch,
            )
            await run_pipeline_task(repo_id, job_id, cloned_path)
        except Exception as err:
            logger.error(f"Cloning/ingestion failed for {repo_id}: {err}")
            from app.core.database import get_sessionmaker
            async with get_sessionmaker() as s:
                r = await s.get(Repository, repo_id)
                j = await s.get(IndexingJob, job_id)
                if r:
                    r.status = RepositoryStatus.FAILED
                if j:
                    j.status = JobStatus.FAILED
                    j.error_message = str(err)
                await s.commit()

    background_tasks.add_task(clone_and_run)
    return RepositoryResponse.model_validate(db_repo)


@router.post("/upload", response_model=RepositoryResponse, status_code=status.HTTP_201_CREATED)
async def upload_repository_zip(
    workspace_id: uuid.UUID,
    name: str,
    file: UploadFile = UploadFileField(...),
    db: DBSession = None,
    background_tasks: BackgroundTasks = None,
) -> RepositoryResponse:
    if not file.filename or not file.filename.endswith(".zip"):
        raise ValidationError("Uploaded file must be a .zip archive")

    repo_id = uuid.uuid4()
    job_id = uuid.uuid4()

    settings = get_settings()
    target_dir = Path(settings.REPOSITORY_STORAGE_PATH) / str(repo_id)

    db_repo = Repository(
        id=repo_id,
        workspace_id=workspace_id,
        name=name,
        url=None,
        description=f"Uploaded ZIP: {file.filename}",
        default_branch="main",
        clone_path=str(target_dir),
        status=RepositoryStatus.INDEXING,
    )
    db.add(db_repo)

    db_job = IndexingJob(
        id=job_id,
        repository_id=repo_id,
        job_type=JobType.FULL,
        status=JobStatus.PENDING,
    )
    db.add(db_job)
    await db.commit()
    await db.refresh(db_repo)

    # Save uploaded bytes to temp file then extract
    with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = Path(tmp.name)

    importer = RepositoryImporter()
    extracted_path = importer.extract_zip(tmp_path, str(repo_id))
    tmp_path.unlink(missing_ok=True)

    background_tasks.add_task(run_pipeline_task, repo_id, job_id, extracted_path)
    return RepositoryResponse.model_validate(db_repo)


@router.get("", response_model=List[RepositoryResponse])
async def list_repositories(db: DBSession, skip: int = 0, limit: int = 100) -> List[RepositoryResponse]:
    result = await db.execute(select(Repository).offset(skip).limit(limit))
    repos = result.scalars().all()
    return [RepositoryResponse.model_validate(r) for r in repos]


@router.get("/{id}", response_model=RepositoryResponse)
async def get_repository(id: uuid.UUID, db: DBSession) -> RepositoryResponse:
    repo = await db.get(Repository, id)
    if not repo:
        raise NotFoundError("Repository", id)
    return RepositoryResponse.model_validate(repo)


@router.get("/{id}/files", response_model=List[FileResponse])
async def list_repository_files(
    id: uuid.UUID,
    db: DBSession,
    skip: int = 0,
    limit: int = 500,
) -> List[FileResponse]:
    result = await db.execute(
        select(File).where(File.repository_id == id).offset(skip).limit(limit)
    )
    files = result.scalars().all()
    return [FileResponse.model_validate(f) for f in files]


@router.get("/{id}/files/{file_id}", response_model=FileDetailResponse)
async def get_file_detail(id: uuid.UUID, file_id: uuid.UUID, db: DBSession) -> FileDetailResponse:
    result = await db.execute(
        select(File)
        .where(File.id == file_id, File.repository_id == id)
        .options(selectinload(File.symbols), selectinload(File.chunks))
    )
    f = result.scalar_one_or_none()
    if not f:
        raise NotFoundError("File", file_id)

    symbol_responses = [SymbolResponse.model_validate(s) for s in f.symbols]
    return FileDetailResponse(
        id=f.id,
        repository_id=f.repository_id,
        path=f.path,
        filename=f.filename,
        extension=f.extension,
        language=f.language,
        size_bytes=f.size_bytes,
        line_count=f.line_count,
        is_binary=f.is_binary,
        symbols=symbol_responses,
        chunk_count=len(f.chunks),
    )


@router.get("/{id}/jobs", response_model=List[IndexingJobResponse])
async def list_indexing_jobs(id: uuid.UUID, db: DBSession) -> List[IndexingJobResponse]:
    result = await db.execute(
        select(IndexingJob).where(IndexingJob.repository_id == id).order_by(IndexingJob.created_at.desc())
    )
    jobs = result.scalars().all()
    return [IndexingJobResponse.model_validate(j) for j in jobs]


@router.get("/{id}/jobs/{job_id}", response_model=IndexingJobResponse)
async def get_job_status(id: uuid.UUID, job_id: uuid.UUID, db: DBSession) -> IndexingJobResponse:
    result = await db.execute(
        select(IndexingJob).where(IndexingJob.id == job_id, IndexingJob.repository_id == id)
    )
    job = result.scalar_one_or_none()
    if not job:
        raise NotFoundError("IndexingJob", job_id)
    return IndexingJobResponse.model_validate(job)


@router.post("/{id}/jobs/{job_id}/cancel", response_model=IndexingJobResponse)
async def cancel_job(id: uuid.UUID, job_id: uuid.UUID, db: DBSession) -> IndexingJobResponse:
    job = await db.get(IndexingJob, job_id)
    if not job or job.repository_id != id:
        raise NotFoundError("IndexingJob", job_id)

    if job.status in (JobStatus.COMPLETED, JobStatus.FAILED):
        raise ValidationError(f"Cannot cancel job in terminal state: {job.status.value}")

    job.status = JobStatus.CANCELLED
    await db.commit()
    await db.refresh(job)
    return IndexingJobResponse.model_validate(job)


@router.post("/{id}/jobs/{job_id}/retry", response_model=IndexingJobResponse)
async def retry_job(
    id: uuid.UUID,
    job_id: uuid.UUID,
    db: DBSession,
    background_tasks: BackgroundTasks,
) -> IndexingJobResponse:
    job = await db.get(IndexingJob, job_id)
    repo = await db.get(Repository, id)
    if not job or not repo or job.repository_id != id:
        raise NotFoundError("IndexingJob", job_id)

    if not repo.clone_path or not Path(repo.clone_path).exists():
        raise ValidationError("Repository source directory is not present to re-index")

    job.status = JobStatus.PENDING
    job.processed_files = 0
    job.failed_files = 0
    job.error_message = None
    repo.status = RepositoryStatus.INDEXING
    await db.commit()
    await db.refresh(job)

    background_tasks.add_task(run_pipeline_task, id, job_id, Path(repo.clone_path))
    return IndexingJobResponse.model_validate(job)
