import argparse
import json
from pathlib import Path

from app.core.logging import get_logger, setup_logging
from app.ml.device import get_device
from app.ml.evaluation.reranker_eval import evaluate_reranker
from app.ml.reranker.config import RerankerConfig
from app.ml.reranker.model import CrossEncoderReranker
from app.ml.tokenizer.bpe import ByteLevelBPETokenizer

logger = get_logger("ml.eval_reranker")


def main():
    parser = argparse.ArgumentParser(description="Evaluate Cross-Encoder Neural Reranker (Model B)")
    parser.add_argument("--checkpoint", type=str, required=False, help="Checkpoint path")
    parser.add_argument("--benchmark", type=str, default="benchmarks/ranking_v1.json", help="Ranking benchmark JSON")
    parser.add_argument("--device", type=str, default="auto", help="Compute device: auto, cuda, cpu")
    args = parser.parse_args()

    setup_logging(log_level="INFO")
    logger.info("Initializing CodeAtlas Neural Reranker evaluation...")

    bench_path = Path(args.benchmark)
    if not bench_path.is_file():
        logger.error(f"Benchmark file not found: {args.benchmark}")
        return

    with open(bench_path, "r", encoding="utf-8") as f:
        bench_data = json.load(f)

    samples = bench_data.get("samples", [])
    logger.info(f"Loaded {len(samples)} ranking benchmark queries from {args.benchmark}")

    device = get_device(args.device)
    tokenizer = ByteLevelBPETokenizer(vocab_size=16000)
    config = RerankerConfig()
    model = CrossEncoderReranker(config)

    metrics = evaluate_reranker(model, tokenizer, samples, device)
    logger.info("Reranker Benchmark Results:")
    logger.info(f"  Pairwise Accuracy: {metrics['pairwise_accuracy']:.4f}")
    logger.info(f"  MRR:               {metrics['mrr']:.4f}")
    logger.info(f"  NDCG@5:            {metrics['ndcg@5']:.4f}")
    logger.info(f"  Precision@1:       {metrics['precision@1']:.4f}")
    logger.info(f"  Precision@5:       {metrics['precision@5']:.4f}")


if __name__ == "__main__":
    main()
