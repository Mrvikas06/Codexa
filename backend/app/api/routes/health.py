from fastapi import APIRouter
from sqlalchemy import text
from app.api.schemas.health import (
    GPUServiceStatus,
    HealthResponse,
    ServicesHealth,
    ServiceStatus,
)
from app.core.config import get_settings
from app.core.database import get_sessionmaker

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def check_health() -> HealthResponse:
    settings = get_settings()

    # 1. API status
    api_status = ServiceStatus(status="healthy", details="API operational")

    # 2. Database status
    db_status = ServiceStatus(status="healthy", details="Connected")
    try:
        session_factory = get_sessionmaker()
        async with session_factory() as session:
            await session.execute(text("SELECT 1"))
    except Exception as e:
        db_status = ServiceStatus(
            status="unhealthy",
            details=f"Database unreachable: {type(e).__name__}",
        )

    # 3. GPU / Hardware detection
    gpu_available = False
    gpu_name = None
    gpu_memory_mb = None
    gpu_details = "CPU mode"

    try:
        import torch
        if torch.cuda.is_available():
            gpu_available = True
            gpu_name = torch.cuda.get_device_name(0)
            gpu_memory_mb = int(torch.cuda.get_device_properties(0).total_memory / (1024 * 1024))
            gpu_details = f"{gpu_name} ({gpu_memory_mb} MB VRAM)"
        else:
            gpu_details = "CUDA not available in current PyTorch build"
    except ImportError:
        gpu_details = "PyTorch not installed"
    except Exception as e:
        gpu_details = f"Detection error: {str(e)}"

    gpu_status = GPUServiceStatus(
        status="available" if gpu_available else "unavailable",
        available=gpu_available,
        name=gpu_name,
        memory_mb=gpu_memory_mb,
    )

    overall_status = "healthy"
    if db_status.status == "unhealthy":
        overall_status = "degraded"

    return HealthResponse(
        status=overall_status,
        version="0.1.0",
        environment=settings.APP_ENV,
        services=ServicesHealth(
            api=api_status,
            database=db_status,
            gpu=gpu_status,
        ),
    )
