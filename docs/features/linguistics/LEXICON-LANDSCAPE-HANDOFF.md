# 🌌 Lexicon Morphology Landscape — Handoff

**Status:** Deployed to production (first pass, unchanged since 2026-07-17 — see §1-3).
Direction has since pivoted away from the §4 A/B/C UMAP-layout debate toward a
**physics-first approach** (§5) — explored but **not implemented**; paused here to
work the HQ 6-month plan, resume later.
**Last updated:** 2026-09-28
**Live:** https://theoption.life/projection → **"landscape"** toggle
**Owner context:** second visualization mode in the Projection Lab, independent of the
existing 3D "universe" graph (which is untouched).

---

## 1. What this is

One stable, whole-lexicon **2D WebGL point map** rendering the Arabic morphology
hierarchy as ~60k points:

```
radical → bi-radical family → triliteral root → lexical word
```

- **654 families**, **5,135 roots**, **54,925 words** (60,714 points total).
- Rendered as a single `THREE.Points` cloud — no DOM node per point, no edges,
  no labels except on hover.
- The whole lexicon is a **stable base map**; corpus filter + radical selection
  are client-side **highlight/fade overlays** (alpha rewrite, no refetch/relayout).

### Current layout (parent-anchored, NOT a naive mixed UMAP)
- **Family centers** come from a *seeded* UMAP over family-level feature vectors
  (log breadth, log words, log corpus, form diversity, r1/r2 phonetic one-hots).
- **Roots** are scattered around their family center by **phyllotaxis** (golden-angle
  sunflower spiral), region radius ∝ family breadth (# roots).
- **Words** are scattered around their root by phyllotaxis, cloud radius ∝ root depth
  (# words).
- **Marker size:** family ∝ breadth, root ∝ depth, word = small fixed.
- **Color (current):** phonetic sound class of the family's *first* radical (inherited
  by its roots/words). ⚠️ **This is being changed — see §4.**
- **Opacity:** corpus attestation (bright = attested in a corpus, faint = lexicon-only).
  Only ~4,766 / 54,925 words are attested in any corpus.

> **phyllotaxis** = sunflower/pinecone spiral placement (successive golden-angle turns,
> radius ∝ √index). It fills a disc evenly but the angular position carries **no meaning**
> — which is part of why lineage isn't traceable today.

---

## 2. Architecture / where the code is

### Backend
- **`routes/modules/lexiconCloud.js`** — `GET /api/analytics/lexicon-cloud[?rebuild=1]`.
  Builds the map once, persists to `routes/modules/lexicon-cloud-cache.json`
  (gitignored; survives restarts). `?rebuild=1` forces recompute (~7s). Bump
  `SCHEMA_VERSION` to invalidate the artifact.
  - Queries: (A) triliteral roots + depth, (B) words per root + attesting corpus ids,
    (C) `BiRadicalCluster` form diversity.
  - `mulberry32(UMAP_SEED)` makes the layout deterministic across rebuilds.
  - Payload is **columnar** (parallel arrays, keys written once) → ~0.6 MB gzipped:
    `level, x, y, cls, size, w, corpora (bitmask), fam, labels[], lookup{}` + `legend`,
    `corpus_labels`, `counts`, `map_extent`.
- **`routes/modules/lib/phonology.js`** — backend mirror of the frontend phon classes
  (class index, colors, one-hot) used for feature vectors + color.
- Registered in **`routes/api.js`** (`lexiconCloudRoutes`).

### Frontend
- **`src/components/analytics/LexiconCloud.js`** — the renderer. three.js `THREE.Points`,
  orthographic 2D camera, custom pan (drag) + wheel-zoom-to-cursor, custom ShaderMaterial
  (per-point size/color/alpha, circular sprites). Two draw layers (words under structure).
  Hover picking via **d3-quadtree** over world coords → single reused tooltip div.
  Overlays (radical highlight, corpus fade) rewrite the `aAlpha` buffer in place.
  Includes the collapsible **KeyPanel** legend.
- **`src/services/apiService.js`** — `fetchLexiconCloud()`.
- **`src/components/staticPages/ProjectionLab.js`** — new **"landscape"** view toggle
  renders `<LexiconCloud highlightRadical corpusId surah/>`. Other views untouched.

### Relevant commits (all on `master`, pushed)
- `55e77d8` feat: whole-lexicon 2D hierarchical point map (landscape view)
- `4c33bef` feat: reading key (legend panel)
- `7b1f96e` fix: debounce projection API fetches (rate-limit/fail2ban fix — see §6)

---

## 3. What works / verified
- Endpoint builds + serves through real router + auth (401 no key / 200 with key).
- Lineage **data** is correct (word `كوّذ` sits in root `ك-و-ن`'s cloud in family `ك-و`).
- Deterministic layout (identical positions across rebuilds).
- Corpus scoping works: Qur'an lights 491 families / 1,674 roots / 4,271 words;
  Prose 543 words; Poetry 169 words. Radical selection fades non-matching families.
- Pan/zoom/hover functional. Frontend compiles clean.

---

## 4. Feedback from user (2026-07-17) → where we're going

The map "looks like a galaxy" but is **hard to read**. Two concrete problems:

### (a) Coloring by first radical is unhelpful
The arms/regions are colored by the family's first radical's phonetic class, which
doesn't correspond to anything the user can interpret — "I don't know what the arms mean."

➡️ **New direction: color by ENTITY TYPE**, the four primary types in the model:
`radical`, `bi-radical cluster`, `tri-radical root`, `word` (4 distinct colors).
Type/level becomes the primary visual channel instead of phonetics.
- Implementation: color from `level` instead of `cls`. Trivial in `buildLayer`
  (map level→color) and update the KeyPanel legend.
- Note: **there is currently no explicit `radical` layer of points** — radicals are
  only implied via family labels. The user names "radical" as one of the four types,
  so we likely need to **add radical hub points** (28 radicals) as a top layer
  (e.g., positioned at the centroid of the families that contain them), which also
  gives lineage a final anchor to trace to (see below).

### (b) No way to trace lineage
The user wants to follow a **word → its root → its bi-radical cluster → its initial
radical**. Impossible today: it's not visually encoded, and the payload doesn't even
carry a word's parent *root* (words only store their `fam` = family index, not the
specific root).

➡️ **New direction: make lineage traceable.** Needs both data + interaction:
1. **Backend:** add a `parent` pointer per point (word→root index, root→family index,
   family→radical). Currently only `fam` exists; add explicit parent chain so the
   client can walk word→root→family→radical.
2. **Frontend:** on hover/click of a point, **highlight its ancestor chain** — e.g.,
   draw thin connective line segments along word→root→family→radical and brighten
   those ancestors while fading the rest. Only a handful of segments per selection,
   so cheap.

### Open design decision (needs user input next session): does the macro layout change?
The current UMAP places families by feature *similarity*, so the "arms" are similarity
clusters, **not lineage**. Three options to make lineage legible:
- **A. Keep UMAP macro layout + add lineage highlighting on selection.** Minimal change;
  lineage becomes traceable on interaction, not from static structure.
- **B. Radical-anchored hierarchical (radial) layout.** Initial-radical hubs → family
  arms → root clusters → word clouds. Arms would then literally mean "families sharing
  an initial radical." Lineage visible statically; loses feature-similarity macro shape.
- **C. Hybrid.** Group families into sectors by initial radical, UMAP/spread *within*
  each sector.

The user's mental model is a strict tree (radical→biradical→root→word), which points
toward **B or C**; earlier scope wanted similarity to shape spacing (toward A).

**Superseded by §5 below** — the A/B/C framing assumed layout had to be *chosen*
(UMAP similarity vs. hand-built tree). A parallel data effort (GPT-assisted, done
directly in Neo4j, outside this repo) produced actual measured relationship strengths
between radicals, which reframes the question entirely: let the layout be *computed*
from those numbers rather than picked from a fixed menu of algorithms.

---

## 5. Physics-first pivot (2026-07-18 → 07-21) — explored, not implemented

### 5.1 What "physics" means here
Independent of this repo, the user ran a GPT-assisted analysis directly against
production Neo4j and wrote real measured properties onto Root nodes — not a new
layout, a new **data layer** the layout could be built from. Verified live in this
session (2026-07-18, via `/api/execute-query`, no direct DB creds needed):

- **Population:** 4,010 of 5,164 total Root nodes qualify as "verified triliteral"
  (`root_type='Triliteral'`, `Triliteral_ID IS NOT NULL`, `r4 IS NULL`), forming
  **1,912 canonical permutation families** (same 3 letters, different order — e.g.
  كتب/كبت/تكب/...). Only 37 families have all 6 orderings attested; average family
  has ~2.10 attested permutations, and the dominant permutation holds ~78.2% of its
  family's word gravity on average.
- **Properties confirmed present on all 4,010 roots** (spot-checked by count and
  sample, all populated):
  - `permutation_triad_key`, `permutation_attested_count`, `permutation_word_share`,
    `permutation_is_dominant`, `permutation_dominance_share`, `permutation_runner_up_gap`
  - `biradical_r1r2_word_field` / `_r1r3_` / `_r2r3_` (+ `_root_field` variants) — the
    three internal pair relationships of a triliteral root, corresponding to suffix
    (r1-r2) / infix (r1-r3) / prefix (r2-r3) completion channels
  - `radical_r1_global_word_mass` / `_r2_` / `_r3_` — global lexical productivity of
    whichever radical sits in that position, across the whole lexicon
  - `pair_r1r2_observed_word_mass` / `_expected_word_mass` / `_residual_word_mass` /
    `_lift` (+ r1r3, r2r3 variants) — observed vs. independence-model-expected
    productivity for each positional pair
  - A prediction experiment (radical + biradical fields combined) predicts which
    permutation dominates a family at ~55% vs. ~37% chance baseline (p≈0.000035
    vs. radical-only) — the interesting finding being that no single signal predicts
    it well alone, but the combination does, robustly, across cross-validation folds.
- **Interesting incidental finding this session (2026-09-28):** these properties are
  already flowing through the *live* `/api/search-roots` response for any Root node
  (confirmed via a search-roots payload) — they exist in the general data model, just
  unused by any visualization yet.
- **Known data-quality wrinkle:** ~36 of the 4,010 roots have an unresolved `"?28"`
  placeholder instead of a real radical in one slot. Not touched; excluded from every
  prototype below.

### 5.2 Core design principle that came out of this
**Separate PHYSICS (the measured weights, computed once, constant) from PROJECTION
(the chosen center/orientation/layout algorithm, freely swappable).** The same
underlying numbers should be able to produce different, individually legible
geometries depending on what's chosen as the organizing origin — a single radical, a
radical position (R1 vs R2 vs R3), a biradical pair, or nothing at all
(neutral/endogenous, letting global gravity pick the center).

### 5.3 Prototypes tried (all offline, all still exist as private Claude artifacts +
local scratchpad files — **nothing below is committed to this repo or deployed**)

| # | Approach | Outcome |
|---|---|---|
| 1 | UMAP over a *pure physics* feature vector (radical mass + biradical field + pair lift + permutation dominance, z-scored) per root, replacing the old phonetics/log-breadth vector | Same problem as §4: no center, no direction, output axes meaningless. Confirmed the algorithm class was wrong, not just the input features — UMAP/t-SNE preserve local neighborhoods only, never a global origin. |
| 2 | Radical-centered polar layout: pick a radical (e.g. ع) as literal origin, ring of the other ~26 co-occurring radicals at fixed clock positions (dictionary order), radius = measured biradical bond strength (strong → close) | First version with an actual center + meaningful direction. Well received as a *concept*, but no connecting edges — read as disconnected dots, not a structure. |
| 3 | Same origin, but with real drawn parent→child edges: origin → biradical (r1=origin only) → triradical completions, `permutation_is_dominant` highlighting the primary root per family | Branching finally legible. Two gaps flagged: (a) word-level leaves were missing entirely, (b) scope was artificially capped to "origin is r1" — real Arabic roots have the origin radical in any position. |
| 4 | Broadened to any position + added word leaves + one more hop (a root's "far pair" — the two non-origin letters — becomes a new branch point, pruned to the top 16 by word mass) | Confirmed something important: a BFS reachability check showed **the entire lexicon is reachable from any single radical within 2 hops** (only ~29 radicals total, so pair-sharing is extremely dense). This means "is it reachable" is not a useful filter — magnitude/strength has to do the pruning, not depth. |
| 5 | Whole-lexicon canvas point cloud (no branch lines at all): 31 fixed radical hubs on a ring, ~436 pairs pulled toward the shared center by measured strength, ~5,099 roots at the weighted centroid of their 3 pairs, ~54,716 words scattered around their root — same scale (~60k points) as the original UMAP landscape, rendered via canvas (not SVG) for performance | **Failed** — user's reaction: "there's no shape here or symmetry or clustering." Pulling everything toward one shared center at once collapsed whatever structure existed; too much at once with no anchor to read it against. |
| 6 | **Where we left off:** back to basics — single chosen radical as literal origin, show *only* the first orbit (its direct partner radicals), marker size ∝ productivity (biradical word field), distance from origin ∝ the same productivity ("gravity" — stronger pair = closer), no branch lines, no roots/words yet | Not yet built. This was the agreed next step when work paused to context-switch onto the 6-month plan. |

### 5.4 Resuming this later — where to pick up
1. Build prototype #6 above first (simplest possible version, already scoped) before
   re-adding roots/words/branches — confirm the single-orbit "solar system" reads
   correctly before layering anything back on.
2. Only after that reads well, re-approach multi-level structure — but informed by
   the #4/#5 lesson: **do not try to show reachability or the whole lexicon at once.**
   Depth/reach is nearly meaningless here (everything connects to everything in ~2
   hops); the entire legibility problem is a magnitude-filtering problem, not a
   layout-algorithm problem.
3. Still open, deferred from §4, now reframed: does the *macro* view (more than one
   radical at a time) ever need to exist, or is "pick one origin at a time and orbit
   outward" the whole interaction model? Not resolved — ask before building.
4. The §4 TL;DR items (entity-type coloring, parent pointers, lineage tracing) are
   still valid and **orthogonal to which layout wins** — they could be implemented
   against the *current* production UMAP landscape independently, if that's ever
   useful as an incremental improvement while the physics approach is paused.

---

## 6. Also on the list (deferred, from earlier scope)
- Zoom-based level-of-detail disclosure (progressive reveal per zoom).
- 3D view.
- Similarity-based *local* embedding of roots/words (today = meaningless phyllotaxis).
- Surah-level corpus overlay (currently only corpus-level bitmask; surah not wired).
- Payload optimization (binary/ArrayBuffer + label-on-demand) if size ever matters.
- Tuning: family-region overlap when breadth is high; retina point sizing; zoom feel.

---

## 7. Operational gotchas (important)
- **New backend deps need `npm install` on the server.** `deploy-prod.sh` pulls backend
  code + rsyncs the frontend build but does **not** run `npm install`. This feature added
  `umap-js`; it was installed manually on the server. For future deps: after deploy,
  `ssh … "cd /var/www/mindroots && npm install"` then `pm2 restart mindroots-backend`.
- **Cache rebuilds:** the map is cached to disk and survives restarts. To force a rebuild
  after changing the pipeline: hit `?rebuild=1` (or bump `SCHEMA_VERSION`, or delete
  `routes/modules/lexicon-cloud-cache.json` on the server).
- **fail2ban / rate limit:** the Projection Lab controls (surah stepping, rapid
  center/scope changes) were firing bursts of API calls that tripped nginx's `api`
  rate-limit zone; fail2ban's `nginx-limit-req` jail then **banned the client IP**
  on ports 80/443 (SSH stays open — looks like "site down" but server is healthy).
  Fixed by debouncing the fetches (`7b1f96e`, 350ms). If it recurs:
  `sudo fail2ban-client set nginx-limit-req unbanip <IP>` on the server.
- **Deploy:** `./deploy-prod.sh` (frontend-only) or `--restart-backend` for backend
  changes. Build runs locally on the Mac (server never runs webpack).

---

## 8. How to run / verify locally
- Backend: port 5001 is hardcoded in `server.js` (note: Docker may hold 5001 on the dev
  Mac). The frontend `apiService.js` baseURL points at **production** by default; switch
  to localhost to test against a local backend.
- Quick pipeline smoke test without the full server: mount the router in-process with a
  driver built from `.env` and hit `/analytics/lexicon-cloud?rebuild=1` (see prior
  session's scratchpad `test-pipeline.js` pattern — builds ~60k points in ~7s, checks
  counts + lineage).
- Frontend: `npm start` → `/projection` → "landscape".

---

## 9. TL;DR for next session (whenever this resumes)

**If resuming the physics-first direction (§5):** build the single-radical,
first-orbit-only prototype (§5.3 #6 / §5.4 #1) before anything else — it's the
smallest possible next step and was the last agreed design before this paused.
Do not re-attempt whole-lexicon-at-once (§5.3 #5 failed) or reachability-based
branching (§5.3 #4's lesson: reach ≈ everything within 2 hops, so magnitude has to
be the filter, not depth).

**If instead picking the old UMAP landscape back up as an incremental improvement**
(independent of which layout eventually wins — see §5.4 #4):
1. Recolor by entity type (radical/biradical/root/word), not phonetics. Update legend.
2. Add a radical layer (hub points) so there's a final lineage anchor + the 4th type.
3. Add parent pointers in the payload (word→root→family→radical).
4. Implement lineage tracing on hover/click (draw ancestor path + brighten).

**As of 2026-09-28, work is paused on both** to focus on the HQ-tracked 6-month
goal (Quran data validation / quran.com front-end absorption / mobile ship —
see `hq/ceo/GOALS.md`). This doc is up to date as a resume point; nothing here is
stale relative to what was actually tried.
