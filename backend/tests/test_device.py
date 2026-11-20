import pytest
import torch
from app.core.exceptions import ModelError
from app.ml.device import get_device, get_memory_info


def test_get_device_cpu():
    dev = get_device("cpu")
    assert dev.type == "cpu"


def test_get_device_auto():
    dev = get_device("auto")
    assert dev.type in ("cpu", "cuda")


def test_get_device_invalid():
    with pytest.raises(ModelError):
        get_device("tpu_or_quantum")


def test_get_device_cuda_explicit_check():
    if not torch.cuda.is_available():
        with pytest.raises(ModelError) as exc_info:
            get_device("cuda")
        assert "Explicit CUDA device requested" in str(exc_info.value.message)
    else:
        dev = get_device("cuda")
        assert dev.type == "cuda"


def test_get_memory_info():
    dev = torch.device("cpu")
    alloc, res = get_memory_info(dev)
    assert alloc is None
    assert res is None
