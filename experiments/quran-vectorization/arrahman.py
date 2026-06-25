"""Quantify why Ar-Rahman (55) stands out: the refrain as a geometric anchor."""
import json
from pathlib import Path
import numpy as np

HERE = Path(__file__).parent
emb = np.load(HERE / "embeddings.npy")
meta = [json.loads(l) for l in open(HERE / "meta.jsonl", encoding="utf-8") if l.strip()]

from collections import Counter
idx55 = [i for i, m in enumerate(meta) if m["surah_id"] == 55]
# The refrain is whichever ayah text repeats most within the surah.
texts = Counter(meta[i]["text"].strip() for i in idx55)
REFRAIN, _ = texts.most_common(1)[0]
print(f"Detected refrain: {REFRAIN}")
refrain_idx = [i for i in idx55 if meta[i]["text"].strip() == REFRAIN]
other_idx = [i for i in idx55 if i not in set(refrain_idx)]

print(f"Surah 55: {len(idx55)} ayat, refrain appears {len(refrain_idx)} times "
      f"({len(refrain_idx)/len(idx55):.0%} of the surah)")

def mean_pair_cos(ix):
    V = emb[ix]
    S = V @ V.T
    iu = np.triu_indices(len(ix), 1)
    return float(S[iu].mean())

print(f"mean pairwise cosine WITHIN refrain ayahs : {mean_pair_cos(refrain_idx):.4f}")
print(f"mean pairwise cosine among NON-refrain 55 : {mean_pair_cos(other_idx):.4f}")
print(f"mean pairwise cosine WHOLE corpus (sample): "
      f"{mean_pair_cos(list(np.random.RandomState(0).choice(len(meta),300,False))):.4f}")

# how far do refrain vs non-refrain sit from the surah centroid?
c = emb[idx55].mean(0); c /= np.linalg.norm(c)
print(f"\nrefrain ayahs   mean cos to surah centroid: {(emb[refrain_idx]@c).mean():.4f}")
print(f"non-refrain     mean cos to surah centroid: {(emb[other_idx]@c).mean():.4f}")

# nearest corpus ayahs to a refrain instance (should be the other refrains)
q = emb[refrain_idx[0]]
top = np.argsort(-(emb @ q))[:8]
print("\nnearest ayahs to a refrain instance:")
for i in top:
    print(f"  [{meta[i]['ayah_key']}] cos={(emb[i]@q):.3f} {meta[i]['text']}")
