from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import api_router
from app.core.config import get_settings
from app.core.exceptions import CodeAtlasError, codeatlas_exception_handler
from app.core.logging import get_logger, setup_logging

logger = get_logger("app.main")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    settings = get_settings()
    setup_logging(log_level=settings.LOG_LEVEL)
    logger.info(f"Starting {settings.APP_NAME} in [{settings.APP_ENV}] mode")

    # Detect hardware
    try:
        import torch
        if torch.cuda.is_available():
            device_name = torch.cuda.get_device_name(0)
            vram_mb = int(torch.cuda.get_device_properties(0).total_memory / (1024 * 1024))
            logger.info(f"CUDA accelerator active: {device_name} ({vram_mb} MB VRAM)")
        else:
            logger.info("CUDA not active in current PyTorch environment (running CPU fallback)")
    except ImportError:
        logger.warning("PyTorch not installed in environment")
    except Exception as e:
        logger.error(f"Hardware detection error: {e}")

    yield

    logger.info(f"Shutting down {settings.APP_NAME}")


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=f"{settings.APP_NAME} API",
        description="Production-grade codebase intelligence engine API",
        version="0.1.0",
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Exception Handlers
    app.add_exception_handler(CodeAtlasError, codeatlas_exception_handler)

    # Mount API routes under /api/v1
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    return app


app = create_app()
