# 🌌 Lexicon Morphology Landscape — Handoff

**Status:** Deployed to production (first pass). Actively iterating on meaning/legibility.
**Last updated:** 2026-07-17
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
toward **B or C**; earlier scope wanted similarity to shape spacing (toward A). **Resolve
this first next session** — it determines how much of the layout is rewritten.

---

## 5. Also on the list (deferred, from earlier scope)
- Zoom-based level-of-detail disclosure (progressive reveal per zoom).
- 3D view.
- Similarity-based *local* embedding of roots/words (today = meaningless phyllotaxis).
- Surah-level corpus overlay (currently only corpus-level bitmask; surah not wired).
- Payload optimization (binary/ArrayBuffer + label-on-demand) if size ever matters.
- Tuning: family-region overlap when breadth is high; retina point sizing; zoom feel.

---

## 6. Operational gotchas (important)
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

## 7. How to run / verify locally
- Backend: port 5001 is hardcoded in `server.js` (note: Docker may hold 5001 on the dev
  Mac). The frontend `apiService.js` baseURL points at **production** by default; switch
  to localhost to test against a local backend.
- Quick pipeline smoke test without the full server: mount the router in-process with a
  driver built from `.env` and hit `/analytics/lexicon-cloud?rebuild=1` (see prior
  session's scratchpad `test-pipeline.js` pattern — builds ~60k points in ~7s, checks
  counts + lineage).
- Frontend: `npm start` → `/projection` → "landscape".

---

## 8. TL;DR for next session
1. **Recolor by entity type** (radical/biradical/root/word), not phonetics. Update legend.
2. **Add a radical layer** (hub points) so there's a final lineage anchor + the 4th type.
3. **Add parent pointers** in the payload (word→root→family→radical).
4. **Implement lineage tracing** on hover/click (draw ancestor path + brighten).
5. **Decide the macro-layout question (§4 A/B/C)** before rewriting layout — this is the
   crux of "I don't know what I'm looking at."
