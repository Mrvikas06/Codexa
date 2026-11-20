import argparse
import sys
from pathlib import Path
import yaml
from torch.utils.data import DataLoader

from app.core.logging import get_logger, setup_logging
from app.ml.datasets.code_dataset import CodeCollateFn, CodeDataset
from app.ml.device import get_device
from app.ml.encoder.config import CodeEncoderConfig
from app.ml.encoder.model import CodeEncoder
from app.ml.tokenizer.bpe import ByteLevelBPETokenizer
from app.ml.training.trainer import CodeEncoderTrainer, get_cosine_schedule_with_warmup

logger = get_logger("ml.train_encoder")


def main():
    parser = argparse.ArgumentParser(description="Train CodeAtlas Code Encoder (Model A)")
    parser.add_argument("--config", type=str, default="configs/encoder.yaml", help="Path to YAML config")
    parser.add_argument("--output", type=str, default="checkpoints/encoder", help="Output directory")
    parser.add_argument("--device", type=str, default="auto", help="Compute device: auto, cuda, cpu")
    parser.add_argument("--epochs", type=int, default=5, help="Number of epochs")
    args = parser.parse_args()

    setup_logging(log_level="INFO")
    logger.info("Initializing CodeAtlas Encoder training...")

    device = get_device(args.device)
    logger.info(f"Training device: {device}")

    # Load YAML config if present
    cfg_data = {}
    cfg_path = Path(args.config)
    if cfg_path.is_file():
        with open(cfg_path, "r", encoding="utf-8") as f:
            cfg_data = yaml.safe_load(f) or {}

    config = CodeEncoderConfig(
        vocab_size=cfg_data.get("vocab_size", 16000),
        hidden_size=cfg_data.get("hidden_size", 256),
        num_layers=cfg_data.get("num_layers", 6),
        num_heads=cfg_data.get("num_heads", 4),
        intermediate_size=cfg_data.get("intermediate_size", 1024),
        max_seq_len=cfg_data.get("max_sequence_length", 512),
        dropout=cfg_data.get("dropout", 0.1),
    )

    tokenizer = ByteLevelBPETokenizer(vocab_size=config.vocab_size)
    model = CodeEncoder(config)
    logger.info(f"Model initialized: {model.total_params:,} parameters")

    logger.info("Encoder training module ready for execution.")


if __name__ == "__main__":
    main()
