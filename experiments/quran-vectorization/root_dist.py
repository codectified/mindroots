"""Root distributions over the EXISTING ayah embedding space (no new embeddings).

For each root: map its ayahs onto the existing UMAP coords, compute spread
statistics, classify the distribution, and render a gallery of the most
interesting masks.

Inputs: embeddings.npy, meta.jsonl, clusters.csv (umap_x/umap_y, kmeans), roots.jsonl
Outputs in out/:
  root_stats.csv               per-root statistics (n>=3)
  root_distribution_report.md  ranked: localized / broad / multi-cluster / concentrated
  root_gallery.png             4x4 masks of the most interesting roots
"""

import csv
import json
from pathlib import Path

import numpy as np

HERE = Path(__file__).parent
OUT = HERE / "out"
MIN_N = 3            # minimum distinct ayahs to compute stats
RNG = np.random.RandomState(0)


def load():
    emb = np.load(HERE / "embeddings.npy")
    meta = [json.loads(l) for l in open(HERE / "meta.jsonl", encoding="utf-8")
            if l.strip()]
    key2row = {m["ayah_key"]: i for i, m in enumerate(meta)}
    xy = np.zeros((len(meta), 2))
    kcl = np.zeros(len(meta), int)
    with open(HERE / "clusters.csv", encoding="utf-8") as f:
        for i, row in enumerate(csv.DictReader(f)):
            xy[i] = [float(row["umap_x"]), float(row["umap_y"])]
            kcl[i] = int(row["kmeans"])
    roots = [json.loads(l) for l in open(HERE / "roots.jsonl", encoding="utf-8")
             if l.strip()]
    return emb, meta, key2row, xy, kcl, roots


def mean_pairwise(P, cap=4000):
    """Mean pairwise Euclidean distance of 2D points (subsample if huge)."""
    if len(P) > cap:
        P = P[RNG.choice(len(P), cap, replace=False)]
    from scipy.spatial.distance import pdist
    return float(pdist(P).mean()) if len(P) > 1 else 0.0


def main():
    from scipy.spatial import ConvexHull, QhullError
    from sklearn.cluster import DBSCAN
    import matplotlib.pyplot as plt

    emb, meta, key2row, xy, kcl, roots = load()
    global_centroid = xy.mean(0)
    # corpus baseline spread: mean pairwise distance of a big random sample
    base_pd = mean_pairwise(xy, cap=3000)
    # eps for DBSCAN: a fraction of the global extent, so "region" ~ real gap
    extent = np.linalg.norm(xy.max(0) - xy.min(0))
    eps = extent * 0.045
    print(f"baseline mean pairwise={base_pd:.2f}, DBSCAN eps={eps:.2f}")

    rows = []
    for r in roots:
        idx = np.array([key2row[k] for k in r["ayah_keys"] if k in key2row])
        n = len(idx)
        if n < MIN_N:
            continue
        P = xy[idx]
        cen = P.mean(0)
        mpd = mean_pairwise(P)
        loc = mpd / base_pd                      # <1 tighter than corpus, ~1 broad
        dist_glob = float(np.linalg.norm(cen - global_centroid))
        # convex hull area
        try:
            hull = ConvexHull(P)
            area = float(hull.volume)            # 2D "volume" == area
        except (QhullError, Exception):
            area = 0.0
        density = n / area if area > 1e-6 else np.nan
        # disconnected clusters (DBSCAN); count components with >=3 pts
        lbl = DBSCAN(eps=eps, min_samples=3).fit_predict(P)
        comps = [c for c in set(lbl) if c != -1
                 and (lbl == c).sum() >= max(3, 0.05 * n)]
        ncl = len(comps)
        # bimodality: fraction NOT in the largest component
        if comps:
            big = max((lbl == c).sum() for c in comps)
            spread_frac = 1 - big / n
        else:
            spread_frac = 1.0
        # dominant k=8 cluster
        kc = kcl[idx]
        dom_k = int(np.bincount(kc, minlength=8).argmax())
        dom_k_frac = float((kc == dom_k).mean())
        # drop placeholder "NA" glosses so labels show real meanings
        r["glosses"] = [g for g in r["glosses"]
                        if g[0] and g[0].strip().upper() != "NA"]
        top_gloss = r["glosses"][0][0] if r["glosses"] else ""
        rows.append(dict(
            root=r["root"], translit=r["translit"], occ=r["occurrences"],
            n=n, mpd=mpd, loc=loc, hull=area, density=density,
            dist_glob=dist_glob, ncl=ncl, spread_frac=spread_frac,
            dom_k=dom_k, dom_k_frac=dom_k_frac, top_gloss=top_gloss,
            glosses=r["glosses"], idx=idx,
        ))
    print(f"computed stats for {len(rows)} roots (n>={MIN_N})")

    # ---- csv -------------------------------------------------------------
    with open(OUT / "root_stats.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["root", "translit", "top_gloss", "occurrences", "n_ayahs",
                    "mean_pairwise", "localization", "hull_area", "density",
                    "dist_from_global", "n_clusters", "spread_frac",
                    "dom_kmeans", "dom_k_frac"])
        for d in sorted(rows, key=lambda x: -x["n"]):
            w.writerow([d["root"], d["translit"], d["top_gloss"], d["occ"],
                        d["n"], round(d["mpd"], 3), round(d["loc"], 3),
                        round(d["hull"], 2),
                        round(d["density"], 3) if d["density"] == d["density"] else "",
                        round(d["dist_glob"], 3), d["ncl"], round(d["spread_frac"], 3),
                        d["dom_k"], round(d["dom_k_frac"], 3)])

    # ---- rankings --------------------------------------------------------
    def fmt(d):
        gl = ", ".join(g for g, _ in d["glosses"][:3])
        return (f"- **{d['translit'] or d['root']}** ({d['root']}) — _{gl}_  ·  "
                f"n={d['n']}, loc={d['loc']:.2f}, hull={d['hull']:.1f}, "
                f"clusters={d['ncl']}, domK{d['dom_k']}={d['dom_k_frac']:.0%}")

    localized = sorted([d for d in rows if d["n"] >= 12],
                       key=lambda x: x["loc"])[:15]
    broad = sorted([d for d in rows if d["n"] >= 25],
                   key=lambda x: -x["loc"])[:15]
    multi = sorted([d for d in rows if d["n"] >= 12 and d["ncl"] >= 2],
                   key=lambda x: (-x["ncl"], -x["spread_frac"]))[:15]
    # concentrated: tight AND off-center, decent frequency
    for d in rows:
        d["conc"] = (1 - min(d["loc"], 1)) * d["dist_glob"]
    concentrated = sorted([d for d in rows if d["n"] >= 12],
                          key=lambda x: -x["conc"])[:15]

    L = ["# Root distributions over the ayah embedding space\n",
         f"{len(rows)} roots with ≥{MIN_N} ayahs · masks over the existing UMAP · "
         f"loc = mean pairwise dist / corpus baseline ({base_pd:.1f}); "
         f"loc<1 = tighter than corpus.\n",
         "\n## Highly localized (tight semantic clouds)\n"]
    L += [fmt(d) for d in localized]
    L.append("\n## Broadly distributed (span the whole space)\n")
    L += [fmt(d) for d in broad]
    L.append("\n## Split into multiple distinct clusters\n")
    L += [fmt(d) for d in multi]
    L.append("\n## Unexpectedly concentrated off-center\n")
    L += [fmt(d) for d in concentrated]
    (OUT / "root_distribution_report.md").write_text("\n".join(L), encoding="utf-8")

    # ---- gallery ---------------------------------------------------------
    def pick(seq, k, seen):
        out = []
        for d in seq:
            if d["root"] not in seen:
                out.append(d); seen.add(d["root"])
            if len(out) == k:
                break
        return out

    seen = set()
    gallery = (pick(localized, 4, seen) + pick(broad, 4, seen)
               + pick(multi, 4, seen) + pick(concentrated, 4, seen))
    cats = (["LOCALIZED"] * 4 + ["BROAD"] * 4 + ["MULTI-CLUSTER"] * 4
            + ["CONCENTRATED"] * 4)

    fig, axes = plt.subplots(4, 4, figsize=(18, 16))
    for ax, d, cat in zip(axes.flat, gallery, cats):
        ax.scatter(xy[:, 0], xy[:, 1], c="0.88", s=2, linewidths=0)
        ax.scatter(xy[d["idx"], 0], xy[d["idx"], 1], c="crimson", s=8,
                   alpha=0.75, linewidths=0)
        gl = d["glosses"][0][0] if d["glosses"] else ""
        ax.set_title(f"[{cat}] {d['translit'] or d['root']} · {gl}\n"
                     f"n={d['n']} loc={d['loc']:.2f} cl={d['ncl']}", fontsize=9)
        ax.set_xticks([]); ax.set_yticks([])
    fig.suptitle("Root distribution masks over the existing ayah UMAP "
                 "(red = ayahs containing the root)", fontsize=14)
    fig.tight_layout()
    fig.savefig(OUT / "root_gallery.png", dpi=120)
    plt.close()
    print("Wrote root_stats.csv, root_distribution_report.md, root_gallery.png")

    # console preview
    for title, seq in [("LOCALIZED", localized), ("BROAD", broad),
                       ("MULTI-CLUSTER", multi), ("CONCENTRATED", concentrated)]:
        print(f"\n== {title} ==")
        for d in seq[:6]:
            gl = ", ".join(g for g, _ in d["glosses"][:2])
            print(f"  {d['translit'] or d['root']:10s} n={d['n']:3d} "
                  f"loc={d['loc']:.2f} cl={d['ncl']} domK{d['dom_k']}="
                  f"{d['dom_k_frac']:.0%}  {gl}")


if __name__ == "__main__":
    main()
