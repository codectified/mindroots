"""Whiten the ayah embeddings to suppress the dominant length/register axis,
then check whether *topical* structure surfaces underneath it.

Pipeline:
  1. Diagnose: correlate the top principal components with ayah length and
     Meccan/Medinan — confirm the dominant directions ARE the length axis.
  2. Whiten: mean-center, PCA to the components covering 90% variance, scale each
     to unit variance (PCA whitening). Now every retained direction counts
     equally, so distance is no longer dominated by length.
  3. Re-cluster (KMeans k=8) + re-UMAP on the whitened space.
  4. Quantify decoupling: R^2 of ayah length explained by cluster assignment,
     raw vs whitened (lower = clusters no longer sort by length).

Outputs in out/:
  whiten_pc_length.png    PC1 vs length (raw) — the axis we're removing
  whiten_umap.png         whitened UMAP colored by new cluster / length / Medinan
  whiten_report.md        PC correlations, length-R^2 before/after, new reps
  clusters_whitened.csv   ayah_key, whitened cluster, umap coords
"""

import csv
import json
from pathlib import Path

import numpy as np

HERE = Path(__file__).parent
OUT = HERE / "out"

MEDINAN = {2, 3, 4, 5, 8, 9, 13, 22, 24, 33, 47, 48, 49, 55, 57, 58, 59,
           60, 61, 62, 63, 64, 65, 66, 76, 98, 99, 110}


def load():
    emb = np.load(HERE / "embeddings.npy")
    meta = [json.loads(l) for l in open(HERE / "meta.jsonl", encoding="utf-8")
            if l.strip()]
    raw_cluster = np.zeros(len(meta), int)
    with open(HERE / "clusters.csv", encoding="utf-8") as f:
        for i, row in enumerate(csv.DictReader(f)):
            raw_cluster[i] = int(row["kmeans"])
    return emb, meta, raw_cluster


def length_r2(nwords, labels):
    """Fraction of ayah-length variance explained by the cluster labels."""
    grand = nwords.mean()
    ss_tot = ((nwords - grand) ** 2).sum()
    ss_bet = 0.0
    for c in np.unique(labels):
        m = labels == c
        ss_bet += m.sum() * (nwords[m].mean() - grand) ** 2
    return ss_bet / ss_tot


def main():
    from sklearn.decomposition import PCA
    from sklearn.cluster import KMeans
    import umap
    import matplotlib.pyplot as plt

    emb, meta, raw_cluster = load()
    nwords = np.array([m["n_words"] for m in meta], float)
    medinan = np.array([1.0 if m["surah_id"] in MEDINAN else 0.0 for m in meta])
    print(f"{len(meta)} ayahs x {emb.shape[1]}d")

    # ---- (1) diagnose the dominant axis ----------------------------------
    pca = PCA().fit(emb)
    scores = pca.transform(emb)
    evr = pca.explained_variance_ratio_
    print("\nPC | %var | corr(length) | corr(Medinan)")
    pc_corr = []
    for k in range(6):
        rl = np.corrcoef(scores[:, k], nwords)[0, 1]
        rm = np.corrcoef(scores[:, k], medinan)[0, 1]
        pc_corr.append((k + 1, evr[k], rl, rm))
        print(f"PC{k+1:<2d} {evr[k]*100:5.1f}%   {rl:+.3f}        {rm:+.3f}")

    plt.figure(figsize=(7, 5))
    plt.scatter(scores[:, 0], nwords, c=medinan, cmap="coolwarm", s=5, alpha=.5)
    rl0 = np.corrcoef(scores[:, 0], nwords)[0, 1]
    plt.xlabel("PC1 score"); plt.ylabel("ayah length (words)")
    plt.title(f"Raw PC1 vs ayah length (r={rl0:+.2f}) — the axis being whitened")
    plt.colorbar(label="Medinan")
    plt.tight_layout(); plt.savefig(OUT / "whiten_pc_length.png", dpi=130)
    plt.close()

    # ---- (2) PCA whitening to 90% variance -------------------------------
    cum = np.cumsum(evr)
    d = int(np.searchsorted(cum, 0.90) + 1)
    print(f"\nWhitening top {d} components (90% variance)")
    Xw = scores[:, :d] / np.sqrt(pca.explained_variance_[:d])  # unit variance each

    # ---- (3) re-cluster + re-UMAP on whitened space ----------------------
    kmw = KMeans(n_clusters=8, random_state=42, n_init=10)
    cw = kmw.fit_predict(Xw)
    xyw = umap.UMAP(n_neighbors=30, min_dist=0.1, metric="euclidean",
                    random_state=42).fit_transform(Xw)
    print("whitened KMeans + UMAP done")

    # ---- (4) quantify decoupling -----------------------------------------
    r2_raw = length_r2(nwords, raw_cluster)
    r2_white = length_r2(nwords, cw)
    print(f"\nlength variance explained by clusters:")
    print(f"  raw clusters     R^2 = {r2_raw:.3f}")
    print(f"  whitened clusters R^2 = {r2_white:.3f}")

    # ---- plots ------------------------------------------------------------
    fig, ax = plt.subplots(1, 3, figsize=(18, 5.5))
    for a, color, title, kw in [
        (ax[0], cw, "whitened — KMeans k=8", dict(cmap="tab10")),
        (ax[1], np.clip(nwords, 0, 60), "whitened — by length",
         dict(cmap="magma")),
        (ax[2], medinan, "whitened — Meccan/Medinan", dict(cmap="coolwarm")),
    ]:
        sc = a.scatter(xyw[:, 0], xyw[:, 1], c=color, s=5, alpha=.6,
                       linewidths=0, **kw)
        a.set_title(title); a.set_xticks([]); a.set_yticks([])
        if title != "whitened — KMeans k=8":
            fig.colorbar(sc, ax=a)
    fig.suptitle(f"Whitened ayah space (top {d} PCs, unit variance) — "
                 f"length R²: {r2_raw:.2f} → {r2_white:.2f}")
    fig.tight_layout(); fig.savefig(OUT / "whiten_umap.png", dpi=130)
    plt.close()

    # ---- report with new representatives ---------------------------------
    centw = kmw.cluster_centers_
    L = ["# Whitening — does topical structure surface?\n",
         f"{len(meta)} ayahs · whitened to top {d} PCs (90% var), unit variance\n",
         "\n## Dominant raw axes (what we removed)\n",
         "| PC | %var | corr(length) | corr(Medinan) |",
         "|----|------|--------------|---------------|"]
    for k, v, rl, rm in pc_corr:
        L.append(f"| PC{k} | {v*100:.1f}% | {rl:+.3f} | {rm:+.3f} |")
    L.append(f"\n## Length decoupling\n")
    L.append(f"- ayah-length variance explained by clusters: "
             f"**raw R²={r2_raw:.3f} → whitened R²={r2_white:.3f}**")
    L.append("\n## Whitened cluster prototypes (nearest to centroid)\n")
    for c in range(8):
        idx = np.where(cw == c)[0]
        sims = Xw[idx] @ centw[c] / (
            np.linalg.norm(Xw[idx], axis=1) * np.linalg.norm(centw[c]) + 1e-9)
        near = idx[np.argsort(-sims)[:6]]
        medf = medinan[idx].mean()
        L.append(f"\n### Whitened cluster {c} — {len(idx)} ayahs "
                 f"(Medinan {medf:.0%}, mean {nwords[idx].mean():.0f}w)")
        for j in near:
            L.append(f"- [{meta[j]['ayah_key']}] {meta[j]['text']}")
    (OUT / "whiten_report.md").write_text("\n".join(L), encoding="utf-8")

    with open(HERE / "clusters_whitened.csv", "w", newline="",
              encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["ayah_key", "kmeans_whitened", "umap_x", "umap_y"])
        for i, m in enumerate(meta):
            w.writerow([m["ayah_key"], int(cw[i]),
                        round(float(xyw[i, 0]), 4), round(float(xyw[i, 1]), 4)])
    print("Wrote whiten_*.png, whiten_report.md, clusters_whitened.csv")


if __name__ == "__main__":
    main()
