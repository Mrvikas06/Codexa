import uuid
from pathlib import Path
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.file import File
from app.models.indexing import IndexingJob, JobStatus, JobType
from app.models.repository import Repository, RepositoryStatus
from app.models.symbol import CodeChunk, Symbol
from app.models.user import User
from app.models.workspace import Workspace
from app.services.ingestion.pipeline import IngestionPipeline


@pytest.mark.asyncio
async def test_ingestion_pipeline_end_to_end(db_session: AsyncSession, tmp_path: Path):
    # 1. Prepare fake repository on disk
    repo_dir = tmp_path / "mock_repo"
    repo_dir.mkdir()
    (repo_dir / "src").mkdir()

    py_file = repo_dir / "src" / "auth.py"
    py_file.write_text(
        "class AuthManager:\n"
        "    def login(self, u, p):\n"
        "        return True\n",
        encoding="utf-8",
    )

    readme = repo_dir / "README.md"
    readme.write_text("# Mock Repo\nDocumentation here.\n", encoding="utf-8")

    # Ignored directory
    git_dir = repo_dir / ".git"
    git_dir.mkdir()
    (git_dir / "config").write_text("some-git-config", encoding="utf-8")

    # 2. Database records
    user = User(email="test@pipeline.ai", username="pipeuser", hashed_password="pw")
    db_session.add(user)
    await db_session.flush()

    ws = Workspace(name="WS", owner_id=user.id)
    db_session.add(ws)
    await db_session.flush()

    repo = Repository(
        workspace_id=ws.id,
        name="mock_repo",
        clone_path=str(repo_dir),
        status=RepositoryStatus.PENDING,
    )
    db_session.add(repo)
    await db_session.flush()

    job = IndexingJob(
        repository_id=repo.id,
        job_type=JobType.FULL,
        status=JobStatus.PENDING,
    )
    db_session.add(job)
    await db_session.commit()

    # 3. Run Pipeline
    pipeline = IngestionPipeline(db_session)
    await pipeline.run(repo.id, job.id, repo_dir)

    # 4. Assertions
    await db_session.refresh(repo)
    await db_session.refresh(job)

    assert repo.status == RepositoryStatus.INDEXED
    assert job.status == JobStatus.COMPLETED
    assert job.total_files == 2  # auth.py and README.md (.git is ignored)
    assert job.processed_files == 2

    files_res = await db_session.execute(select(File).where(File.repository_id == repo.id))
    files = files_res.scalars().all()
    assert len(files) == 2
    paths = [f.path for f in files]
    assert "src/auth.py" in paths
    assert "README.md" in paths

    symbols_res = await db_session.execute(select(Symbol))
    symbols = symbols_res.scalars().all()
    sym_names = [s.name for s in symbols]
    assert "AuthManager" in sym_names
    assert "login" in sym_names

    chunks_res = await db_session.execute(select(CodeChunk))
    chunks = chunks_res.scalars().all()
    assert len(chunks) > 0
