# Quran Ayah Vectorization — Experiment 1

First vectorization pass over MindRoots: embed all **6,236 Quran ayahs** with
`intfloat/multilingual-e5-large` (the real safetensors weights, reused from the
sunnah.com HF cache — not re-downloaded, not the Ollama small embedders).

## Pipeline

1. **`export_ayahs.js`** — Ayah nodes carry *no text*. Reconstructs each ayah's
   Arabic from `Ayah-[:HAS_ITEM]->CorpusItem`, ordered by `word_position`,
   joining `full_arabic` (diacritized). Writes `ayahs.jsonl` (canonical order).
2. **`embed_ayahs.py`** — embeds each ayah with the e5 `passage: ` prefix,
   L2-normalized, on Apple MPS (~84s for all 6,236). Writes `embeddings.npy`
   (float32 `[6236, 1024]`) + `meta.jsonl` (aligned) + `manifest.json`.
3. **`search.py`** — cosine kNN. Embeds the query with the e5 `query: ` prefix.
   `./venv/bin/python search.py "your query" 5`

Nothing is written back to Neo4j — local files only, by design.

## Findings

- **Pipeline validated.** Querying with an ayah's own exact text ranks that ayah
  #1 (e.g. 2:153 → cos 0.914), with its true semantic twins 2:45 and 3:200 right
  behind. Embeddings, alignment, normalization, and search are correct.
- **e5 cosine scores sit in a narrow ~0.84–0.91 band** — normal for e5; rely on
  *rank*, not absolute score.
- **Orthography is the dominant factor.** The corpus is in **Uthmani rasm**
  (e.g. الصَّلَوٰة, spelled ص-ل-و-ة). A query in standard imlā'ī spelling
  (الصلاة, ص-ل-ا-ة) has *different consonants* and retrieves garbage. Matching
  spellings (الرحمة, المغفرة) retrieve well. → For a usable search UX, embed/also
  index a **normalized (imlā'ī or diacritic-stripped) text variant**, or
  normalize queries to rasm.
- **Cross-lingual EN→AR is weak** on Quranic text with this model; AR→AR with
  matching orthography is strong.

## Experiment 2 — pattern exploration (clusters, centroids, UMAP)

`analyze.py` → `out/`. KMeans + centroids with nearest representative ayahs,
HDBSCAN on the UMAP plane, and UMAP 2D colored several ways. Headline **k=8**
(set via `K=8`); re-run with any `K` for finer zoom.

### Choosing k (`kselect.py` → `out/kselect.png`, `kselect.csv`)

Swept k=2..40 with four independent criteria. **No interior optimum exists** —
silhouette, Davies–Bouldin and Calinski–Harabasz all decay monotonically from
k=2; inertia bends at **k=8** then flattens. This is the rigorous confirmation
that the space is a *continuous manifold*, not discrete clusters:

- **k=2** — the only statistically clean cut, and it's a *length/register*
  split: ~827 short rhyming Meccan oath/eschatology verses (mean 4.6 words, 4%
  Medinan) vs. ~5409 longer prose verses (mean 13.6 words). But the margin is
  tiny — mean cosine 0.958 to own centroid vs 0.912 to the other — so even the
  "best" split is shaving a sliver off a tight cone, not finding a real gap.
- **k=8** — the elbow; best parsimony/coverage trade-off → chosen as headline.
  The eight clusters order cleanly by Medinan % (3% short Meccan oaths → 52%
  long legislative verses), i.e. the length/register axis.
- **k>8** — no metric reward; just subdividing the continuum. Still useful for
  zoom (k=16 surfaced the `حم` muqaṭṭaʿāt and ar-Raḥmān refrain micro-clusters).

What the space actually organizes by:

- **It's a continuous manifold, not tidy balls.** Silhouette peaks at k=4 (0.14)
  and decays monotonically; centroid-to-centroid cosine is uniformly high
  (~0.7–0.95). Classic anisotropic-embedding signature — everything lives in a
  narrow cone, so *global* separation is low but *local* structure is real.
- **The dominant axis is verse length / register**, and it tracks revelation
  place: one lobe is simultaneously long-ayah and Medinan (legislative verses);
  the rest is short, Meccan. See `umap_length.png` vs `umap_revelation.png` —
  same region lights up.
- **A detached island** sits apart from the entire rest of the Quran: the
  formulaic believer-address verses (`يا أيها الذين آمنوا …`). Form, not topic.
- **Two "easter-egg" clusters validate the embeddings capture structure beyond
  vocabulary:**
  - Cluster 7 (19 ayahs) = the **`حم` muqaṭṭaʿāt** (disconnected-letter
    openings) — and it's the one centroid that's a true outlier in the heatmap.
  - Cluster 6 collapses Surah ar-Raḥmān's refrain
    `فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ` onto itself.
- Other coherent clusters: oath openings (`والعاديات`, `والقمر`), punishment of
  past nations, theological/ayāt-recitation verses, etc. See `cluster_report.md`.

Open **`out/umap_interactive.html`** to browse — hover shows ayah_key + Arabic.
Full assignments (cluster + UMAP coords per ayah) in `clusters.csv`.

## Experiment 3 — surah-level geometry (`geometry.py` → `out/geom_*`)

Reuses the existing UMAP layout; centroids/spread computed in 1024-d. Four views:
surah-colored UMAP, surah trajectories, 114 centroids (+ MDS surah-map), and
per-surah spread. Reports in `out/surah_geometry.csv`, `out/surah_nearest.md`.

Findings:

- **Surahs don't form 114 regions** — but a **mushaf-order gradient is visible**
  because order ≈ inverse length: the detached island and short-oath top are
  high-numbered short surahs; the long-verse lobe is the low-numbered Medinan
  giants (2–9). Surah is recovered only insofar as it proxies length/register.
- **Surah centroids collapse toward the global mean.** Every "nearest pair" is
  ~0.999 and involves a giant (all roads lead to Al-Baqarah): averaging 100s of
  diverse ayahs washes out to the corpus centroid. So centroid-nearest is
  meaningful only among *short* surahs (e.g. 36 Ya-Sin ↔ 23 Al-Muminun,
  51 Adh-Dhariyat ↔ 44 Ad-Dukhan — Meccan narrative/oath kin).
- **Inversion: small surahs are the individualists.** In the MDS surah-map the
  giants form a tight diagonal "main sequence"; the short late surahs
  (99 Zalzala, 105 Fil, 108 Kawthar, 112 Ikhlas, 1 Fatihah) fly off as
  **outliers**. Small + single-theme → distinctive vector; large → generic.
- **Trajectories are jagged long-range jumps, not smooth walks.** Consecutive
  ayahs are routinely in different registers, so the space does *not* preserve
  narrative adjacency. Exceptions: short surahs stay local, and **55 Ar-Rahman**
  traces a star/fan — its refrain `فبأي آلاء ربكما تكذبان` is a recurring anchor
  the path keeps returning to.
- **No surah centroid lands in the detached island** — confirming the island is
  a *cross-surah* stylistic register (believer-address formulae), not a surah.
- **Cohesion is about thematic breadth, not verse length** (corr with mean ayah
  length ≈ 0; with #ayat −0.39). Tightest: short surahs + single-topic Medinan
  (63 Munafiqun, 60 Mumtahana, 49 Hujurat, 109 Kafirun). Loosest: long
  multi-narrative Meccan (7 Al-Araf, 37 As-Saffat, 27 An-Naml, 18 Al-Kahf,
  20 Ta-Ha) that sweep many prophet stories.

## Experiment 4 — whitening (`whiten.py` → `out/whiten_*`)

Suppress the dominant length/register axis and see if topical structure surfaces.

- **The dominant axes *are* length.** PC1 = 16.3% of variance, r=−0.73 with ayah
  length (PC2 = 5.9%, r=+0.53). The top two directions of the raw space are the
  length/register axis (and it co-varies with Meccan/Medinan).
- **Whitening** = mean-center → PCA to 213 comps (90% var) → unit-variance each.
- **Length decoupled:** variance of ayah length explained by clusters drops
  **0.71 → 0.23**. The whitened UMAP loses its macro-gradient (isotropic blob).
- **Topical / root / syntactic clusters emerge**, spanning lengths & revelation:
  - Fire (`أصحاب النار`, `النار ذات الوقود`) — 3w to 16w ayahs together
  - root **ذ-ك-ر** (remembrance): `أفلا تذكرون`, `إنما أنت مذكر`, `التذكرة`
  - **ح-ب-ب/ح-ب-ط** (love / nullified deeds): `تحبون العاجلة`, `حبطت أعمالهم`
  - demonstrative **أولئك** ("those are…") — a pure syntactic-formula cluster
- Caveat: two large catch-all clusters (~1800, ~2100) stay generic mid-length;
  short-verse residue remains (R² 0.23 ≠ 0). Whitening *reweights* toward topic,
  doesn't fully erase length. But the root/topic clusters are unambiguous.

Takeaway for a root-based project: latent **root/lexical** structure is present in
the e5 space but masked by length until whitened. `clusters_whitened.csv` has the
per-ayah whitened assignments.

## Experiment 5 — root distributions over the existing space (`root_dist.py`)

No new embeddings. `root_export.js` pulls root→ayah membership (1,642 Quranic
roots, ~50k token occurrences); `root_dist.py` masks each root's ayahs over the
existing UMAP and computes spread stats (mean pairwise dist, localization =
ratio to corpus baseline, convex-hull area, density, DBSCAN component count,
dominant k=8 cluster). Outputs: `root_gallery.png`, `root_distribution_report.md`,
`root_stats.csv`.

The organizing principle: **content fields localize, function/discourse words
spread, homonyms split.**

- **Highly localized** (loc≈0.26–0.6): topical/lexical fields — n-k-ḥ *marriage*
  (89% in the legislative cluster), n-s-w *women*, r-ḥ-m *mercy* (0.53),
  j-n-n *garden*, n-w-r *light*, r-b-b *Lord*. Coherent semantic fields tied to
  one register.
- **Broadly distributed** (loc>1.3): q-w-l *say* (1383 ayahs), y-w-m *day*
  (0.94), k-t-b *book/prescribe*, dh-k-r *remember*, j-b-l *mountain*,
  sh-r-b *drink* — discourse/temporal/pervasive words that appear everywhere.
- **Split into multiple clusters**: ṣ-l-w (3 comps, 54% outside its main blob) —
  the root conflates *prayer* and *roasting/burning in fire* (yaṣlā nāran);
  ṣ-b-ḥ *dawn / glorify*; s-b-q, k-r-m, y-s-r. Multi-modality = polysemy/homonymy.
- **Unexpectedly concentrated off-center**: n-k-ḥ, n-s-w, gh-ḍ-b *anger* — tight
  clumps far from the global centroid, sitting inside the long-Medinan
  legislative lobe.

**Honest caveat:** the underlying UMAP is length/register-dominated (Exp 2–4), so
"localized" here largely means *register-coherent* (marriage law lives in long
Medinan verses). The clean proof is dh-k-r: **broad** in this raw space, yet it
formed a tight **semantic** cluster after whitening (Exp 4). Raw-space root
masks show register coherence; whitening is needed to isolate pure semantics.

## Next experiments to consider

- A second pass on **diacritic-stripped + imlā'ī-normalized** text and compare
  retrieval (the corpus already has `full_arabic_no_diac` / `lemma_norm`).
- Embed **words** and **roots** for cross-level semantic links.
- If/when search graduates from experiment: write vectors back as an Ayah
  property + a Neo4j vector index (Aura supports native vector indexes).

## Files

| file | what |
|------|------|
| `ayahs.jsonl` | reconstructed ayah text, canonical order |
| `embeddings.npy` | float32 `[6236, 1024]`, L2-normalized |
| `meta.jsonl` | per-ayah metadata, row-aligned with the npy |
| `manifest.json` | run config (model, dims, prefixes, device) |
| `venv/` | py3.12 + torch 2.12 + sentence-transformers 5.6 (gitignore) |
