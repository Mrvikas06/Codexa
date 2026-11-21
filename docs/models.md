# Neural Models Architecture

Codexa trains three neural models from random initialization without third-party API dependencies.

## Model A: Code Encoder
- **Architecture**: 6 Transformer encoder blocks, hidden size 256, 4 attention heads, intermediate size 1024.
- **Positional Embeddings**: Rotary Position Embeddings (RoPE).
- **Tokenizer**: Custom Byte-Level BPE (16,000 vocabulary size).
- **Training Objectives**:
  - Masked Language Modeling (MLM, 15% masking).
  - InfoNCE Contrastive Loss with dynamic batch negatives.
- **Pooling**: Mean pooling with projection head (256 -> 128).

## Model B: Neural Cross-Encoder Reranker
- **Architecture**: 6 Transformer blocks, hidden size 256, 4 attention heads, intermediate size 1024.
- **Input Format**: Joint tokenization `<BOS> query <SEP> candidate_code <EOS>`.
- **Head**: Linear projection (`256 -> 1`) with Sigmoid scoring.
- **Training Objectives**:
  - Pairwise Margin Ranking Loss with hard negative mining.
  - Pointwise Binary Cross Entropy (BCE).

## Model C: Causal Decoder LM
- **Architecture**: 6 Causal Decoder blocks, hidden size 256, 4 attention heads, intermediate size 1024.
- **Normalization**: RMSNorm (`eps=1e-6`).
- **Activation**: SwiGLU feed-forward network.
- **Weight Tying**: Output LM head ties weights with token embeddings.
- **Attention**: Lower triangular causal mask preventing future token access.
