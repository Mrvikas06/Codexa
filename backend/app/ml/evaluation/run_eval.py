import argparse
import json
from pathlib import Path
import torch

from app.core.logging import get_logger, setup_logging
from app.ml.device import get_device
from app.ml.encoder.config import CodeEncoderConfig
from app.ml.encoder.model import CodeEncoder
from app.ml.evaluation.encoder_eval import evaluate_code_retrieval
from app.ml.tokenizer.bpe import ByteLevelBPETokenizer

logger = get_logger("ml.run_eval")


def main():
    parser = argparse.ArgumentParser(description="Evaluate CodeAtlas Code Encoder (Model A)")
    parser.add_argument("--checkpoint", type=str, required=False, help="Model checkpoint path")
    parser.add_argument("--benchmark", type=str, default="benchmarks/retrieval_v1.json", help="Benchmark JSON path")
    parser.add_argument("--device", type=str, default="auto", help="Compute device: auto, cuda, cpu")
    args = parser.parse_args()

    setup_logging(log_level="INFO")
    logger.info("Initializing CodeAtlas Encoder evaluation...")

    bench_path = Path(args.benchmark)
    if not bench_path.is_file():
        logger.error(f"Benchmark file not found: {args.benchmark}")
        return

    with open(bench_path, "r", encoding="utf-8") as f:
        bench_data = json.load(f)

    pairs = [(item["query"], item["code"]) for item in bench_data.get("test_pairs", [])]
    logger.info(f"Loaded {len(pairs)} benchmark test pairs from {args.benchmark}")

    device = get_device(args.device)
    tokenizer = ByteLevelBPETokenizer(vocab_size=16000)
    config = CodeEncoderConfig()
    model = CodeEncoder(config)

    metrics = evaluate_code_retrieval(model, tokenizer, pairs, device)
    logger.info(f"Evaluation Results:")
    logger.info(f"  Recall@5:  {metrics['recall@5']:.4f}")
    logger.info(f"  Recall@10: {metrics['recall@10']:.4f}")
    logger.info(f"  MRR:       {metrics['mrr']:.4f}")
    logger.info(f"  NDCG@10:   {metrics['ndcg@10']:.4f}")


if __name__ == "__main__":
    main()
