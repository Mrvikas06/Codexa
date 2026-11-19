import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.indexing import IndexingJob, JobStatus, JobType
from app.models.repository import Repository, RepositoryStatus
from app.models.user import User
from app.models.workspace import Workspace


@pytest.mark.asyncio
async def test_repository_api_endpoints(client: AsyncClient, db_session: AsyncSession):
    # Setup test workspace & repo
    user = User(email="api@codeatlas.ai", username="apiuser", hashed_password="pw")
    db_session.add(user)
    await db_session.flush()

    ws = Workspace(name="API Workspace", owner_id=user.id)
    db_session.add(ws)
    await db_session.flush()

    repo = Repository(
        workspace_id=ws.id,
        name="test_repo",
        url="https://github.com/example/test_repo",
        status=RepositoryStatus.INDEXED,
        total_files=10,
    )
    db_session.add(repo)
    await db_session.flush()

    job = IndexingJob(
        repository_id=repo.id,
        job_type=JobType.FULL,
        status=JobStatus.RUNNING,
        total_files=10,
        processed_files=5,
    )
    db_session.add(job)
    await db_session.commit()

    # 1. List repos
    res = await client.get("/api/v1/repositories")
    assert res.status_code == 200
    repos = res.json()
    assert any(r["id"] == str(repo.id) for r in repos)

    # 2. Get repo
    res = await client.get(f"/api/v1/repositories/{repo.id}")
    assert res.status_code == 200
    assert res.json()["name"] == "test_repo"

    # 3. Get job status
    res = await client.get(f"/api/v1/repositories/{repo.id}/jobs/{job.id}")
    assert res.status_code == 200
    assert res.json()["status"] == "running"
    assert res.json()["processed_files"] == 5

    # 4. Cancel job
    res = await client.post(f"/api/v1/repositories/{repo.id}/jobs/{job.id}/cancel")
    assert res.status_code == 200
    assert res.json()["status"] == "cancelled"
