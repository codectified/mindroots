"""Root localization: RAW vs WHITENED UMAP — which roots are genuinely semantic?

Exp 7 localized root masks over the raw UMAP, where "localized" conflates real
semantic concentration with register/length coherence (the dominant raw axis).
Whitening (Exp 6) suppresses that length axis. This script diffs each root's
localization between the two spaces:

    delta = loc_whitened - loc_raw        (loc = mean pairwise / corpus baseline)

  delta < 0  -> the root TIGHTENS under whitening: its raw spread was hiding a
               genuine semantic cloud (register was pulling members apart).
  delta > 0  -> the root LOOSENS: its raw tightness was a register/length
               artifact; once length is removed the members scatter.
  delta ~ 0  -> localization is length-independent (robust either way).

loc is normalized to each space's own corpus baseline, so the two UMAPs'
different scales cancel and the comparison is fair.

Inputs:  meta.jsonl, clusters.csv (raw umap), clusters_whitened.csv, roots.jsonl
Outputs in out/:
  root_whiten_delta.csv          per-root loc_raw, loc_whitened, delta (n>=MIN_N)
  root_whiten_report.md          ranked: tightened / loosened / robust
  root_whiten_gallery.png        raw|whitened mask pairs for the biggest movers
"""

import csv
import json
from pathlib import Path

import numpy as np

HERE = Path(__file__).parent
OUT = HERE / "out"
MIN_N = 12          # min distinct ayahs (match root_dist.py's ranked thresholds)
RNG = np.random.RandomState(0)


def load_xy(fname, key2row, n):
    """Load umap_x/umap_y from a clusters csv, aligned to meta row order."""
    xy = np.full((n, 2), np.nan)
    with open(HERE / fname, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            i = key2row.get(row["ayah_key"])
            if i is not None:
                xy[i] = [float(row["umap_x"]), float(row["umap_y"])]
    assert not np.isnan(xy).any(), f"{fname}: unmapped ayahs"
    return xy


def mean_pairwise(P, cap=4000):
    if len(P) > cap:
        P = P[RNG.choice(len(P), cap, replace=False)]
    from scipy.spatial.distance import pdist
    return float(pdist(P).mean()) if len(P) > 1 else 0.0


def loc_stats(xy, idx, base_pd):
    P = xy[idx]
    mpd = mean_pairwise(P)
    return mpd / base_pd if base_pd else 0.0


def main():
    import matplotlib.pyplot as plt

    meta = [json.loads(l) for l in open(HERE / "meta.jsonl", encoding="utf-8")
            if l.strip()]
    n = len(meta)
    key2row = {m["ayah_key"]: i for i, m in enumerate(meta)}
    raw = load_xy("clusters.csv", key2row, n)
    whi = load_xy("clusters_whitened.csv", key2row, n)
    roots = [json.loads(l) for l in open(HERE / "roots.jsonl", encoding="utf-8")
             if l.strip()]

    base_raw = mean_pairwise(raw, cap=3000)
    base_whi = mean_pairwise(whi, cap=3000)
    print(f"baseline mean pairwise  raw={base_raw:.2f}  whitened={base_whi:.2f}")

    rows = []
    for r in roots:
        idx = np.array([key2row[k] for k in r["ayah_keys"] if k in key2row])
        if len(idx) < MIN_N:
            continue
        lr = loc_stats(raw, idx, base_raw)
        lw = loc_stats(whi, idx, base_whi)
        r["glosses"] = [g for g in r["glosses"]
                        if g[0] and g[0].strip().upper() != "NA"]
        rows.append(dict(
            root=r["root"], translit=r["translit"], occ=r["occurrences"],
            n=len(idx), loc_raw=lr, loc_whi=lw, delta=lw - lr,
            glosses=r["glosses"], idx=idx,
        ))
    print(f"computed raw/whitened localization for {len(rows)} roots (n>={MIN_N})")

    # ---- csv -------------------------------------------------------------
    with open(OUT / "root_whiten_delta.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["root", "translit", "top_gloss", "occurrences", "n_ayahs",
                    "loc_raw", "loc_whitened", "delta"])
        for d in sorted(rows, key=lambda x: x["delta"]):
            gl = d["glosses"][0][0] if d["glosses"] else ""
            w.writerow([d["root"], d["translit"], gl, d["occ"], d["n"],
                        round(d["loc_raw"], 3), round(d["loc_whi"], 3),
                        round(d["delta"], 3)])

    # ---- rankings --------------------------------------------------------
    def fmt(d):
        gl = ", ".join(g for g, _ in d["glosses"][:3])
        arrow = "↓ tighten" if d["delta"] < 0 else "↑ loosen"
        return (f"- **{d['translit'] or d['root']}** ({d['root']}) — _{gl}_  ·  "
                f"n={d['n']}, loc_raw={d['loc_raw']:.2f} → loc_whi={d['loc_whi']:.2f} "
                f"({arrow} {d['delta']:+.2f})")

    tightened = sorted(rows, key=lambda x: x["delta"])[:15]
    loosened = sorted(rows, key=lambda x: -x["delta"])[:15]
    robust = sorted([d for d in rows if abs(d["delta"]) < 0.05 and d["loc_raw"] < 0.9],
                    key=lambda x: x["loc_raw"])[:15]

    L = ["# Root localization: raw vs whitened UMAP\n",
         f"{len(rows)} roots with ≥{MIN_N} ayahs. "
         f"loc = mean pairwise / corpus baseline (raw {base_raw:.1f}, whi {base_whi:.1f}); "
         "delta = loc_whitened − loc_raw.\n",
         "\n**delta < 0 ⇒ tightens under whitening ⇒ genuine semantic concentration "
         "(raw spread was register masking).**  "
         "delta > 0 ⇒ raw tightness was a length/register artifact.\n",
         "\n## Tightened most under whitening (genuine semantic clouds)\n"]
    L += [fmt(d) for d in tightened]
    L.append("\n## Loosened most under whitening (raw localization = register artifact)\n")
    L += [fmt(d) for d in loosened]
    L.append("\n## Robust (tight in both spaces, length-independent)\n")
    L += [fmt(d) for d in robust]
    (OUT / "root_whiten_report.md").write_text("\n".join(L), encoding="utf-8")

    # ---- gallery: raw|whitened pairs for top movers ----------------------
    seen = set()
    movers = []
    for d in tightened:
        if d["root"] not in seen:
            movers.append(("TIGHTEN", d)); seen.add(d["root"])
        if len(movers) == 4:
            break
    for d in loosened:
        if d["root"] not in seen:
            movers.append(("LOOSEN", d)); seen.add(d["root"])
        if len([m for m in movers if m[0] == "LOOSEN"]) == 4:
            break

    fig, axes = plt.subplots(len(movers), 2, figsize=(9, 4 * len(movers)))
    for row_axes, (cat, d) in zip(axes, movers):
        for ax, xy, base, lab, lv in [
            (row_axes[0], raw, base_raw, "RAW", d["loc_raw"]),
            (row_axes[1], whi, base_whi, "WHITENED", d["loc_whi"]),
        ]:
            ax.scatter(xy[:, 0], xy[:, 1], c="0.88", s=2, linewidths=0)
            ax.scatter(xy[d["idx"], 0], xy[d["idx"], 1], c="crimson", s=9,
                       alpha=0.75, linewidths=0)
            gl = d["glosses"][0][0] if d["glosses"] else ""
            ax.set_title(f"[{cat}] {d['translit'] or d['root']} · {gl}  "
                         f"{lab} loc={lv:.2f}", fontsize=9)
            ax.set_xticks([]); ax.set_yticks([])
    fig.suptitle("Root masks: raw (left) vs whitened (right) UMAP — "
                 "does the cloud tighten when length is removed?", fontsize=12)
    fig.tight_layout()
    fig.savefig(OUT / "root_whiten_gallery.png", dpi=120)
    plt.close()
    print("Wrote root_whiten_delta.csv, root_whiten_report.md, root_whiten_gallery.png")

    # ---- console preview -------------------------------------------------
    for title, seq in [("TIGHTENED (semantic)", tightened),
                        ("LOOSENED (register artifact)", loosened),
                        ("ROBUST (tight in both)", robust)]:
        print(f"\n== {title} ==")
        for d in seq[:8]:
            gl = ", ".join(g for g, _ in d["glosses"][:2])
            print(f"  {d['translit'] or d['root']:10s} n={d['n']:3d} "
                  f"raw={d['loc_raw']:.2f} whi={d['loc_whi']:.2f} "
                  f"d={d['delta']:+.2f}  {gl}")


if __name__ == "__main__":
    main()
