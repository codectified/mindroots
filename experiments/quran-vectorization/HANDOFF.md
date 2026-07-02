# Quran Vectorization — Session Handoff

Single source of truth for resuming this work in a fresh session. Full per-
experiment write-ups are in `README.md`; this file is the orientation + state.

**Goal of this track:** vectorize the Quran (ayahs first) and explore the
*geometry* of the embedding space for pattern discovery — **not retrieval**.

---

## 1. Current state (TL;DR)

- All 6,236 ayahs are embedded with **`intfloat/multilingual-e5-large`** (real
  weights, 1024-d, L2-normalized) → `embeddings.npy`. Local files only; the
  Neo4j DB is **untouched** (no vectors written back).
- Experiments done: clustering + k-selection, surah-level geometry, whitening,
  root-distribution masks, and a raw-vs-whitened root-localization diff.
  Figures/reports in `out/`.
- **The throughline:** the dominant axis of the raw space is **verse
  length/register**, tightly coupled to **Meccan↔Medinan**. It reappears at every
  level (ayah, cluster, surah, root). Topical/root semantics are real but live
  *underneath* it — **whitening** (Exp 4) is what exposes them.

---

## 2. Environment & setup

- **Python env:** `./venv` (Python 3.12). Has torch 2.12 (MPS), sentence-
  transformers 5.6, scikit-learn, umap-learn, hdbscan, plotly, matplotlib, scipy.
  Run scripts as `./venv/bin/python <script>.py`.
- **The e5 model is NOT in this repo and NOT in Ollama.** It loads from the
  existing HuggingFace cache of the sunnah.com project:
  `HF_HOME=/Users/omaribrahim/dev/sunnah.com/search/data/hf-cache`
  (the embed/search scripts set this automatically; ~2.1 GB, already downloaded).
- **e5 convention:** documents use the `passage: ` prefix, queries `query: `;
  embeddings are L2-normalized → cosine == dot product.
- **Neo4j (Aura):** creds in `/Users/omaribrahim/dev/mindroots/.env`
  (`NEO4J_URI` neo4j+s://…, `NEO4J_USERNAME`, `NEO4J_PASSWORD`). Query with
  `node db_query.js "<cypher>"` (persistent helper in this folder).
- **Not gitignored to know:** `venv/` (1.2 GB) and `embeddings.npy` (24 MB) are
  **gitignored** — regenerate `embeddings.npy` with `embed_ayahs.py` (~84 s) if
  missing.

---

## 3. Data-model facts (learned the hard way)

- **Ayah nodes carry NO text** — only `ayah_key`, `surah_id`, `ayah_id`,
  `corpus_id`. Reconstruct ayah text from `Ayah-[:HAS_ITEM]->CorpusItem`, ordered
  by `word_position`, concatenating `full_arabic` (diacritized Uthmani rasm).
- **Quran is `corpus_id:2`.** 6,236 ayahs, 114 surahs.
- **Corpus is Uthmani rasm** (e.g. الصَّلَوٰة spelled ص-ل-و-ة, not imlā'ī ص-ل-ا-ة).
  Orthography matters: queries must match rasm.
- **Roots:** `CorpusItem.root` (Arabic string, e.g. "رحم"), 1,642 distinct in the
  Quran, ~50k token occurrences. `Root` node `english` is only the radical
  transliteration ("r-h-m"), not a gloss — pull meanings from the linked
  `CorpusItem-[:HAS_WORD]->Word.english` (note: some are placeholder "NA").
- **Words:** 55,140 `Word` nodes, text-rich: `hanswehr_entry` (clean modern EN,
  best for embedding), `definitions` (Lane, rich but noisy), `english` glosses.

---

## 4. File inventory

### Pipeline scripts (run order)
| file | what it does |
|------|------|
| `db_query.js` | ad-hoc Cypher runner (`node db_query.js "…"`) |
| `export_ayahs.js` | DB → `ayahs.jsonl` (reconstructed ayah text) |
| `embed_ayahs.py` | `ayahs.jsonl` → `embeddings.npy` + `meta.jsonl` + `manifest.json` |
| `search.py` | semantic search demo (cosine kNN) — validation only |
| `analyze.py` | KMeans (env `K`, headline 8) + centroids + UMAP + HDBSCAN + interactive HTML; writes `clusters.csv`, `out/umap_*`, `out/cluster_report.md` |
| `kselect.py` | k sweep (2–40, 4 criteria) → `out/kselect.*` |
| `k2.py` | inspect the k=2 split (console only) |
| `geometry.py` | surah-level geometry → `out/geom_*`, `out/surah_*` |
| `arrahman.py` | Ar-Rahman refrain analysis (console) |
| `whiten.py` | PCA-whiten to suppress length axis → `out/whiten_*`, `clusters_whitened.csv` |
| `root_export.js` | DB → `roots.jsonl` (root→ayah membership + glosses) |
| `root_dist.py` | root masks over existing UMAP → `out/root_gallery.png`, `out/root_distribution_report.md`, `out/root_stats.csv` |
| `root_dist_whiten.py` | per-root localization RAW vs WHITENED UMAP → `out/root_whiten_delta.csv`, `out/root_whiten_report.md`, `out/root_whiten_gallery.png` |

### Data artifacts
- `ayahs.jsonl` / `meta.jsonl` — ayah text + metadata (row-aligned with npy)
- `embeddings.npy` — float32 [6236,1024], L2-normalized (gitignored; regenerate)
- `clusters.csv` — per-ayah k=8 cluster + UMAP coords (used by geometry/root_dist)
- `clusters_whitened.csv` — per-ayah whitened cluster + whitened UMAP coords
- `roots.jsonl` — per-root occurrences, distinct ayah_keys, top glosses
- `manifest.json` — embedding run config

---

## 5. Findings by experiment (condensed; see README for detail)

1. **Embedding + validation.** Pipeline correct (an ayah's own text retrieves
   itself #1). Cross-lingual EN→AR weak; AR→AR strong but **orthography-sensitive**.
2. **Clustering (k=8 headline).** Coherent themes ordered by Meccan→Medinan /
   short-oath→long-legislative. Easter eggs at k=16: the `حم` muqaṭṭaʿāt form a
   19-ayah cluster; Surah ar-Raḥmān's refrain collapses together.
3. **k-selection.** No interior optimum — silhouette/DB/CH all favor k=2;
   inertia elbow at k=8. **Continuous manifold, not discrete clusters.** k=2 is a
   length split (short Meccan oaths vs the rest), margin only 0.046.
4. **Surah geometry.** Surahs don't form regions (only a mushaf-order≈length
   gradient). Surah centroids collapse toward the global mean (all "nearest"
   pairs ~0.999, all involve Al-Baqarah). **Inversion:** short surahs are the
   outliers/individualists; giants are generic. Trajectories are jagged
   long-range jumps (no narrative locality) except ar-Raḥmān's refrain star.
   Cohesion tracks thematic breadth, not verse length.
5. **Ar-Raḥmān (55).** Refrain `فبأي آلاء ربكما تكذبان` = 31 of 78 ayat (40%),
   identical text → one point (cosine 1.0000); the "trajectory" is 31 returns to
   that hub. Form rendered as geometry.
6. **Whitening.** PC1 (16.3% var) corr −0.73 with length; whitening (213 PCs,
   unit var) drops length-R²-by-cluster **0.71→0.23** and **surfaces topical/root
   clusters**: Fire, root ذ-ك-ر, ح-ب-ب/ح-ب-ط, demonstrative أولئك — spanning
   lengths. Latent root structure exists, masked by length.
7. **Root distributions (over raw UMAP).** Content fields localize (ن-ك-ح
   marriage, ر-ح-م mercy, ج-ن-ن garden), function words spread (ق-و-ل say, ي-و-م
   day), homonyms split (ص-ل-و prayer/burning). Caveat: raw-space localization ≈
   *register* coherence; ذ-ك-ر is broad here but tight after whitening.
8. **Root localization raw vs whitened (`root_dist_whiten.py`).** Diffs each of
   514 roots' loc between the two UMAPs (loc normalized per-space so scales
   cancel). Whitening **reorders** which roots are localized: corr(loc_raw,
   loc_whi)=+0.33 only. **80 roots cross broad→tight** (loc>1→<1) = genuine
   topical clouds unmasked — concrete content nouns lead (بحر sea 1.18→0.45,
   جبل mountain, مدن Madyan, همّ heat/smoke). **40 cross tight→broad** = register
   artifacts (نهر day/river 0.55→1.18, عبد worship). Median loc rises 0.75→0.89
   (avg root more diffuse once the length ribbon is gone). **Caveat:**
   corr(loc_raw, delta)=−0.89 — delta is floor/ceiling-coupled, so trust the
   loc=1 **threshold crossings** (80/40), not delta magnitude. "Robust" roots
   (tight in both: علو، فلح، ودد) are the length-independent semantic core.

---

## 6. Git state

- Committed: `29cef30` (embed/analyze/kselect/geometry/k2/arrahman + early
  `out/`), then `8ab2ed0` (whiten.py, root_export.js, root_dist.py, db_query.js,
  roots.jsonl, clusters_whitened.csv, README/HANDOFF, `out/whiten_*` +
  `out/root_*`).
- **NOT yet committed** (working tree): `root_dist_whiten.py`, this HANDOFF
  update, and `out/root_whiten_*` (Exp 8).
- Files persist on disk across a restart regardless. Commit when ready
  (user's standing rule: **commit only on explicit instruction**; nothing has
  been pushed to the remote).

---

## 7. Open threads / next steps

- ~~Re-run Exp 5 root masks over the whitened UMAP and diff localization vs
  raw.~~ **Done — Exp 8 (`root_dist_whiten.py`).**
- **Next up from Exp 8:** color the whitened UMAP by the 80 broad→tight roots to
  see whether they occupy *distinct* topical regions or pile into one "content"
  zone; and check where the 40 register-artifact roots land (likely the old
  length gradient).
- **Whitening variants:** try ABTT (remove only PC1–2) instead of full whitening
  to keep more structure.
- **Embedding words/roots (deferred — user found the survey "too noisy"):**
  proposed default was words via a Hans-Wehr card, roots via frequency-weighted
  mean of their word vectors, within-root spread as a polysemy metric. Not
  started. Decisions still open.
- Color maps by dominant root / root density; hierarchical dendrogram of the k≈8
  super-themes.

---

## 8. Resume commands

```bash
cd /Users/omaribrahim/dev/mindroots/experiments/quran-vectorization
# (if embeddings.npy missing) node export_ayahs.js && ./venv/bin/python embed_ayahs.py
./venv/bin/python analyze.py            # K=16 ./venv/bin/python analyze.py for finer zoom
./venv/bin/python geometry.py
./venv/bin/python whiten.py
node root_export.js && ./venv/bin/python root_dist.py
node db_query.js "MATCH (a:Ayah {corpus_id:2}) RETURN count(a)"
```
