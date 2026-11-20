import os
from typing import Optional, Tuple
import torch
from app.core.exceptions import ModelError
from app.core.logging import get_logger

logger = get_logger("ml.device")


def get_device(requested_device: str = "auto") -> torch.device:
    """
    Resolves compute device.
    If requested_device is 'cuda', CUDA MUST be available.
    Never silently falls back to CPU if 'cuda' was explicitly requested.
    If 'auto', selects CUDA if available, otherwise CPU.
    """
    req = requested_device.lower().strip()

    if req == "cuda":
        if not torch.cuda.is_available():
            raise ModelError(
                "device_selection",
                "Explicit CUDA device requested, but torch.cuda.is_available() is False",
                details={"cuda_available": False, "device_count": torch.cuda.device_count()},
            )
        device = torch.device("cuda:0")
        name = torch.cuda.get_device_name(0)
        logger.info(f"Using explicitly requested CUDA device: {name}")
        return device

    elif req == "cpu":
        logger.info("Using explicitly requested CPU device")
        return torch.device("cpu")

    elif req == "auto":
        if torch.cuda.is_available():
            device = torch.device("cuda:0")
            name = torch.cuda.get_device_name(0)
            logger.info(f"Auto-selected CUDA device: {name}")
            return device
        else:
            logger.info("CUDA not available; auto-selected CPU")
            return torch.device("cpu")

    else:
        raise ModelError(
            "device_selection",
            f"Unknown device specification: '{requested_device}'. Must be 'cuda', 'cpu', or 'auto'",
        )


def get_memory_info(device: torch.device) -> Tuple[Optional[float], Optional[float]]:
    """
    Returns (allocated_mb, reserved_mb) for CUDA device, or (None, None) for CPU.
    """
    if device.type == "cuda" and torch.cuda.is_available():
        allocated = torch.cuda.memory_allocated(device) / (1024 * 1024)
        reserved = torch.cuda.memory_reserved(device) / (1024 * 1024)
        return allocated, reserved
    return None, None
