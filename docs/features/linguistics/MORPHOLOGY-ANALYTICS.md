# Morphology Analytics — Design & Findings

**Route**: `/analytics`  
**Status**: Live  
**Last updated**: June 2026

---

## Context

These visualizations emerged from a structural analysis of the Arabic morphological graph, specifically the `BiRadicalCluster` node type and its relationship to `Root` nodes. The core discovery was that Arabic occupies ~80% of the theoretical r1-r2 space (654 of ~812 possible ordered pairs from 29 radicals), and that the *missing* 20% is not random — it encodes phonological constraints.

A second key distinction emerged between **fertility** (how many words a bi-radical family produces) and **gravity** (how much textual presence those words accumulate). These are genuinely independent dimensions that produce a four-quadrant map of Arabic morphological space.

---

## Headline Numbers (as of June 2026)

| Metric | Value | What it means |
|---|---|---|
| Bi-radical families | 654 | Distinct r1-r2 consonant pairs attested in the graph |
| Tri-literal roots | ~8,200 | Distinct r1-r2-r3 combinations (`depths.r3_count` summed) |
| Lexical words | ~110k | Unique word nodes across all families |
| Corpus occurrences | ~2.5M | Total textual appearances across all words |
| Consonants in model | 29 | Unique radicals appearing in r1 or r2 position |
| Possible pairs (ordered) | ~812 | 29 × 28 (excluding self-pairs) |
| Coverage | ~80% | Fraction of possible pairs that are attested |
| r3 depth (max) | 28 | Most r3 completions for a single r1-r2 pair |

> **Note on root count**: The `root_count` property on `BiRadicalCluster` counts morphological pattern nodes (not bare tri-literal roots). True tri-literal root count = `sum(d.r3_count)` across all depth records. Lane's Lexicon (~5k roots) counts roots with full lexical entries — this graph includes morphologically derived forms Lane may not have listed separately.

---

## Design Philosophy: Surface → Deep

The Overview is designed to progress from the most accessible layer of language structure to the most abstract:

1. **Sounds** — individual consonants, their phonetic properties, corpus presence
2. **Roots** — the tri-literal combinations that carry meaning
3. **Families** — the bi-radical cores that organize root space
4. **Topology** — OCP, pair matrices, structural patterns

This order mirrors how language is actually encountered and experienced. The deepest structural analysis (topology) only makes sense once the surface layers are understood. The `ProfileBrowser` (Chart 0) embodies this philosophy — you browse entities at whatever level you choose, and each entity's profile moves from the sensory (what does it sound like, where is it produced) to the structural (how many families does it anchor, what is its corpus weight).

---

## Charts

### Chart 0 · Overview / Profile Browser (`ProfileBrowser.js`)

An entity-centered browser replacing the old static text overview. Rather than showing aggregate charts, it allows browsing individual linguistic entities — each entity gets a full profile card.

**Three entity types** (tabs in left sidebar):
- **Sound** — individual Arabic consonants (all 25+ in `PHON_CLASSES`)
- **Family** — bi-radical pairs (top 150 by selected sort)
- **Root** — tri-literal roots (top 20 from `/analytics/top-roots`)

**Sort options** change per entity type:
- Sounds: gravity (corpus total), class (articulatory group), manner (stop/fricative/nasal…), voice (voiced/voiceless), A-Z
- Families: active (corpus), prolific (root count), deep (r3 breadth), class (r1 phonological class)
- Roots: gravity (corpus), fertile (word count)

**Keyboard navigation**: ↑↓ arrow keys browse the list.

#### Sound Profile
- Hero glyph (large, class-colored, with glow)
- Phonetic label: voicing + manner + place of articulation
- Class badge
- Corpus weight bars: All / R1 / R2 / R3 (normalized, class-colored)
- **Phonetic pair** (voiced ↔ voiceless or emphatic ↔ plain): both glyphs side by side with voicing label — e.g. ع ↔ ح (pharyngeal voiced / voiceless)
- Families anchored as r1 (chips, colored by r2 class)
- Families where it appears as r2 (chips, colored by r1 class)
- Story paragraph (generated from data: positional role, phonetic class, pair, n families)

#### Family Profile
- Hero pair: r1 and r2 glyphs large, each in their class color with glow
- Class interaction label: "Guttural × Coronal"
- Stats: root count / corpus (k) / words (k) / r3 depth (N/28)
- **All root members** from `depths.r3_values` — every r3 consonant that completes this pair, displayed as `r1-r2-r3` chips colored by r3 class
- **r3 depth by class** — grid organized by phonological class; lit consonants show which classes were "explored" as r3 completions
- Top roots with per-root corpus stats (from `/analytics/top-roots` filtered by r1+r2)
- Story paragraph (generated from data: class pair, root count, depth, corpus weight, OCP note if same-class)

#### Root Profile
- Hero triradical: three large glyphs with dashes, each in its consonant's class color
- Class badges per consonant
- Corpus and words counts

---

### Chart 1 · Fertility × Gravity Scatter (`FertilityGravity.js`)

Extracted from inline code. Supports four entity types switchable in the header:

| Entity | x (fertility) | y (gravity) |
|---|---|---|
| Bi-radicals | total_words per family | total_corpus per family |
| Radicals | words across all positions | corpus across all positions |
| Rad×Position | words in this position | corpus in this position |
| Roots (per-root avg) | total_words / root_count | total_corpus / root_count |

**Quadrant labels** placed at the data median (not geometric center):
- **Civilizations** (high fertility, high gravity)
- **Sacred Cores** (low fertility, high gravity)
- **Word Factories** (high fertility, low gravity)
- **Dormant Seeds** (low fertility, low gravity)

**Outlier labels**: top 5 by fertility, gravity, gravity-per-word, root count, and form diversity — each ringed distinctively.

**Bubble size** toggle: root count / form diversity / commitment ratio (r3 count / 28) / corpus density.

**Story mode**: click a point → narrative paragraph describing that entity's archetype, metrics, and linguistic role.

---

### Chart 2 · Bi-Radical Heatmap

- **grid**: r1 (columns) × r2 (rows), all 29 consonants on each axis
- **color**: root_count (dark = absent/rare, gold = productive)
- **OCP overlay toggle**: colors axis labels by phonological class, highlights same-class pairs

**OCP finding**: The Obligatory Contour Principle (McCarthy 1986) predicts same-class consonant pairs will be suppressed in r1-r2 position. The heatmap quantifies this: the stats bar shows `same-class % populated` vs `cross-class % populated`. A substantial gap confirms OCP operates at the articulatory class level — not just at identity (identical consonant, which never appears).

---

### Chart 3 · Position Ecology

- **rows**: unique Arabic radicals
- **bars per row**: r1, r2, r3 (colored green/blue/purple)
- **metric toggle**: roots, words, corpus gravity
- **position filter**: view all-position grouped bars, or sort by r1/r2/r3 exclusively

Reveals whether certain radicals **lead** (dominate r1), **follow** (dominate r3), or are positionally neutral. Radicals with strong r1 preference are morphological initiators; those with r3 preference tend to be semantic completors.

---

### Chart 4 · 3D Space (Fertility × Gravity × Family Size)

- **x**: log(total_words) — lexical fertility
- **y**: log(total_corpus) — corpus gravity
- **z**: log(root_count) — family size (how many roots the family contains)
- **color**: corpus/words ratio, percentile-clamped (p10–p90); green = low ratio, red = high ratio
- **labeled**: top 6 by corpus, top 6 by words, top 6 by gravity/word ratio
- **interaction**: drag to rotate, scroll/pinch to zoom, auto-rotates

---

### Chart 5 · r3 Depth Map

- **grid**: r1 × r2 heatmap
- **color**: count of distinct r3 completions (dark = many, black = structurally absent, dim = no r3 data)
- **tooltip**: shows the exact r3 consonants that complete the pair

---

### Chart 6 · Radical Network

- **nodes**: unique Arabic radicals, sized by total root involvement (r1 + r2)
- **edges**: directed bi-radical pairs (r1 → r2), width = root_count (log-scaled)
- **color**: phonological class
- **interaction**: D3 force-directed, drag nodes to reorganize

---

### Chart 7 · OCP Class Matrix

- **grid**: 5×5 phonological class × class occupancy
- **cell value**: % of possible r1-r2 pairs within that class pair that are attested
- **diagonal**: same-class pairs (red border) — OCP-predicted underoccupied
- **callout**: `same-class avg` vs `cross-class avg`, OCP delta

---

### Chart 8 · Depth × Fertility Scatter

- **x**: `total_words` (log scale) — lexical fertility
- **y**: `r3_count` — structural depth (distinct r3 completions, linear)
- **size**: `root_count`
- **color**: phonological class of r1 consonant

**Quadrants:**
| | Low fertility | High fertility |
|---|---|---|
| **High depth** | Exploratory cores | Generative engines |
| **Low depth** | Sprouts | Narrow producers |

---

### Chart 9 · Corpus Distribution (Zipf)

- **bars**: top N bi-radical families ranked by corpus gravity (descending)
- **color**: phonological class of r1 consonant
- **callout**: "Top 5 = X% of corpus"
- **controls**: show top 20/40/80; toggle linear/log x-axis

---

### Chart 10 · Leadership Score

- **metric**: `r1_roots / (r1_roots + r2_roots + r3_roots)` per radical
- **interpretation**: > 0.45 = initiator, ~0.33 = neutral, < 0.25 = follower

---

### Chart 11 · Dark Matter

- **Green** (attested): present as BiRadicalCluster in data
- **Red** (OCP-absent): same-class pairs, suppressed by articulatory constraint
- **Gold** (mystery): cross-class, absent, no OCP prediction

The mystery pairs are cross-class and phonologically permitted — the language could have taken these paths but didn't.

---

### Chart 12 · Depth 3D (r3 Terrain)

- **floor grid**: r1 × r2 consonant index positions
- **height**: r3_count — how many distinct r3 consonants complete that pair
- **color**: phonological class of r1 consonant
- **interaction**: drag to rotate, scroll/pinch to zoom, auto-rotates

---

### Chart 13 · Directionality

For any pair {X, Y} where both X-Y and Y-X exist: which direction dominates? Asymmetry score = (fwd−rev)/(fwd+rev). Class view shows which phonological classes systematically prefer r1 or r2.

---

### Chart 14 · Radical Gravity

Per-radical corpus weight as r1 anchor vs positional preference. Top-right quadrant = primary anchors (heavy and consistent r1 initiators).

---

### Chart 15 · Sound Profile (`SoundProfile.js`)

Pentagon radar + 5×5 pair matrix. Originally the Overview; moved to its own tab when ProfileBrowser replaced Chart 0.

**Radar pentagon**: five phonological class axes ordered back-to-front (guttural → dorsal → emphatic → coronal → labial), showing class weight for selected metric. r2-only sub-polygon shown faint for comparison.

**5×5 pair matrix**: r1-class × r2-class, cell opacity = log-scaled corpus/words/roots value. Hover shows top 5 bi-radical pairs for that class intersection. Same-class diagonal (OCP zone) rendered distinctly.

**Metric toggle**: gravity (corpus) / fertility (words) / depth (roots).

**OCP ratio** shown below radar: cross-class avg per pair ÷ same-class avg per pair.

---

## Technical Implementation

### Backend

```
routes/modules/analytics.js
  GET /analytics/biradicals          — BiRadicalCluster nodes, all or corpus-scoped
  GET /analytics/radical-positions   — Root nodes aggregated by r1/r2/r3 with words+corpus
  GET /analytics/r3-depth            — Distinct r3 counts + r3_values per r1-r2 pair
  GET /analytics/top-roots           — Top 20 roots by corpus, all or corpus-scoped
  GET /analytics/corpora             — Available corpus list
```

All endpoints support `?corpus_id=N&surah=N` query params. Results cached to `analytics-cache.json` (24h TTL, survives pm2 restarts).

### Frontend

```
src/components/staticPages/Analytics.js   — container: data fetch, chart routing, corpus/surah filters
src/services/apiService.js                — fetchBiradicals, fetchRadicalPositions, fetchR3Depth,
                                            fetchTopRoots, fetchCorpora

src/components/analytics/
  phonology.js         — PHON_CLASSES, CLASS_META, PHONETIC_META, sameClass(), phonClass()
  shared.js            — useSize hook (ResizeObserver)
  ProfileBrowser.js    — Chart 0: entity browser (Sound / Family / Root profiles)
  FertilityGravity.js  — Chart 1: scatter with entity switching, quadrants, story mode
  SoundProfile.js      — Chart 15: pentagon radar + 5×5 pair matrix
  Scatter3D.js         — Chart 4: canvas 3D (fertility × gravity × family size)
  DepthMap.js          — Chart 5: r3 depth heatmap
  NetworkGraph.js      — Chart 6: D3 force simulation
  OCPMatrix.js         — Chart 7: 5×5 class occupancy matrix
  DepthFertility.js    — Chart 8: depth × fertility scatter
  ZipfChart.js         — Chart 9: ranked bar chart
  LeadershipChart.js   — Chart 10: per-radical r1 share bars
  DarkMatter.js        — Chart 11: absent pair grid + mystery classification
  Depth3D.js           — Chart 12: canvas 3D terrain
  DirectionalityChart.js — Chart 13: directional asymmetry analysis
  RadicalGravity.js    — Chart 14: radical corpus weight vs r1 preference
```

Charts 2–3 are inline in `Analytics.js`; all others are separate component files.

### Data Flow

```
Analytics.js useEffect (corpus_id, surah changes)
  → Promise.all([fetchBiradicals, fetchRadicalPositions, fetchR3Depth, fetchTopRoots])
  → sets: biradicals[], positions[], depths[], topRoots[]
  → passed as props to whichever chart is active
```

### Phonological Classification

Defined in `src/components/analytics/phonology.js`.

| Class | Color | Members | Articulation |
|---|---|---|---|
| Labial | Blue (#3b82f6) | ب م ف و | lips |
| Coronal | Green (#22c55e) | ت ث ج د ذ ر ز س ش ل ن ي | front of tongue |
| Emphatic | Orange (#f97316) | ص ض ط ظ | pharyngealized coronals |
| Dorsal | Purple (#a855f7) | خ غ ك ق | back of tongue / uvula |
| Guttural | Red (#ef4444) | ح ع ه ء | pharynx / larynx |

`PHONETIC_META` (added June 2026) extends each consonant with:
- `voicing`: `'voiced'` | `'voiceless'`
- `manner`: `'plosive'` | `'fricative'` | `'nasal'` | `'lateral'` | `'trill'` | `'affricate'` | `'semivowel'`
- `place`: bilabial, labiodental, dental, alveolar, palato-alveolar, palatal, velar, uvular, pharyngeal, laryngeal
- `emphatic`: boolean (pharyngealized coronals)
- `pair`: the voiced↔voiceless (or emphatic↔plain) counterpart consonant, e.g. ع ↔ ح, ت ↔ د, س ↔ ص

---

## Key Findings

### 1. Coverage and Concentration

Arabic occupies approximately **80% of theoretically possible bi-radical space** (654 of ~812 possible ordered pairs from 29 consonants). The missing 20% is not random.

### 2. OCP Confirmed at Class Level

The OCP Matrix (Chart 7) shows that same-phonological-class occupancy is substantially lower than cross-class occupancy. This confirms that McCarthy's (1986) OCP operates at the articulatory class level in Arabic, not just at consonant identity.

### 3. Power-Law Distribution (Zipf)

Corpus gravity across bi-radical families follows a steep power law. The top 5 families typically account for 20%+ of all corpus occurrences. Concentration exceeds classic Zipf — consistent with the heavy weight of Quranic vocabulary.

### 4. Fertility ≠ Gravity

High fertility (many words) does not imply high gravity (high corpus usage). Some of Arabic's most lexically rich families are textually quiet; some of its smallest families (sacred cores) appear constantly in the corpus.

### 5. Positional Specialization

Arabic radicals are not positionally neutral. Leadership scores (Chart 10) cluster well below and above the neutral 0.33 mark. This positional specialization correlates with phonological class — a structural constraint embedded in the morphological system.

### 6. Dark Matter Structure

Of the ~158 absent pairs (in our 29-consonant model), approximately 70–80% are OCP-same-class (expected), while the remaining 20–30% are **mystery dark matter** — cross-class pairs with no theoretical prediction. These mystery pairs cluster non-randomly: certain r1 consonants have more mystery-absent r2 partners than others, suggesting secondary articulatory constraints beyond the five-class OCP.

---

## Open Research Questions

1. **Quran-specific distribution**: Which families dominate Quranic text specifically vs the broader corpus?
2. **Do mystery dark matter pairs appear in dialectal or historical Arabic?**
3. **Does r3 depth correlate with corpus gravity independently?**
4. **Per-root word forms**: A `/analytics/root-words?root=ع-ل-م` endpoint would unlock the morphological paradigm view — all word forms derived from a given root.
5. **Psychological / physiological layer**: The articulatory (place + manner) dimension of sounds is captured in `PHONETIC_META`. A future layer could connect this to cognitive salience or acquisition order data.
6. **Can we predict absent pairs from cognate Semitic languages?** A pair absent in Arabic but attested in Hebrew/Aramaic/Amharic would be "possible-but-avoided" — the most structurally revealing case.

---

*Last updated: June 2026*
