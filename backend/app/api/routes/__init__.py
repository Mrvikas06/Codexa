from fastapi import APIRouter
from app.api.routes.health import router as health_router
from app.api.routes.ranking import router as ranking_router
from app.api.routes.repositories import router as repositories_router
from app.api.routes.search import router as search_router
from app.api.routes.conversations import router as conversations_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(repositories_router)
api_router.include_router(ranking_router)
api_router.include_router(search_router)
api_router.include_router(conversations_router)

__all__ = ["api_router"]
