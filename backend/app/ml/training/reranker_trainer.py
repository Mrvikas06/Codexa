from pathlib import Path
from typing import Dict, List, Optional
import torch
import torch.nn as nn
from torch.optim import AdamW
from torch.optim.lr_scheduler import LambdaLR
from torch.utils.data import DataLoader

from app.core.logging import get_logger
from app.ml.device import get_device
from app.ml.reranker.model import CrossEncoderReranker
from app.ml.reranker.objectives import PairwiseMarginRankingLoss
from app.ml.training.trainer import get_cosine_schedule_with_warmup

logger = get_logger("ml.reranker_trainer")


class RerankerTrainer:
    def __init__(
        self,
        model: CrossEncoderReranker,
        train_dataloader: DataLoader,
        val_dataloader: Optional[DataLoader] = None,
        learning_rate: float = 2e-4,
        weight_decay: float = 0.01,
        margin: float = 1.0,
        gradient_accumulation_steps: int = 1,
        max_grad_norm: float = 1.0,
        checkpoint_dir: str = "./data/checkpoints/reranker",
        device_str: str = "auto",
    ):
        self.device = get_device(device_str)
        self.model = model.to(self.device)
        self.train_dataloader = train_dataloader
        self.val_dataloader = val_dataloader
        self.gradient_accumulation_steps = max(1, gradient_accumulation_steps)
        self.max_grad_norm = max_grad_norm
        self.checkpoint_dir = Path(checkpoint_dir)
        self.checkpoint_dir.mkdir(parents=True, exist_ok=True)

        self.loss_fn = PairwiseMarginRankingLoss(margin=margin)

        decay_params = []
        no_decay_params = []
        for name, param in self.model.named_parameters():
            if not param.requires_grad:
                continue
            if "norm" in name.lower() or "bias" in name.lower():
                no_decay_params.append(param)
            else:
                decay_params.append(param)

        self.optimizer = AdamW(
            [
                {"params": decay_params, "weight_decay": weight_decay},
                {"params": no_decay_params, "weight_decay": 0.0},
            ],
            lr=learning_rate,
        )

        self.global_step = 0
        self.current_epoch = 0
        self.best_val_loss = float("inf")

    def train_epoch(self, scheduler: Optional[LambdaLR] = None) -> float:
        self.model.train()
        total_loss = 0.0
        batch_count = 0

        self.optimizer.zero_grad()

        for step, batch in enumerate(self.train_dataloader):
            pos_ids = batch["pos_input_ids"].to(self.device)
            pos_mask = batch["pos_attention_mask"].to(self.device)
            neg_ids = batch["neg_input_ids"].to(self.device)
            neg_mask = batch["neg_attention_mask"].to(self.device)

            pos_scores = self.model(pos_ids, pos_mask)
            neg_scores = self.model(neg_ids, neg_mask)

            loss = self.loss_fn(pos_scores, neg_scores)
            loss = loss / self.gradient_accumulation_steps
            loss.backward()

            total_loss += loss.item() * self.gradient_accumulation_steps
            batch_count += 1

            if (step + 1) % self.gradient_accumulation_steps == 0:
                torch.nn.utils.clip_grad_norm_(self.model.parameters(), self.max_grad_norm)
                self.optimizer.step()
                if scheduler:
                    scheduler.step()
                self.optimizer.zero_grad()
                self.global_step += 1

        return total_loss / max(1, batch_count)

    def evaluate(self) -> Dict[str, float]:
        if not self.val_dataloader:
            return {"val_loss": 0.0, "pairwise_acc": 0.0}

        self.model.eval()
        total_loss = 0.0
        correct_pairs = 0
        total_pairs = 0

        with torch.no_grad():
            for batch in self.val_dataloader:
                pos_ids = batch["pos_input_ids"].to(self.device)
                pos_mask = batch["pos_attention_mask"].to(self.device)
                neg_ids = batch["neg_input_ids"].to(self.device)
                neg_mask = batch["neg_attention_mask"].to(self.device)

                pos_scores = self.model(pos_ids, pos_mask).view(-1)
                neg_scores = self.model(neg_ids, neg_mask).view(-1)

                loss = self.loss_fn(pos_scores, neg_scores)
                total_loss += loss.item()

                correct_pairs += (pos_scores > neg_scores).sum().item()
                total_pairs += pos_scores.numel()

        avg_loss = total_loss / max(1, len(self.val_dataloader))
        pairwise_acc = correct_pairs / max(1, total_pairs)
        return {"val_loss": avg_loss, "pairwise_acc": pairwise_acc}

    def save_checkpoint(self, filename: str = "reranker_best.pt") -> Path:
        save_path = self.checkpoint_dir / filename
        torch.save(
            {
                "model_state_dict": self.model.state_dict(),
                "optimizer_state_dict": self.optimizer.state_dict(),
                "global_step": self.global_step,
                "current_epoch": self.current_epoch,
                "best_val_loss": self.best_val_loss,
                "config": vars(self.model.config),
            },
            save_path,
        )
        logger.info(f"Saved reranker checkpoint to {save_path}")
        return save_path

    def load_checkpoint(self, checkpoint_path: Path) -> None:
        try:
            checkpoint = torch.load(checkpoint_path, map_location=self.device, weights_only=False)
        except TypeError:
            checkpoint = torch.load(checkpoint_path, map_location=self.device)

        self.model.load_state_dict(checkpoint["model_state_dict"])
        self.optimizer.load_state_dict(checkpoint["optimizer_state_dict"])
        self.global_step = checkpoint.get("global_step", 0)
        self.current_epoch = checkpoint.get("current_epoch", 0)
        self.best_val_loss = checkpoint.get("best_val_loss", float("inf"))
        logger.info(f"Loaded reranker checkpoint from {checkpoint_path} (step {self.global_step})")
