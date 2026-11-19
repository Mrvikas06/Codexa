import asyncio
import os
import shutil
import subprocess
import zipfile
from pathlib import Path
from typing import Optional
from app.core.config import get_settings
from app.core.exceptions import IngestionError, ValidationError
from app.services.ingestion.path_utils import safe_join


class RepositoryImporter:
    """
    Safely clones remote git repositories or extracts uploaded ZIP archives
    into isolated local workspace directories.
    """

    def __init__(self, base_storage_dir: Optional[Path] = None):
        settings = get_settings()
        self.base_storage = (base_storage_dir or Path(settings.REPOSITORY_STORAGE_PATH)).resolve()
        self.base_storage.mkdir(parents=True, exist_ok=True)

    async def clone_git_repo(
        self,
        repo_url: str,
        target_dir_name: str,
        branch: Optional[str] = None,
        timeout_seconds: int = 120,
    ) -> Path:
        target_path = self.base_storage / target_dir_name
        if target_path.exists():
            shutil.rmtree(target_path, ignore_errors=True)
        target_path.mkdir(parents=True, exist_ok=True)

        cmd = ["git", "clone", "--depth", "1"]
        if branch:
            cmd.extend(["--branch", branch])
        cmd.extend([repo_url, str(target_path)])

        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=timeout_seconds,
            )

            if process.returncode != 0:
                err_msg = stderr.decode("utf-8", errors="replace").strip()
                raise IngestionError(
                    repository_id=target_dir_name,
                    reason=f"Git clone failed: {err_msg}",
                    details={"returncode": process.returncode, "cmd": " ".join(cmd)},
                )
        except asyncio.TimeoutError:
            raise IngestionError(
                repository_id=target_dir_name,
                reason=f"Git clone timed out after {timeout_seconds} seconds",
            )
        except Exception as e:
            if not isinstance(e, IngestionError):
                raise IngestionError(
                    repository_id=target_dir_name,
                    reason=f"Git clone error: {type(e).__name__} {str(e)}",
                )
            raise

        return target_path

    def extract_zip(
        self,
        zip_file_path: Path,
        target_dir_name: str,
    ) -> Path:
        target_path = self.base_storage / target_dir_name
        if target_path.exists():
            shutil.rmtree(target_path, ignore_errors=True)
        target_path.mkdir(parents=True, exist_ok=True)

        try:
            with zipfile.ZipFile(zip_file_path, "r") as zf:
                for member in zf.infolist():
                    # Protect against Zip-Slip traversal
                    dest_file = safe_join(target_path, member.filename)
                    if member.is_dir():
                        dest_file.mkdir(parents=True, exist_ok=True)
                    else:
                        dest_file.parent.mkdir(parents=True, exist_ok=True)
                        with zf.open(member) as src, open(dest_file, "wb") as dst:
                            shutil.copyfileobj(src, dst)
        except Exception as e:
            raise IngestionError(
                repository_id=target_dir_name,
                reason=f"Zip extraction failed: {str(e)}",
            )

        return target_path
