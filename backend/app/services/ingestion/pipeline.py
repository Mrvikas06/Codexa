import asyncio
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import IngestionError
from app.core.logging import get_logger
from app.models.file import File
from app.models.indexing import IndexingJob, JobStatus
from app.models.repository import Repository, RepositoryStatus
from app.models.symbol import CodeChunk, Dependency, Symbol
from app.services.ingestion.chunker import SemanticChunker
from app.services.ingestion.detector import inspect_file
from app.services.ingestion.ignore import IgnoreEngine
from app.services.ingestion.parser.registry import get_parser
from app.services.ingestion.relationship_extractor import extract_relationships
from app.services.ingestion.symbol_extractor import extract_symbols

logger = get_logger("services.ingestion.pipeline")


class IngestionPipeline:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.chunker = SemanticChunker()

    async def run(
        self,
        repository_id: uuid.UUID,
        job_id: uuid.UUID,
        repo_root: Path,
    ) -> None:
        logger.info(f"Starting ingestion pipeline for repository {repository_id}, job {job_id}")

        # Fetch repository and job
        repo_result = await self.session.execute(
            select(Repository).where(Repository.id == repository_id)
        )
        repo = repo_result.scalar_one_or_none()
        if not repo:
            raise IngestionError(str(repository_id), "Repository record not found")

        job_result = await self.session.execute(
            select(IndexingJob).where(IndexingJob.id == job_id)
        )
        job = job_result.scalar_one_or_none()
        if not job:
            raise IngestionError(str(repository_id), "Indexing job record not found")

        # Mark job running
        job.status = JobStatus.RUNNING
        job.started_at = datetime.now(timezone.utc)
        repo.status = RepositoryStatus.INDEXING
        await self.session.commit()

        try:
            # 1. File discovery & Ignore Engine
            ignore_engine = IgnoreEngine(repo_root)
            discovered_paths: List[Path] = []

            for root, dirs, files in os.walk(repo_root):
                rel_root = Path(root).relative_to(repo_root)
                # Filter directories in-place to prevent traversing ignored subtrees
                dirs[:] = [
                    d for d in dirs
                    if not ignore_engine.is_ignored(
                        str((rel_root / d).as_posix()), is_dir=True
                    )
                ]

                for file_name in files:
                    rel_file = (rel_root / file_name).as_posix()
                    if not ignore_engine.is_ignored(rel_file):
                        discovered_paths.append(Path(root) / file_name)

            job.total_files = len(discovered_paths)
            repo.total_files = len(discovered_paths)
            await self.session.commit()

            total_functions = 0
            total_classes = 0

            # 2. Process each file
            for idx, file_path in enumerate(discovered_paths):
                # Check for job cancellation
                await self.session.refresh(job)
                if job.status == JobStatus.CANCELLED:
                    logger.info(f"Job {job_id} was cancelled by user")
                    return

                rel_path = file_path.relative_to(repo_root).as_posix()
                job.current_file = rel_path

                is_bin, language, size_bytes, content_hash, line_count = inspect_file(file_path)

                # Persist File model
                db_file = File(
                    id=uuid.uuid4(),
                    repository_id=repository_id,
                    path=rel_path,
                    filename=file_path.name,
                    extension=file_path.suffix.lower(),
                    language=language,
                    size_bytes=size_bytes,
                    content_hash=content_hash,
                    line_count=line_count,
                    is_binary=is_bin,
                )
                self.session.add(db_file)
                await self.session.flush()

                # If text file, read and parse AST
                if not is_bin and size_bytes > 0:
                    try:
                        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                            code_content = f.read()

                        parser = get_parser(language)
                        parsed = parser.parse(code_content, file_path=rel_path)

                        # Extract Symbols
                        db_symbols, symbol_map = extract_symbols(db_file.id, parsed.symbols)
                        for sym in db_symbols:
                            self.session.add(sym)
                            if sym.symbol_type.value in ("function", "method"):
                                total_functions += 1
                            elif sym.symbol_type.value == "class":
                                total_classes += 1
                        await self.session.flush()

                        # Extract Relationships (dependencies)
                        db_dependencies = extract_relationships(parsed.symbols, symbol_map)
                        for dep in db_dependencies:
                            self.session.add(dep)
                        await self.session.flush()

                        # Semantic Chunking
                        chunks = self.chunker.chunk_file(
                            file_id=db_file.id,
                            repository_id=repository_id,
                            file_path=rel_path,
                            content=code_content,
                            language=language,
                            symbols=db_symbols,
                            parsed_symbols=parsed.symbols,
                        )
                        for ch in chunks:
                            self.session.add(ch)

                    except Exception as parse_err:
                        logger.warning(f"Error parsing file {rel_path}: {parse_err}")

                job.processed_files = idx + 1
                if idx % 10 == 0:
                    await self.session.commit()

            # Complete indexing
            repo.total_functions = total_functions
            repo.total_classes = total_classes
            repo.status = RepositoryStatus.INDEXED
            job.status = JobStatus.COMPLETED
            job.completed_at = datetime.now(timezone.utc)
            job.current_file = None
            await self.session.commit()
            logger.info(f"Ingestion pipeline completed successfully for repo {repository_id}")

        except Exception as e:
            logger.error(f"Ingestion pipeline failed for repo {repository_id}: {e}", exc_info=True)
            job.status = JobStatus.FAILED
            job.error_message = str(e)
            job.completed_at = datetime.now(timezone.utc)
            repo.status = RepositoryStatus.FAILED
            await self.session.commit()
            raise
