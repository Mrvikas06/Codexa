from typing import Any, Dict, Optional
from fastapi import Request, status
from fastapi.responses import JSONResponse


class CodeAtlasError(Exception):
    """Base exception for all CodeAtlas errors."""

    def __init__(
        self,
        message: str,
        error_code: str = "INTERNAL_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}


class NotFoundError(CodeAtlasError):
    def __init__(self, resource: str, identifier: Any, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"{resource} '{identifier}' not found",
            error_code="NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            details=details,
        )


class ValidationError(CodeAtlasError):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            status_code=getattr(status, "HTTP_422_UNPROCESSABLE_CONTENT", 422),
            details=details,
        )


class IngestionError(CodeAtlasError):
    def __init__(self, repository_id: str, reason: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"Ingestion failed for repository '{repository_id}': {reason}",
            error_code="INGESTION_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details,
        )


class ModelError(CodeAtlasError):
    def __init__(self, model_name: str, reason: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"Model error in '{model_name}': {reason}",
            error_code="MODEL_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details,
        )


class RetrievalError(CodeAtlasError):
    def __init__(self, query: str, reason: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"Retrieval failed for query '{query}': {reason}",
            error_code="RETRIEVAL_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details,
        )


class AuthenticationError(CodeAtlasError):
    def __init__(self, message: str = "Could not validate credentials"):
        super().__init__(
            message=message,
            error_code="AUTHENTICATION_FAILED",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


async def codeatlas_exception_handler(request: Request, exc: CodeAtlasError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.error_code,
                "message": exc.message,
                "details": exc.details,
            }
        },
    )
