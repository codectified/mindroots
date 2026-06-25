"""Pattern exploration over the ayah embeddings: clustering, centroids, UMAP.

Loads embeddings.npy (L2-normalized e5 vectors) + meta.jsonl and produces:
  out/silhouette.png         KMeans silhouette vs k (model-selection sweep)
  out/umap_clusters.png      UMAP 2D colored by KMeans cluster
  out/umap_surah.png         UMAP 2D colored by surah_id
  out/umap_length.png        UMAP 2D colored by ayah length (n_words)
  out/umap_revelation.png    UMAP 2D colored by Meccan/Medinan (common list)
  out/umap_hdbscan.png       UMAP 2D colored by HDBSCAN density clusters (if avail)
  out/cluster_sizes.png      cluster size distribution
  out/centroid_heatmap.png   centroid-to-centroid cosine similarity
  out/umap_interactive.html  plotly scatter, hover shows ayah_key + Arabic text
  out/cluster_report.md      per-cluster size, surah spread, representative ayahs
  clusters.csv               ayah_key, cluster, hdbscan, umap_x, umap_y, ...

Embeddings are unit vectors, so cosine == dot product and Euclidean k-means on
them is monotonic with cosine. UMAP uses metric='cosine' directly.
"""

import json
import os
from pathlib import Path

import numpy as np

HERE = Path(__file__).parent
OUT = HERE / "out"
OUT.mkdir(exist_ok=True)

# K for the headline clustering. The silhouette sweep is saved separately so the
# choice is auditable; this is the k used for the report + colored UMAP.
K = int(os.environ.get("K", "16"))
SWEEP = [4, 6, 8, 10, 12, 14, 16, 20, 24, 30]
RANDOM_STATE = 42

# Standard (widely-cited) Medinan surah list; everything else is treated Meccan.
# A few surahs are disputed in the tradition — this is for coarse visual overlay,
# not a scholarly claim.
MEDINAN = {2, 3, 4, 5, 8, 9, 13, 22, 24, 33, 47, 48, 49, 55, 57, 58, 59,
           60, 61, 62, 63, 64, 65, 66, 76, 98, 99, 110}


def load():
    emb = np.load(HERE / "embeddings.npy")
    meta = []
    with open(HERE / "meta.jsonl", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                meta.append(json.loads(line))
    return emb, meta


def silhouette_sweep(emb):
    from sklearn.cluster import KMeans
    from sklearn.metrics import silhouette_score
    import matplotlib.pyplot as plt

    scores = []
    for k in SWEEP:
        km = KMeans(n_clusters=k, random_state=RANDOM_STATE, n_init=10)
        labels = km.fit_predict(emb)
        # subsample for silhouette (O(n^2) is slow at 6k); 2000 is plenty stable
        s = silhouette_score(emb, labels, metric="cosine", sample_size=2000,
                             random_state=RANDOM_STATE)
        scores.append(s)
        print(f"  k={k:3d}  silhouette={s:.4f}")

    plt.figure(figsize=(7, 4))
    plt.plot(SWEEP, scores, "o-")
    plt.axvline(K, color="crimson", ls="--", lw=1, label=f"chosen k={K}")
    plt.xlabel("k (KMeans clusters)")
    plt.ylabel("silhouette (cosine, subsampled)")
    plt.title("KMeans model selection")
    plt.legend()
    plt.tight_layout()
    plt.savefig(OUT / "silhouette.png", dpi=130)
    plt.close()
    return dict(zip(SWEEP, scores))


def main():
    emb, meta = load()
    n = len(meta)
    print(f"Loaded {n} ayahs x {emb.shape[1]}d")

    surah = np.array([m["surah_id"] for m in meta])
    nwords = np.array([m["n_words"] for m in meta])
    medinan = np.array([1 if s in MEDINAN else 0 for s in surah])

    # ---- model selection + headline KMeans -------------------------------
    print("Silhouette sweep:")
    silhouette_sweep(emb)

    from sklearn.cluster import KMeans
    km = KMeans(n_clusters=K, random_state=RANDOM_STATE, n_init=10)
    clusters = km.fit_predict(emb)
    centroids = km.cluster_centers_
    # Re-normalize centroids so cosine math is clean.
    centroids = centroids / np.linalg.norm(centroids, axis=1, keepdims=True)
    print(f"KMeans k={K} done")

    # ---- UMAP 2D ----------------------------------------------------------
    import umap
    reducer = umap.UMAP(n_neighbors=30, min_dist=0.1, metric="cosine",
                        random_state=RANDOM_STATE)
    xy = reducer.fit_transform(emb)
    print("UMAP done")

    # ---- HDBSCAN on the UMAP plane (density clusters + noise) -------------
    hdb_labels = None
    try:
        import hdbscan
        hdb = hdbscan.HDBSCAN(min_cluster_size=40, min_samples=10)
        hdb_labels = hdb.fit_predict(xy)
        n_hdb = len(set(hdb_labels)) - (1 if -1 in hdb_labels else 0)
        n_noise = int((hdb_labels == -1).sum())
        print(f"HDBSCAN: {n_hdb} clusters, {n_noise} noise points")
    except Exception as e:  # noqa: BLE001
        print(f"HDBSCAN skipped: {e}")

    # ---- static plots -----------------------------------------------------
    import matplotlib.pyplot as plt

    def scatter(color, title, fname, cmap="tab20", cbar_label=None, discrete=True):
        plt.figure(figsize=(9, 8))
        sc = plt.scatter(xy[:, 0], xy[:, 1], c=color, cmap=cmap, s=4,
                         alpha=0.6, linewidths=0)
        plt.title(title)
        plt.xlabel("UMAP-1"); plt.ylabel("UMAP-2")
        if cbar_label:
            plt.colorbar(sc, label=cbar_label)
        plt.tight_layout()
        plt.savefig(OUT / fname, dpi=130)
        plt.close()

    scatter(clusters, f"Ayah embeddings — KMeans k={K}", "umap_clusters.png")
    scatter(surah, "Ayah embeddings — by surah", "umap_surah.png",
            cmap="viridis", cbar_label="surah_id", discrete=False)
    scatter(np.clip(nwords, 0, 60), "Ayah embeddings — by length (words)",
            "umap_length.png", cmap="magma", cbar_label="n_words (clipped 60)",
            discrete=False)
    scatter(medinan, "Ayah embeddings — Meccan (0) vs Medinan (1)",
            "umap_revelation.png", cmap="coolwarm", cbar_label="Medinan",
            discrete=False)
    if hdb_labels is not None:
        scatter(hdb_labels, "Ayah embeddings — HDBSCAN (gray = noise)",
                "umap_hdbscan.png")

    # cluster sizes
    sizes = np.bincount(clusters, minlength=K)
    plt.figure(figsize=(8, 4))
    order = np.argsort(-sizes)
    plt.bar(range(K), sizes[order])
    plt.xticks(range(K), order, fontsize=8)
    plt.xlabel("cluster (sorted by size)"); plt.ylabel("# ayahs")
    plt.title(f"KMeans k={K} cluster sizes")
    plt.tight_layout(); plt.savefig(OUT / "cluster_sizes.png", dpi=130); plt.close()

    # centroid similarity heatmap
    sim = centroids @ centroids.T
    plt.figure(figsize=(7, 6))
    plt.imshow(sim, cmap="RdBu_r", vmin=-1, vmax=1)
    plt.colorbar(label="cosine")
    plt.title("Centroid-to-centroid cosine similarity")
    plt.xlabel("cluster"); plt.ylabel("cluster")
    plt.tight_layout(); plt.savefig(OUT / "centroid_heatmap.png", dpi=130); plt.close()

    # ---- interactive plotly (Arabic renders in the browser) --------------
    import plotly.graph_objects as go

    def wrap(t, width=42):
        # crude soft-wrap so hover boxes don't run off-screen
        out, line = [], ""
        for w in t.split():
            if len(line) + len(w) + 1 > width:
                out.append(line); line = w
            else:
                line = (line + " " + w).strip()
        if line:
            out.append(line)
        return "<br>".join(out)

    hover = [
        f"<b>{m['ayah_key']}</b> · cluster {clusters[i]}<br>{wrap(m['text'])}"
        for i, m in enumerate(meta)
    ]
    fig = go.Figure(go.Scattergl(
        x=xy[:, 0], y=xy[:, 1], mode="markers",
        marker=dict(size=5, color=clusters, colorscale="Turbo", opacity=0.7,
                    colorbar=dict(title="cluster")),
        text=hover, hoverinfo="text",
    ))
    fig.update_layout(
        title=f"Quran ayah embeddings (e5-large) — UMAP, KMeans k={K}",
        width=1100, height=850, template="plotly_white",
        xaxis_title="UMAP-1", yaxis_title="UMAP-2",
    )
    fig.write_html(OUT / "umap_interactive.html", include_plotlyjs="cdn")

    # ---- representatives + report ----------------------------------------
    lines = [f"# Ayah cluster report — KMeans k={K}\n",
             f"{n} ayahs · e5-large 1024d · cosine\n"]
    rep_rows = []
    for c in range(K):
        idx = np.where(clusters == c)[0]
        # nearest ayahs to the centroid = the cluster's prototypes
        sims = emb[idx] @ centroids[c]
        near = idx[np.argsort(-sims)[:6]]
        top_surahs = np.bincount(surah[idx]).argsort()[::-1][:5]
        top_surahs = [int(s) for s in top_surahs if (surah[idx] == s).any()][:5]
        med_frac = medinan[idx].mean()
        lines.append(f"\n## Cluster {c} — {len(idx)} ayahs "
                     f"(Medinan {med_frac:.0%}, top surahs {top_surahs})")
        for j in near:
            lines.append(f"- [{meta[j]['ayah_key']}] {meta[j]['text']}")
            rep_rows.append((c, meta[j]["ayah_key"]))
    (OUT / "cluster_report.md").write_text("\n".join(lines), encoding="utf-8")

    # ---- assignments table -----------------------------------------------
    import csv
    with open(HERE / "clusters.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["ayah_key", "surah_id", "ayah_id", "n_words",
                    "kmeans", "hdbscan", "umap_x", "umap_y"])
        for i, m in enumerate(meta):
            w.writerow([m["ayah_key"], m["surah_id"], m["ayah_id"], m["n_words"],
                        int(clusters[i]),
                        int(hdb_labels[i]) if hdb_labels is not None else "",
                        round(float(xy[i, 0]), 4), round(float(xy[i, 1]), 4)])

    print(f"\nWrote outputs to {OUT}/ and clusters.csv")
    print("Cluster sizes:", sorted(sizes.tolist(), reverse=True))


if __name__ == "__main__":
    main()
