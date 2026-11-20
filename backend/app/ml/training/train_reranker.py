import argparse
from pathlib import Path
import yaml
from torch.utils.data import DataLoader

from app.core.logging import get_logger, setup_logging
from app.ml.datasets.reranker_dataset import RerankerCollateFn, RerankerPairwiseDataset
from app.ml.device import get_device
from app.ml.reranker.config import RerankerConfig
from app.ml.reranker.model import CrossEncoderReranker
from app.ml.tokenizer.bpe import ByteLevelBPETokenizer
from app.ml.training.reranker_trainer import RerankerTrainer

logger = get_logger("ml.train_reranker")


def main():
    parser = argparse.ArgumentParser(description="Train Cross-Encoder Neural Reranker (Model B)")
    parser.add_argument("--config", type=str, default="configs/reranker.yaml", help="Path to config YAML")
    parser.add_argument("--output", type=str, default="checkpoints/reranker", help="Output directory")
    parser.add_argument("--device", type=str, default="auto", help="Device: auto, cuda, cpu")
    parser.add_argument("--epochs", type=int, default=5, help="Number of epochs")
    args = parser.parse_args()

    setup_logging(log_level="INFO")
    logger.info("Initializing Cross-Encoder Reranker training pipeline...")

    device = get_device(args.device)
    logger.info(f"Reranker training device: {device}")

    config = RerankerConfig()
    tokenizer = ByteLevelBPETokenizer(vocab_size=config.vocab_size)
    model = CrossEncoderReranker(config)

    logger.info(f"Cross-Encoder initialized: {model.total_params:,} parameters")
    logger.info("Reranker training module ready.")


if __name__ == "__main__":
    main()
