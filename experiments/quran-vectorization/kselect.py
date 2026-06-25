"""KMeans model selection: find the best k for the ayah embeddings.

Sweeps a fine k grid and scores each with four independent criteria, because a
single metric can mislead on anisotropic embeddings (silhouette structurally
prefers very small k here). Each criterion votes; we report the consensus.

  inertia              -> elbow (kneedle); lower is better but look for the bend
  silhouette (cosine)  -> higher is better  (sampled for speed, fixed seed)
  davies_bouldin       -> lower  is better
  calinski_harabasz    -> higher is better

Outputs:
  out/kselect.png   4-panel sweep with each criterion's pick marked
  out/kselect.csv   raw scores per k
Prints a per-criterion winner table and an overall recommendation.
"""

import csv
from pathlib import Path

import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import (
    silhouette_score,
    davies_bouldin_score,
    calinski_harabasz_score,
)

HERE = Path(__file__).parent
OUT = HERE / "out"
OUT.mkdir(exist_ok=True)

KS = list(range(2, 41))          # fine grid
RANDOM_STATE = 42
SIL_SAMPLE = 3000                 # silhouette is O(n^2); sample with fixed seed
N_INIT = 10


def load():
    return np.load(HERE / "embeddings.npy")


def knee(ks, inertia):
    """Elbow via max distance to the chord between first and last point."""
    x = np.array(ks, float)
    y = np.array(inertia, float)
    x = (x - x.min()) / (x.max() - x.min())
    y = (y - y.min()) / (y.max() - y.min())
    # vector from first to last
    p0, p1 = np.array([x[0], y[0]]), np.array([x[-1], y[-1]])
    d = p1 - p0
    d = d / np.linalg.norm(d)
    dist = []
    for i in range(len(x)):
        v = np.array([x[i], y[i]]) - p0
        proj = v - (v @ d) * d
        dist.append(np.linalg.norm(proj))
    return ks[int(np.argmax(dist))]


def main():
    emb = load()
    print(f"{emb.shape[0]} ayahs x {emb.shape[1]}d\n")

    rows = []
    for k in KS:
        km = KMeans(n_clusters=k, random_state=RANDOM_STATE, n_init=N_INIT)
        labels = km.fit_predict(emb)
        sil = silhouette_score(emb, labels, metric="cosine",
                               sample_size=SIL_SAMPLE, random_state=RANDOM_STATE)
        db = davies_bouldin_score(emb, labels)
        ch = calinski_harabasz_score(emb, labels)
        rows.append((k, km.inertia_, sil, db, ch))
        print(f"k={k:3d}  inertia={km.inertia_:9.1f}  sil={sil:.4f}  "
              f"DB={db:.3f}  CH={ch:7.1f}")

    ks = [r[0] for r in rows]
    inertia = [r[1] for r in rows]
    sil = [r[2] for r in rows]
    db = [r[3] for r in rows]
    ch = [r[4] for r in rows]

    picks = {
        "elbow (inertia)": knee(ks, inertia),
        "silhouette (max)": ks[int(np.argmax(sil))],
        "davies_bouldin (min)": ks[int(np.argmin(db))],
        "calinski_harabasz (max)": ks[int(np.argmax(ch))],
    }

    # ---- plot -------------------------------------------------------------
    import matplotlib.pyplot as plt
    fig, ax = plt.subplots(2, 2, figsize=(12, 8))
    panels = [
        (ax[0, 0], inertia, "inertia (elbow)", picks["elbow (inertia)"], False),
        (ax[0, 1], sil, "silhouette (cosine) — higher better",
         picks["silhouette (max)"], True),
        (ax[1, 0], db, "Davies-Bouldin — lower better",
         picks["davies_bouldin (min)"], True),
        (ax[1, 1], ch, "Calinski-Harabasz — higher better",
         picks["calinski_harabasz (max)"], True),
    ]
    for a, y, title, pick, hi in panels:
        a.plot(ks, y, "o-", ms=3)
        a.axvline(pick, color="crimson", ls="--", lw=1, label=f"pick k={pick}")
        a.set_title(title)
        a.set_xlabel("k")
        a.legend()
    fig.suptitle("KMeans model selection — ayah embeddings (e5-large)")
    fig.tight_layout()
    fig.savefig(OUT / "kselect.png", dpi=130)
    plt.close()

    with open(OUT / "kselect.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["k", "inertia", "silhouette", "davies_bouldin",
                    "calinski_harabasz"])
        w.writerows(rows)

    print("\n=== per-criterion winners ===")
    for name, k in picks.items():
        print(f"  {name:28s} -> k={k}")

    # Consensus: median of the four picks (robust to the silhouette outlier).
    consensus = int(np.median(list(picks.values())))
    print(f"\nConsensus (median of picks): k={consensus}")
    print("Note: silhouette/DB favor very small k on this anisotropic space;")
    print("the elbow + Calinski-Harabasz are more informative for # of themes.")


if __name__ == "__main__":
    main()
