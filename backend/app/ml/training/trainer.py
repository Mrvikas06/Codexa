import math
import os
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional
import torch
import torch.nn as nn
from torch.optim import AdamW
from torch.optim.lr_scheduler import LambdaLR
from torch.utils.data import DataLoader

from app.core.logging import get_logger
from app.ml.device import get_device, get_memory_info
from app.ml.encoder.model import CodeEncoder
from app.ml.encoder.objectives import ContrastiveLoss, MaskedLanguageModelingLoss

logger = get_logger("ml.trainer")


def get_cosine_schedule_with_warmup(
    optimizer: torch.optim.Optimizer,
    num_warmup_steps: int,
    num_training_steps: int,
    min_lr_ratio: float = 0.1,
) -> LambdaLR:
    def lr_lambda(current_step: int):
        if current_step < num_warmup_steps:
            return float(current_step) / float(max(1, num_warmup_steps))
        progress = float(current_step - num_warmup_steps) / float(
            max(1, num_training_steps - num_warmup_steps)
        )
        cosine = 0.5 * (1.0 + math.cos(math.pi * progress))
        return max(min_lr_ratio, cosine)

    return LambdaLR(optimizer, lr_lambda)


class CodeEncoderTrainer:
    def __init__(
        self,
        model: CodeEncoder,
        train_dataloader: DataLoader,
        val_dataloader: Optional[DataLoader] = None,
        learning_rate: float = 3e-4,
        weight_decay: float = 0.01,
        gradient_accumulation_steps: int = 1,
        max_grad_norm: float = 1.0,
        checkpoint_dir: str = "./data/checkpoints/encoder",
        device_str: str = "auto",
        mlm_weight: float = 1.0,
        contrastive_weight: float = 0.5,
    ):
        self.device = get_device(device_str)
        self.model = model.to(self.device)
        self.train_dataloader = train_dataloader
        self.val_dataloader = val_dataloader
        self.gradient_accumulation_steps = max(1, gradient_accumulation_steps)
        self.max_grad_norm = max_grad_norm
        self.checkpoint_dir = Path(checkpoint_dir)
        self.checkpoint_dir.mkdir(parents=True, exist_ok=True)

        self.mlm_weight = mlm_weight
        self.contrastive_weight = contrastive_weight

        self.mlm_loss_fn = MaskedLanguageModelingLoss()
        self.contrastive_loss_fn = ContrastiveLoss()

        # Optimizer with weight decay excluding bias and LayerNorm
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
            input_ids = batch["input_ids"].to(self.device)
            attention_mask = batch["attention_mask"].to(self.device)
            mlm_labels = batch["mlm_labels"].to(self.device)

            outputs = self.model(input_ids, attention_mask)
            mlm_loss = self.mlm_loss_fn(outputs["mlm_logits"], mlm_labels)
            loss = self.mlm_weight * mlm_loss

            # Contrastive loss if query pairs exist
            if "query_input_ids" in batch and self.contrastive_weight > 0:
                q_ids = batch["query_input_ids"].to(self.device)
                q_mask = batch["query_attention_mask"].to(self.device)
                q_outputs = self.model(q_ids, q_mask)

                contrastive_loss = self.contrastive_loss_fn(
                    q_outputs["projected_output"],
                    outputs["projected_output"],
                )
                loss = loss + self.contrastive_weight * contrastive_loss

            # Scale loss for gradient accumulation
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

        avg_loss = total_loss / max(1, batch_count)
        return avg_loss

    def evaluate(self) -> float:
        if not self.val_dataloader:
            return 0.0

        self.model.eval()
        total_loss = 0.0
        batch_count = 0

        with torch.no_grad():
            for batch in self.val_dataloader:
                input_ids = batch["input_ids"].to(self.device)
                attention_mask = batch["attention_mask"].to(self.device)
                mlm_labels = batch["mlm_labels"].to(self.device)

                outputs = self.model(input_ids, attention_mask)
                loss = self.mlm_loss_fn(outputs["mlm_logits"], mlm_labels)
                total_loss += loss.item()
                batch_count += 1

        return total_loss / max(1, batch_count)

    def save_checkpoint(self, filename: str = "checkpoint.pt") -> Path:
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
        logger.info(f"Saved checkpoint to {save_path}")
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
        logger.info(f"Loaded checkpoint from {checkpoint_path} (step {self.global_step})")
