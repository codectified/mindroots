"""Semantic search over the embedded ayahs.

Loads embeddings.npy + meta.jsonl, embeds the query with the e5 "query: " prefix,
and returns the top-k ayahs by cosine similarity. Works cross-lingual: an English
query retrieves Arabic ayahs, since multilingual-e5 shares one vector space.

Usage:
  ./venv/bin/python search.py "the mercy of God" 5
  ./venv/bin/python search.py "يوم القيامة"
"""

import json
import os
import sys
from pathlib import Path

HF_CACHE = "/Users/omaribrahim/dev/sunnah.com/search/data/hf-cache"
os.environ.setdefault("HF_HOME", HF_CACHE)
os.environ.setdefault("HF_HUB_OFFLINE", "1")

import numpy as np
from sentence_transformers import SentenceTransformer

HERE = Path(__file__).parent
MODEL_ID = "intfloat/multilingual-e5-large"
QUERY_PREFIX = "query: "


def load():
    emb = np.load(HERE / "embeddings.npy")  # already L2-normalized
    meta = []
    with open(HERE / "meta.jsonl", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                meta.append(json.loads(line))
    return emb, meta


def search(query, k=5):
    emb, meta = load()
    model = SentenceTransformer(MODEL_ID)
    qv = model.encode(
        [QUERY_PREFIX + query], normalize_embeddings=True, convert_to_numpy=True
    )[0].astype(np.float32)
    scores = emb @ qv  # cosine (both normalized)
    top = np.argsort(-scores)[:k]
    print(f"\nQuery: {query!r}\n" + "=" * 60)
    for rank, i in enumerate(top, 1):
        m = meta[i]
        print(f"{rank}. [{m['ayah_key']}] cos={scores[i]:.3f}")
        print(f"   {m['text']}")
    print()


if __name__ == "__main__":
    query = sys.argv[1] if len(sys.argv) > 1 else "the mercy of God"
    k = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    search(query, k)
