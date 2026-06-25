"""Inspect the k=2 split: what are the two groups, concretely?

Prints per-cluster size, mean ayah length, Medinan %, top surahs, and the 8
ayahs nearest each centroid (the prototypes), so we can name the split from data
rather than guessing from the UMAP picture.
"""

import json
from pathlib import Path

import numpy as np
from sklearn.cluster import KMeans

HERE = Path(__file__).parent

emb = np.load(HERE / "embeddings.npy")
meta = [json.loads(l) for l in open(HERE / "meta.jsonl", encoding="utf-8") if l.strip()]
surah = np.array([m["surah_id"] for m in meta])
nwords = np.array([m["n_words"] for m in meta])
MEDINAN = {2, 3, 4, 5, 8, 9, 13, 22, 24, 33, 47, 48, 49, 55, 57, 58, 59,
           60, 61, 62, 63, 64, 65, 66, 76, 98, 99, 110}
medinan = np.array([1 if s in MEDINAN else 0 for s in surah])

km = KMeans(n_clusters=2, random_state=42, n_init=10)
labels = km.fit_predict(emb)
cent = km.cluster_centers_
cent = cent / np.linalg.norm(cent, axis=1, keepdims=True)

for c in range(2):
    idx = np.where(labels == c)[0]
    sims = emb[idx] @ cent[c]
    near = idx[np.argsort(-sims)[:8]]
    top = np.bincount(surah[idx]).argsort()[::-1]
    top = [int(s) for s in top if (surah[idx] == s).any()][:6]
    print(f"\n{'='*70}\nCLUSTER {c}: {len(idx)} ayahs | "
          f"mean length {nwords[idx].mean():.1f} words | "
          f"Medinan {medinan[idx].mean():.0%} | top surahs {top}")
    print("prototypes (nearest to centroid):")
    for j in near:
        print(f"  [{meta[j]['ayah_key']}] ({meta[j]['n_words']}w) {meta[j]['text']}")

# How separable is it really? distance of each point to its own vs other centroid.
d_own = np.where(labels == 0, emb @ cent[0], emb @ cent[1])
d_oth = np.where(labels == 0, emb @ cent[1], emb @ cent[0])
margin = d_own - d_oth
print(f"\n{'='*70}")
print(f"mean cosine to own centroid: {d_own.mean():.3f}  "
      f"to other: {d_oth.mean():.3f}  margin: {margin.mean():.3f}")
print(f"length correlation with cluster: "
      f"{np.corrcoef(nwords, labels)[0,1]:+.3f}")
print(f"Medinan correlation with cluster: "
      f"{np.corrcoef(medinan, labels)[0,1]:+.3f}")
