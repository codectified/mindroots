"""Embed Quran ayahs with intfloat/multilingual-e5-large (real safetensors weights).

Reads ayahs.jsonl (produced by export_ayahs.js), embeds each ayah's diacritized
Arabic text with the e5 "passage: " prefix, L2-normalizes (e5 is trained for
cosine similarity), and writes vectors + aligned metadata to local files.

The model is loaded from the existing HF cache under the sunnah.com project, so
nothing is re-downloaded. Runs on Apple MPS when available, else CPU.

Outputs (all in this directory):
  embeddings.npy   float32 [N, 1024], row i aligns with meta.jsonl line i
  meta.jsonl       one ayah record per line, same order as embeddings.npy
  manifest.json    run config (model, dims, prefix, normalize, count, device)
"""

import json
import os
import time
from pathlib import Path

# Reuse the already-downloaded model from the sunnah.com HF cache (no re-download).
HF_CACHE = "/Users/omaribrahim/dev/sunnah.com/search/data/hf-cache"
os.environ.setdefault("HF_HOME", HF_CACHE)
os.environ.setdefault("HF_HUB_OFFLINE", "1")  # fail loudly rather than silently fetch

import numpy as np
from sentence_transformers import SentenceTransformer

HERE = Path(__file__).parent
MODEL_ID = "intfloat/multilingual-e5-large"
PASSAGE_PREFIX = "passage: "  # e5 asymmetric retrieval: documents use "passage: "
BATCH_SIZE = 32


def pick_device():
    import torch

    if torch.backends.mps.is_available():
        return "mps"
    if torch.cuda.is_available():
        return "cuda"
    return "cpu"


def main():
    rows = []
    with open(HERE / "ayahs.jsonl", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    print(f"Loaded {len(rows)} ayahs")

    device = pick_device()
    print(f"Loading {MODEL_ID} on {device} (from {HF_CACHE}) ...")
    model = SentenceTransformer(MODEL_ID, device=device)
    dims = model.get_sentence_embedding_dimension()
    print(f"Model ready, dims={dims}")

    texts = [PASSAGE_PREFIX + r["text"] for r in rows]

    t0 = time.time()
    emb = model.encode(
        texts,
        batch_size=BATCH_SIZE,
        normalize_embeddings=True,  # cosine-ready unit vectors
        show_progress_bar=True,
        convert_to_numpy=True,
    ).astype(np.float32)
    dur = time.time() - t0
    print(f"Embedded {len(texts)} ayahs in {dur:.1f}s ({len(texts)/dur:.1f}/s)")

    np.save(HERE / "embeddings.npy", emb)
    with open(HERE / "meta.jsonl", "w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    manifest = {
        "model": MODEL_ID,
        "dims": int(dims),
        "count": len(rows),
        "passage_prefix": PASSAGE_PREFIX,
        "query_prefix": "query: ",
        "normalized": True,
        "similarity": "cosine (dot product on normalized vectors)",
        "device": device,
        "dtype": "float32",
        "text_variant": "diacritized arabic (full_arabic, as-is)",
        "embed_seconds": round(dur, 1),
    }
    with open(HERE / "manifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print(f"Saved embeddings.npy {emb.shape} {emb.dtype}")
    print(f"Saved meta.jsonl and manifest.json")


if __name__ == "__main__":
    main()
