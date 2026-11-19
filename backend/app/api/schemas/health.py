from typing import Optional
from pydantic import BaseModel, Field


class ServiceStatus(BaseModel):
    status: str = Field(..., description="Operational status: healthy, degraded, or unhealthy")
    details: Optional[str] = Field(None, description="Additional context or error message")


class GPUServiceStatus(BaseModel):
    status: str = Field(..., description="Operational status: available, unavailable, or disabled")
    available: bool = Field(..., description="Whether CUDA GPU acceleration is currently available")
    name: Optional[str] = Field(None, description="Device name if detected")
    memory_mb: Optional[int] = Field(None, description="Total VRAM in MB")


class ServicesHealth(BaseModel):
    api: ServiceStatus
    database: ServiceStatus
    gpu: GPUServiceStatus


class HealthResponse(BaseModel):
    status: str = Field(..., description="Overall system status: healthy, degraded, or unhealthy")
    version: str = Field("0.1.0", description="API version")
    environment: str = Field(..., description="Active runtime environment")
    services: ServicesHealth
