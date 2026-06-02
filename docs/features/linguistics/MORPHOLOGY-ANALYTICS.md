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

## Charts

### Chart 0 · Overview (landing page)

Headline stats with plain-English explanations:
- What a bi-radical family is
- Why the root count differs from Lane's Lexicon
- What coverage means and what the missing 20% represents
- How to navigate the visualizations

---

### Chart 1 · Fertility × Gravity Scatter

- **x**: `total_words` (log scale) — how many distinct words a family produces
- **y**: `total_corpus` (log scale) — how many times those words appear in the corpus
- **size**: `root_count`
- **color**: phonological class of r1 consonant
- **labels**: top outliers by corpus, by words, and by gravity/word ratio (white-ringed)

**Quadrants:**
| | Low fertility | High fertility |
|---|---|---|
| **High gravity** | Sacred cores | Civilizations |
| **Low gravity** | Quiet provinces | Word factories |

The gravity-per-word ratio (tooltip) is the most revealing single number — it measures how corpus-dense each word from that family tends to be.

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
- **color**: corpus/words ratio, percentile-clamped (p10–p90) to spread colors evenly; green = low ratio, red = high ratio
- **labeled**: top 6 by corpus, top 6 by words, top 6 by gravity/word ratio
- **interaction**: drag to rotate, scroll/pinch to zoom, auto-rotates

Adding family size as a third axis separates two classes that look identical in 2D: families with high fertility and gravity but few roots (concentrated families) vs those generating many roots across the full paradigmatic range. The color (corpus/word ratio) reveals semantic density — red clusters are words that appear many times each; green clusters are productive but lightly used.

---

### Chart 5 · r3 Depth Map

- **grid**: r1 × r2 heatmap
- **color**: count of distinct r3 completions (dark = many, black = structurally absent, dim = no r3 data)
- **tooltip**: shows the exact r3 consonants that complete the pair

Depth measures how far the language "committed" to a bi-radical core. A pair with 20+ r3 completions is a generative engine. A pair with 1–2 is narrow: acknowledged but unexplored. Compare with Chart 2 (breadth) to find families that went wide vs deep.

---

### Chart 6 · Radical Network

- **nodes**: unique Arabic radicals, sized by total root involvement (r1 + r2)
- **edges**: directed bi-radical pairs (r1 → r2), width = root_count (log-scaled)
- **color**: phonological class
- **interaction**: D3 force-directed, drag nodes to reorganize

Radicals at the center with thick outgoing edges are morphological initiators. Those with thick incoming edges are receivers. OCP signature: same-colored edges should be visibly thinner/fewer than cross-color edges.

---

### Chart 7 · OCP Class Matrix

- **grid**: 5×5 phonological class × class occupancy
- **cell value**: % of possible r1-r2 pairs within that class pair that are attested
- **diagonal**: same-class pairs (red border) — OCP-predicted underoccupied
- **callout**: `same-class avg` vs `cross-class avg`, OCP delta

A dark diagonal with a bright off-diagonal is the OCP signature. The delta: if cross-class occupancy is 30%+ higher than same-class, OCP operates at the articulatory class level. Emphatics classified separately from plain coronals because pharyngealization makes them behave differently.

---

### Chart 8 · Depth × Fertility Scatter

- **x**: `total_words` (log scale) — lexical fertility
- **y**: `r3_count` — structural depth (distinct r3 completions, linear)
- **size**: `root_count`
- **color**: phonological class of r1 consonant
- **labels**: top 5 by depth, top 5 by fertility, top 4 by product of both

**Quadrants:**
| | Low fertility | High fertility |
|---|---|---|
| **High depth** | Exploratory cores | Generative engines |
| **Low depth** | Sprouts | Narrow producers |

Depth and fertility are genuinely independent. A family can generate hundreds of words while exploring only 2–3 r3 variations, or explore many r3 paths while remaining lexically contained.

---

### Chart 9 · Corpus Distribution (Zipf)

- **bars**: top N bi-radical families ranked by corpus gravity (descending)
- **color**: phonological class of r1 consonant
- **callout**: "Top 5 = X% of corpus" — the Zipf concentration expressed plainly
- **controls**: show top 20/40/80 families; toggle linear/log x-axis
- **hover**: rank, corpus count, word count, share %

The steep left-to-right drop is the Zipf power law: a small number of root families dominate the vast majority of textual usage. The top families are the semantic cores of Classical Arabic: existence, knowledge, speech, movement, divine action. The log-scale toggle reveals the power-law curve underneath the absolute counts.

---

### Chart 10 · Leadership Score

- **metric**: `r1_roots / (r1_roots + r2_roots + r3_roots)` per radical
- **left bar**: leadership score (0–1), colored by phonological class
- **right bars**: absolute r1/r2/r3 root counts
- **sort**: by leadership score, total roots, or phonological class
- **legend**: all 5 classes shown in separate row below controls

**Interpretation**:
- Score > 0.45 → morphological initiator (strongly prefers r1)
- Score ≈ 0.33 → positionally neutral
- Score < 0.25 → follower (avoids r1)

**OCP connection**: If phonological classes (gutturals, emphatics) systematically score below 0.33, their articulatory properties may impose constraints on which position they can occupy — evidence of phonological class-level position asymmetry.

---

### Chart 11 · Dark Matter

- **input**: all possible r1-r2 ordered pairs among 29 consonants (812 pairs)
- **classification**:
  - **Green** (attested): present as BiRadicalCluster in data
  - **Red** (OCP-absent): same-class pairs, suppressed by articulatory constraint
  - **Gold** (mystery): cross-class, absent, no OCP prediction
- **mystery pairs**: listed as badges grouped by r1 phonological class

The mystery pairs are the most interesting. Cross-class and phonologically permitted, they represent paths the language could have taken but didn't. Some may exist in historical, dialectal, or loaned Arabic. Others may reveal secondary articulatory constraints beyond the five-class OCP model (gestural overlap, co-articulatory constraints, frequency-based suppression).

---

### Chart 12 · Depth 3D (r3 Terrain)

- **floor grid**: r1 × r2 consonant index positions (same 29 consonants, indexed by sorted position)
- **height**: r3_count — how many distinct r3 consonants complete that pair (up = deep)
- **color**: phonological class of r1 consonant
- **size**: dot radius proportional to r3_count (max 8px)
- **vertical sticks**: drawn for families with r3 ≥ 3 (showing the height clearly)
- **gold labels**: top 30% deepest families labeled with pair_key
- **interaction**: drag to rotate, scroll/pinch to zoom, auto-rotates

The r3 depth landscape as navigable terrain. Tall columns are morphological attractors: the r1-r2 pair pulled the language into deep phonological elaboration. Color clustering reveals whether depth is concentrated in one phonological class or spread across all five. The dark valleys between columns are the family density — some regions of the r1×r2 grid are consistently more generative than others.

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

Of the ~158 absent pairs (in our 29-consonant model), approximately 70–80% are OCP-same-class (expected), while the remaining 20–30% are **mystery dark matter** — cross-class pairs with no theoretical prediction. These mystery pairs cluster non-randomly: certain r1 consonants (especially gutturals) have more mystery-absent r2 partners than others, suggesting secondary articulatory constraints beyond the five-class OCP.

---

## Open Research Questions

1. **Directionality asymmetry**: For any consonant pair {X, Y}, is X-Y more productive than Y-X? Is directionality systematic — do gutturals consistently prefer being r1 over r2, or do certain class pairs always resolve in one direction?

2. **Quran-specific distribution**: Which bi-radical families dominate Quranic text specifically vs the broader corpus? The `CorpusItem` nodes in Neo4j have `quran_frequency` and `corpus_id` — a new analytics endpoint could expose Quran-only counts per pair_key.

3. **Do mystery dark matter pairs appear in dialectal or historical Arabic?** Cross-checking against wider corpora could reveal which pairs are truly forbidden vs merely rare in Classical Arabic.

4. **Does r3 depth correlate with corpus gravity?** High depth might mean high gravity (the language committed deeply AND used it heavily), or they may be independent axes.

5. **Is the empty space stable across historical Arabic?** Loanword integration over time might fill some dark matter slots. This requires corpus-tagged data by time period.

6. **Can we predict which absent pairs are phonologically "possible" vs "forbidden"?** A pair absent in Arabic but attested in a cognate Semitic language (Hebrew, Aramaic, Amharic) would be "possible-but-avoided" — the most structurally revealing case.

---

## Technical Implementation

```
Backend:
  routes/modules/analytics.js
    GET /analytics/biradicals        — BiRadicalCluster nodes (all corpora combined)
    GET /analytics/radical-positions — Root nodes aggregated by r1/r2/r3
    GET /analytics/r3-depth          — Distinct r3 counts per r1-r2 pair

  Data available but not yet exposed:
    CorpusItem.quran_frequency       — Quran-specific occurrence count per item
    CorpusItem.corpus_id             — Corpus identifier (Quran = specific ID)
    Root.feature_corpus_count        — Per-root corpus count (source unspecified)

Frontend:
  src/components/staticPages/Analytics.js   — main container + data fetch + inline charts 0-3
  src/components/analytics/
    phonology.js       — PHON_CLASSES, CLASS_META, sameClass() helper
    shared.js          — useSize hook (ResizeObserver)
    Scatter3D.js       — Chart 4: canvas 3D (fertility × gravity × family size)
    DepthMap.js        — Chart 5: r3 depth heatmap
    NetworkGraph.js    — Chart 6: D3 force simulation
    OCPMatrix.js       — Chart 7: 5×5 class occupancy matrix
    DepthFertility.js  — Chart 8: depth × fertility scatter, colored by phon. class
    ZipfChart.js       — Chart 9: ranked bar chart, top N by corpus
    LeadershipChart.js — Chart 10: per-radical r1 share bars
    DarkMatter.js      — Chart 11: absent pair grid + mystery classification
    Depth3D.js         — Chart 12: canvas 3D terrain (r1×r2 floor, height=r3 depth)
```

Charts 1–3 are inline in `Analytics.js`; Charts 4–12 are separate component files.

Each chart has a short interpretive report rendered below it (defined in the `REPORTS` object in `Analytics.js`).

The 3D charts (4 and 12) use identical perspective-projection math as `Universe.js`: Y-rotation then X-rotation, perspective divide, back-to-front sort per frame via `requestAnimationFrame`.

---

## Phonological Classification

Defined in `src/components/analytics/phonology.js`.

| Class | Color | Members | Articulatory feature |
|---|---|---|---|
| Labial | Blue (#3b82f6) | ب م ف و | lips |
| Coronal | Green (#22c55e) | ت ث ج د ذ ر ز س ش ل ن ي | front of tongue |
| Emphatic | Orange (#f97316) | ص ض ط ظ | pharyngealized coronals |
| Dorsal | Purple (#a855f7) | خ غ ك ق | back of tongue / uvula |
| Guttural | Red (#ef4444) | ح ع ه ء | pharynx / larynx |

Emphatics are classified separately from plain coronals because pharyngealization makes them behave differently under OCP — they co-occur with coronals more freely than with each other.

---

*Screenshots not yet captured — take them manually from `/analytics` on production for each chart tab.*
