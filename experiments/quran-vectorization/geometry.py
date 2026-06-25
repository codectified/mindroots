"""Geometry of the Arabic ayah embeddings, at the surah level.

Reuses the EXISTING UMAP layout (clusters.csv, from analyze.py) so every view is
the same map; distances/centroids/spread are computed in the real 1024-d space.

Produces in out/:
  geom_umap_surah.png      ayah UMAP colored by surah number (req 1)
  geom_trajectories_all.png all 114 surahs as faint ayah-order paths (req 2)
  geom_trajectories_grid.png small-multiples of notable surahs (req 2)
  geom_surah_centroids.png  114 surah centroids on the ayah map, labeled (req 3)
  geom_surah_space.png      MDS of the 114 centroid vectors (surah-level map)(req 3)
  geom_spread.png           cohesion vs size + most cohesive/diverse bars (req 4)
And reports:
  out/surah_geometry.csv    per-surah n_ayahs, mean_len, cohesion, umap pos
  out/surah_nearest.md      nearest surah pairs + cohesion extremes + notes
"""

import csv
import json
from pathlib import Path

import numpy as np

HERE = Path(__file__).parent
OUT = HERE / "out"

SURAH_NAMES = {
    1: "Al-Fatihah", 2: "Al-Baqarah", 3: "Aal-Imran", 4: "An-Nisa",
    5: "Al-Maidah", 6: "Al-Anam", 7: "Al-Araf", 8: "Al-Anfal", 9: "At-Tawbah",
    10: "Yunus", 11: "Hud", 12: "Yusuf", 13: "Ar-Rad", 14: "Ibrahim",
    15: "Al-Hijr", 16: "An-Nahl", 17: "Al-Isra", 18: "Al-Kahf", 19: "Maryam",
    20: "Ta-Ha", 21: "Al-Anbiya", 22: "Al-Hajj", 23: "Al-Muminun", 24: "An-Nur",
    25: "Al-Furqan", 26: "Ash-Shuara", 27: "An-Naml", 28: "Al-Qasas",
    29: "Al-Ankabut", 30: "Ar-Rum", 31: "Luqman", 32: "As-Sajdah",
    33: "Al-Ahzab", 34: "Saba", 35: "Fatir", 36: "Ya-Sin", 37: "As-Saffat",
    38: "Sad", 39: "Az-Zumar", 40: "Ghafir", 41: "Fussilat", 42: "Ash-Shura",
    43: "Az-Zukhruf", 44: "Ad-Dukhan", 45: "Al-Jathiyah", 46: "Al-Ahqaf",
    47: "Muhammad", 48: "Al-Fath", 49: "Al-Hujurat", 50: "Qaf",
    51: "Adh-Dhariyat", 52: "At-Tur", 53: "An-Najm", 54: "Al-Qamar",
    55: "Ar-Rahman", 56: "Al-Waqiah", 57: "Al-Hadid", 58: "Al-Mujadila",
    59: "Al-Hashr", 60: "Al-Mumtahanah", 61: "As-Saff", 62: "Al-Jumuah",
    63: "Al-Munafiqun", 64: "At-Taghabun", 65: "At-Talaq", 66: "At-Tahrim",
    67: "Al-Mulk", 68: "Al-Qalam", 69: "Al-Haqqah", 70: "Al-Maarij", 71: "Nuh",
    72: "Al-Jinn", 73: "Al-Muzzammil", 74: "Al-Muddaththir", 75: "Al-Qiyamah",
    76: "Al-Insan", 77: "Al-Mursalat", 78: "An-Naba", 79: "An-Naziat",
    80: "Abasa", 81: "At-Takwir", 82: "Al-Infitar", 83: "Al-Mutaffifin",
    84: "Al-Inshiqaq", 85: "Al-Buruj", 86: "At-Tariq", 87: "Al-Ala",
    88: "Al-Ghashiyah", 89: "Al-Fajr", 90: "Al-Balad", 91: "Ash-Shams",
    92: "Al-Layl", 93: "Ad-Duha", 94: "Ash-Sharh", 95: "At-Tin", 96: "Al-Alaq",
    97: "Al-Qadr", 98: "Al-Bayyinah", 99: "Az-Zalzalah", 100: "Al-Adiyat",
    101: "Al-Qariah", 102: "At-Takathur", 103: "Al-Asr", 104: "Al-Humazah",
    105: "Al-Fil", 106: "Quraysh", 107: "Al-Maun", 108: "Al-Kawthar",
    109: "Al-Kafirun", 110: "An-Nasr", 111: "Al-Masad", 112: "Al-Ikhlas",
    113: "Al-Falaq", 114: "An-Nas",
}


def load():
    emb = np.load(HERE / "embeddings.npy")
    meta = [json.loads(l) for l in open(HERE / "meta.jsonl", encoding="utf-8")
            if l.strip()]
    # UMAP coords from the existing run, row-aligned with meta/emb.
    xy = np.zeros((len(meta), 2))
    with open(HERE / "clusters.csv", encoding="utf-8") as f:
        for i, row in enumerate(csv.DictReader(f)):
            xy[i] = [float(row["umap_x"]), float(row["umap_y"])]
    return emb, meta, xy


def main():
    import matplotlib.pyplot as plt
    from matplotlib.collections import LineCollection

    emb, meta, xy = load()
    surah = np.array([m["surah_id"] for m in meta])
    ayah = np.array([m["ayah_id"] for m in meta])
    nwords = np.array([m["n_words"] for m in meta])
    surahs = list(range(1, 115))
    n = len(meta)
    print(f"{n} ayahs, {len(set(surah))} surahs")

    # ---- (1) UMAP colored by surah number --------------------------------
    plt.figure(figsize=(10, 8.5))
    sc = plt.scatter(xy[:, 0], xy[:, 1], c=surah, cmap="gist_rainbow", s=5,
                     alpha=0.65, linewidths=0)
    plt.colorbar(sc, label="surah number (mushaf order)")
    plt.title("Ayah UMAP colored by surah (surah unseen during embedding)")
    plt.xlabel("UMAP-1"); plt.ylabel("UMAP-2")
    plt.tight_layout(); plt.savefig(OUT / "geom_umap_surah.png", dpi=140)
    plt.close()

    # ---- (2a) all surah trajectories (faint) -----------------------------
    plt.figure(figsize=(10, 8.5))
    plt.scatter(xy[:, 0], xy[:, 1], c="0.85", s=3, linewidths=0)
    for s in surahs:
        idx = np.where(surah == s)[0]
        idx = idx[np.argsort(ayah[idx])]
        if len(idx) < 2:
            continue
        plt.plot(xy[idx, 0], xy[idx, 1], "-", lw=0.5, alpha=0.5,
                 color=plt.cm.gist_rainbow(s / 114))
    plt.title("Surah trajectories — consecutive ayahs connected (all 114)")
    plt.xlabel("UMAP-1"); plt.ylabel("UMAP-2")
    plt.tight_layout(); plt.savefig(OUT / "geom_trajectories_all.png", dpi=140)
    plt.close()

    # ---- (2b) small-multiples of notable surahs --------------------------
    notable = [1, 2, 12, 18, 19, 36, 37, 55, 56, 78, 87, 112]
    fig, axes = plt.subplots(3, 4, figsize=(16, 11))
    for ax, s in zip(axes.flat, notable):
        ax.scatter(xy[:, 0], xy[:, 1], c="0.9", s=2, linewidths=0)
        idx = np.where(surah == s)[0]
        idx = idx[np.argsort(ayah[idx])]
        pts = xy[idx].reshape(-1, 1, 2)
        if len(idx) >= 2:
            segs = np.concatenate([pts[:-1], pts[1:]], axis=1)
            lc = LineCollection(segs, cmap="plasma", lw=1.4)
            lc.set_array(np.arange(len(idx)))
            ax.add_collection(lc)
        ax.scatter(*xy[idx[0]], c="lime", s=40, ec="k", zorder=5, label="start")
        ax.scatter(*xy[idx[-1]], c="red", s=40, ec="k", zorder=5, label="end")
        ax.set_title(f"{s}. {SURAH_NAMES[s]} ({len(idx)} ayat)", fontsize=10)
        ax.set_xticks([]); ax.set_yticks([])
    fig.suptitle("Surah trajectories (green=start, red=end, color=ayah order)",
                 fontsize=13)
    fig.tight_layout(); fig.savefig(OUT / "geom_trajectories_grid.png", dpi=130)
    plt.close()

    # ---- (3) surah centroids (1024-d) ------------------------------------
    cent = np.zeros((114, emb.shape[1]))
    cent_xy = np.zeros((114, 2))
    n_ayahs = np.zeros(114, int)
    cohesion = np.zeros(114)          # mean cosine of ayahs to surah centroid
    mean_len = np.zeros(114)
    for i, s in enumerate(surahs):
        idx = np.where(surah == s)[0]
        n_ayahs[i] = len(idx)
        mean_len[i] = nwords[idx].mean()
        c = emb[idx].mean(0)
        c /= np.linalg.norm(c)
        cent[i] = c
        cent_xy[i] = xy[idx].mean(0)
        cohesion[i] = float((emb[idx] @ c).mean())

    # centroids overlaid on the ayah map
    plt.figure(figsize=(11, 9))
    plt.scatter(xy[:, 0], xy[:, 1], c="0.88", s=3, linewidths=0)
    plt.scatter(cent_xy[:, 0], cent_xy[:, 1], c=surahs, cmap="gist_rainbow",
                s=40 + n_ayahs * 0.25, alpha=0.9, ec="k", linewidths=0.4)
    for i, s in enumerate(surahs):
        plt.annotate(str(s), cent_xy[i], fontsize=6, ha="center", va="center")
    plt.title("114 surah centroids on the ayah map (size ∝ #ayat)")
    plt.xlabel("UMAP-1"); plt.ylabel("UMAP-2")
    plt.tight_layout(); plt.savefig(OUT / "geom_surah_centroids.png", dpi=140)
    plt.close()

    # MDS of centroid vectors -> a faithful surah-level map
    from sklearn.manifold import MDS
    csim = cent @ cent.T
    cdist = np.clip(1 - csim, 0, 2)
    mds = MDS(n_components=2, dissimilarity="precomputed", random_state=42,
              normalized_stress="auto")
    mxy = mds.fit_transform(cdist)
    plt.figure(figsize=(11, 9))
    plt.scatter(mxy[:, 0], mxy[:, 1], c=surahs, cmap="gist_rainbow",
                s=30 + n_ayahs * 0.3, alpha=0.85, ec="k", linewidths=0.4)
    for i, s in enumerate(surahs):
        plt.annotate(str(s), mxy[i], fontsize=6, ha="center", va="center")
    plt.title("Surah-level map — MDS of 114 centroid vectors (cosine)")
    plt.tight_layout(); plt.savefig(OUT / "geom_surah_space.png", dpi=140)
    plt.close()

    # nearest surah pairs (high-dim cosine)
    np.fill_diagonal(csim, -1)
    pairs = []
    for i in range(114):
        j = int(np.argmax(csim[i]))
        pairs.append((csim[i, j], surahs[i], surahs[j]))
    # dedupe symmetric pairs, sort by similarity
    seen, uniq = set(), []
    for sim, a, b in sorted(pairs, reverse=True):
        key = tuple(sorted((a, b)))
        if key not in seen:
            seen.add(key); uniq.append((sim, a, b))

    # ---- (4) spread / cohesion -------------------------------------------
    fig, ax = plt.subplots(1, 2, figsize=(15, 6))
    ax[0].scatter(n_ayahs, cohesion, c=surahs, cmap="gist_rainbow", s=25)
    for i, s in enumerate(surahs):
        if n_ayahs[i] > 80 or cohesion[i] < 0.80 or cohesion[i] > 0.93:
            ax[0].annotate(str(s), (n_ayahs[i], cohesion[i]), fontsize=7)
    ax[0].set_xlabel("# ayat"); ax[0].set_ylabel("cohesion (mean cos to centroid)")
    ax[0].set_title("Cohesion vs surah length")

    mask = n_ayahs >= 5  # tiny surahs are trivially cohesive
    order = np.argsort(cohesion)
    loose = [o for o in order if mask[o]][:12]
    tight = [o for o in order[::-1] if mask[o]][:12]
    labels = ([f"{surahs[o]} {SURAH_NAMES[surahs[o]]}" for o in tight][::-1]
              + [""] +
              [f"{surahs[o]} {SURAH_NAMES[surahs[o]]}" for o in loose][::-1])
    vals = ([cohesion[o] for o in tight][::-1] + [np.nan]
            + [cohesion[o] for o in loose][::-1])
    colors = (["#2c7"] * 12 + ["w"] + ["#c44"] * 12)
    ax[1].barh(range(len(vals)), vals, color=colors)
    ax[1].set_yticks(range(len(vals))); ax[1].set_yticklabels(labels, fontsize=7)
    ax[1].set_xlim(0.7, 1.0)
    ax[1].set_xlabel("cohesion")
    ax[1].set_title("Most cohesive (green) vs most diverse (red), ≥5 ayat")
    fig.tight_layout(); fig.savefig(OUT / "geom_spread.png", dpi=130)
    plt.close()

    # ---- reports ----------------------------------------------------------
    with open(HERE / "out" / "surah_geometry.csv", "w", newline="",
              encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["surah", "name", "n_ayahs", "mean_len", "cohesion",
                    "umap_x", "umap_y"])
        for i, s in enumerate(surahs):
            w.writerow([s, SURAH_NAMES[s], n_ayahs[i], round(mean_len[i], 1),
                        round(cohesion[i], 4), round(cent_xy[i, 0], 3),
                        round(cent_xy[i, 1], 3)])

    L = ["# Surah-level geometry\n",
         f"{n} ayahs · 114 surahs · e5-large 1024d · cosine\n",
         "\n## Nearest surah pairs (cosine of centroid vectors)\n"]
    for sim, a, b in uniq[:20]:
        L.append(f"- **{sim:.3f}**  {a} {SURAH_NAMES[a]}  ↔  {b} {SURAH_NAMES[b]}")

    L.append("\n## Most cohesive surahs (tightest, ≥5 ayat)\n")
    for o in tight:
        L.append(f"- {cohesion[o]:.3f}  {surahs[o]} {SURAH_NAMES[surahs[o]]} "
                 f"({n_ayahs[o]} ayat, mean {mean_len[o]:.0f}w)")
    L.append("\n## Most diverse surahs (loosest, ≥5 ayat)\n")
    for o in loose:
        L.append(f"- {cohesion[o]:.3f}  {surahs[o]} {SURAH_NAMES[surahs[o]]} "
                 f"({n_ayahs[o]} ayat, mean {mean_len[o]:.0f}w)")

    L.append("\n## Correlations\n")
    L.append(f"- cohesion vs #ayat: {np.corrcoef(n_ayahs, cohesion)[0,1]:+.3f}")
    L.append(f"- cohesion vs mean length: "
             f"{np.corrcoef(mean_len, cohesion)[0,1]:+.3f}")
    (HERE / "out" / "surah_nearest.md").write_text("\n".join(L), encoding="utf-8")

    print("nearest pairs (top 8):")
    for sim, a, b in uniq[:8]:
        print(f"  {sim:.3f}  {a} {SURAH_NAMES[a]} <-> {b} {SURAH_NAMES[b]}")
    print(f"cohesion vs #ayat corr: {np.corrcoef(n_ayahs, cohesion)[0,1]:+.3f}")
    print(f"cohesion vs mean-length corr: {np.corrcoef(mean_len, cohesion)[0,1]:+.3f}")
    print("Wrote geom_*.png, surah_geometry.csv, surah_nearest.md")


if __name__ == "__main__":
    main()
