# Morphology Analytics — Design & Findings

**Route**: `/analytics`  
**Status**: Live  
**Last updated**: June 2026

---

## Context

These visualizations emerged from a structural analysis of the Arabic morphological graph, specifically the `BiRadicalCluster` node type and its relationship to `Root` nodes. The core discovery was that Arabic occupies ~64% of the theoretical r1-r2 space (654 of 1,024 possible ordered pairs from ~32 radicals), and that the *missing* 36% is not random — it encodes phonological constraints.

A second key distinction emerged between **fertility** (how many words a bi-radical family produces) and **gravity** (how much textual presence those words accumulate). These are genuinely independent dimensions that produce a four-quadrant map of Arabic morphological space.

---

## Charts

### Chart 1 · Fertility × Gravity Scatter

- **x**: `BiRadicalCluster.total_words` (lexical fertility)  
- **y**: `BiRadicalCluster.total_corpus` (corpus gravity)  
- **size**: `root_count` (breadth of the family)  
- **labels**: top outliers by corpus, by words, by gravity/word ratio  
- **axes**: log scale (the distributions are heavily skewed)

**Quadrants:**
| | Low fertility | High fertility |
|---|---|---|
| **High gravity** | Sacred cores | Civilizations |
| **Low gravity** | Quiet provinces | Word factories |

The gravity-per-word ratio (tooltip) is the most revealing single number — it measures how "dense" each word from a family tends to be in actual usage.

---

### Chart 2 · Bi-Radical Heatmap

- **grid**: r1 (rows) × r2 (columns), axes derived from all pair_keys
- **color**: root_count (dark = absent or rare, gold = productive)
- **OCP overlay toggle**: colors axis labels by phonological class and highlights same-class pairs

**OCP finding**: The Obligatory Contour Principle (McCarthy 1986, Frisch et al. 2004) predicts that consonants of the same major place of articulation will co-occur significantly less in r1-r2 position than cross-class pairs. The heatmap quantifies this: the stats bar shows `same-class % populated` vs `cross-class % populated`. If same-class is substantially lower, the OCP is confirmed empirically in this graph.

The main diagonal (r1 = r2, identical consonant twice) should be fully empty — Arabic roots virtually never repeat the same consonant in adjacent positions.

---

### Chart 3 · Position Ecology

- **rows**: unique Arabic radicals
- **bars per row**: r1, r2, r3 (colored green/blue/purple)
- **metric toggle**: roots, words, corpus gravity

Reveals whether certain radicals **lead** (dominate r1), **follow** (dominate r3), or are positionally neutral. Radicals with strong r1 preference are morphological initiators; those with r3 preference tend to be semantic modifiers.

---

### Chart 4 · 3D Space (Fertility × Gravity × Form Diversity)

- **x**: log(total_words) — fertility
- **y**: log(total_corpus) — gravity  
- **z**: avg_forms — form diversity (how many morphological forms a root generates)
- **color**: corpus/words ratio (gravity density, green→low, red→high)
- **interaction**: drag to rotate, scroll/pinch to zoom, auto-rotates

Adding form diversity as a third axis separates two classes that appear similar in 2D: families with high fertility and gravity but *low* form diversity (they produce many words but few morphological patterns) vs those with high form diversity (they generate the full paradigmatic range). The latter are typically the most grammatically central.

---

### Chart 5 · r3 Depth Map

- **grid**: same r1 × r2 layout as Chart 2
- **color**: count of distinct r3 completions (dark purple = many)
- **black**: no bi-radical family at all (structurally absent)
- **dark gray**: family exists but no r3 data
- **tooltip**: shows the exact r3 consonants that complete the pair

**Interpretation**: Depth measures how far the language has "committed" to a bi-radical core. A pair with 15 r3 completions is a generative engine — the language has built a substantial tri-radical family around it. A pair with 1-2 r3 completions is narrow: the language acknowledged the combination but didn't expand it.

**Depth vs breadth**: Compare Chart 2 (breadth — how many roots per family) with Chart 5 (depth — how many r3s per family). A bright cell in Chart 2 with a dark cell in Chart 5 indicates a family that generated many roots from few r3 patterns. The inverse — few roots but many r3s — would indicate a family that explored widely but didn't proliferate.

---

### Chart 6 · Radical Network

- **nodes**: unique Arabic radicals, sized by total root involvement (r1 + r2)
- **edges**: directed bi-radical pairs (r1 → r2), width = root_count (log-scaled)
- **color**: phonological class (labial/coronal/emphatic/dorsal/guttural)
- **interaction**: D3 force-directed, drag nodes to reorganize

**Reading the network**: Radicals with the most/thickest outgoing edges are morphological "initiators" — they frequently occupy r1. Those with thick incoming edges are "receivers." Radicals that are both large nodes (many total connections) and have balanced in/out edge widths are true morphological hubs.

**OCP signature**: Same-colored edges (connecting nodes of the same phonological class) should be visibly thinner/fewer than cross-color edges, especially within the coronal class (the largest, with 12 members).

---

### Chart 7 · OCP Class Matrix

- **grid**: 5×5 phonological class × class occupancy
- **cell value**: % of theoretically possible r1-r2 pairs within that class pair that are attested
- **diagonal**: same-class pairs (red border) — OCP-predicted underoccupied
- **callout**: `same-class avg` vs `cross-class avg`, OCP delta

**Reading the matrix**: A dark diagonal with a bright off-diagonal is the OCP signature. The key number is the delta: if cross-class occupancy is 30%+ higher than same-class, the OCP is operating at the articulatory class level — not just at the identity level (identical consonant, which never appears).

**Emphatics note**: Emphatics (ص ض ط ظ) are classified separately from coronals because their secondary pharyngealization makes them behave differently under OCP — they co-occur with plain coronals more freely than with each other.

---

### Chart 8 · Depth × Fertility Scatter

- **x**: `total_words` — lexical fertility (log scale)
- **y**: `r3_count` — structural depth (distinct r3 completions, linear)
- **size**: `root_count`
- **color**: `total_corpus` (purple gradient)

**Quadrants:**
| | Low fertility | High fertility |
|---|---|---|
| **High depth** | Exploratory cores | Generative engines |
| **Low depth** | Sprouts | Narrow producers |

**Key insight**: Depth and fertility are genuinely independent. A family can generate hundreds of words (high fertility) while exploring only 2-3 r3 variations (low depth). The inverse — few words but many r3 paths — indicates a family that the language explored structurally but never proliferated lexically.

---

### Chart 9 · Zipf Distribution

- **x**: log(rank) — families sorted by total_corpus descending
- **y**: log(total_corpus) — corpus gravity
- **fit line**: linear regression in log-log space
- **stats**: slope, R², comparison to Zipf slope = −1

**Reading the plot**: A straight line on a log-log plot is a power law. The slope tells you how concentrated the distribution is. Zipf's original law for word frequencies predicted slope = −1. A steeper slope (more negative) means corpus gravity is MORE concentrated — a small number of families dominate the entire corpus. This is consistent with Quranic Arabic, where a small set of roots appears thousands of times.

---

### Chart 10 · Leadership Score

- **metric**: `r1_roots / (r1_roots + r2_roots + r3_roots)` per radical
- **left bar**: leadership score colored by phonological class
- **right bars**: absolute r1/r2/r3 root counts (green/blue/purple)
- **sort**: by leadership, total roots, or class

**Interpretation**:
- Score > 0.45 → morphological initiator (strongly prefers r1)
- Score ≈ 0.33 → positionally neutral (generalist)
- Score < 0.25 → follower (avoids r1)

**OCP connection**: If certain phonological classes (gutturals, emphatics) systematically score below 0.33, their articulatory properties may be imposing constraints on which position they can occupy in a root. This would be evidence of phonological class-level position asymmetry.

---

### Chart 11 · Dark Matter

- **input**: all possible r1-r2 pairs among Arabic consonants in PHON_CLASSES (29 consonants, 812 ordered pairs)
- **classification**:
  - **Gold** (mystery): cross-class pairs, absent from data, no OCP prediction
  - **Red** (OCP-absent): same-class pairs, suppressed by articulatory constraint
  - **Green** (attested): present as BiRadicalCluster nodes

**Reading the chart**: The grid shows every possible consonant pairing. Gold cells are the most linguistically interesting — they are phonologically permitted but the language didn't commit to them. Some may exist in:
- Historical Classical Arabic (pre-Quranic attestations)
- Dialectal Arabic (Egyptian, Levantine, Gulf)
- Loanwords from Persian, Greek, Turkish
- Rare technical vocabulary

Others may reveal deeper phonotactic laws not captured by the five-class model — perhaps gestural overlap, co-articulatory constraints, or frequency-based suppression.

The mystery pairs grouped by r1 class reveal whether certain consonants are more "choosy" about their r2 partners than others.

---

## Key Findings

### 1. Coverage and Concentration

Arabic occupies approximately **80% of theoretically possible bi-radical space** (654 of ~812 possible ordered pairs from 29 consonants). The missing 20% is not random.

### 2. OCP Confirmed at Class Level

The OCP Matrix (Chart 7) shows that same-phonological-class occupancy is substantially lower than cross-class occupancy. This confirms that McCarthy's (1986) OCP operates at the articulatory class level in Arabic, not just at consonant identity.

### 3. Power-Law Distribution (Zipf)

Corpus gravity across bi-radical families follows a power law with slope steeper than −1, meaning concentration exceeds classic Zipf. The top 50 families account for a disproportionate share of all textual presence — consistent with the heavy weight of Quranic vocabulary.

### 4. Fertility ≠ Gravity

High fertility (many words) does not imply high gravity (high corpus usage). The quadrant analysis (Charts 1 and 8) reveals that some of Arabic's most lexically rich families are textually quiet, while some of its smallest families (sacred cores) appear constantly in the corpus.

### 5. Positional Specialization

Arabic radicals are not positionally neutral. Leadership scores (Chart 10) cluster below and above the neutral 0.33 mark, with few true generalists. This positional specialization correlates with phonological class — a structural constraint embedded in the morphological system.

### 6. Dark Matter Structure

Of the ~158 absent pairs (in our 29-consonant model), approximately 70-80% are OCP-same-class (expected), while the remaining 20-30% are **mystery dark matter** — cross-class pairs with no theoretical prediction. These mystery pairs cluster non-randomly: certain r1 consonants (especially gutturals) have more mystery-absent r2 partners than others, suggesting secondary articulatory constraints beyond the five-class OCP.

---

## Open Questions

1. **Do mystery dark matter pairs appear in dialectal or historical Arabic?** Cross-checking against wider corpora (Egyptian Arabic, Old Arabic inscriptions) could reveal which pairs are truly forbidden vs merely rare.

2. **Does r3 depth correlate with corpus gravity?** High depth might mean high gravity (the language committed deeply AND used it heavily), or they may be independent axes.

3. **Which radicals are true positional specialists vs generalists?** Charts 3 + 10 + 6 together can answer this — the intersection of position ecology, leadership, and network centrality.

4. **Is the empty space stable across historical Arabic?** Loanword integration over time might fill some dark matter slots. This requires corpus-tagged data by time period.

5. **Can we predict which absent pairs are phonologically "possible" vs "forbidden"?** A pair absent in Arabic but attested in a cognate Semitic language (Hebrew, Aramaic, Amharic) would be "possible-but-avoided" — the most structurally revealing case.

---

## Phonological Classification

Defined in `src/components/analytics/phonology.js`.

| Class | Color | Members | Articulatory feature |
|---|---|---|---|
| Labial | Blue | ب م ف و | lips |
| Coronal | Green | ت ث ج د ذ ر ز س ش ل ن ي | front of tongue |
| Emphatic | Orange | ص ض ط ظ | pharyngealized coronals |
| Dorsal | Purple | خ غ ك ق | back of tongue / uvula |
| Guttural | Red | ح ع ه ء | pharynx / larynx |

Emphatics are classified separately from coronals because their secondary pharyngealization makes them behave differently under OCP — they co-occur with plain coronals more freely than they co-occur with each other.

---

## Technical Implementation

```
Backend:
  routes/modules/analytics.js
    GET /analytics/biradicals        — BiRadicalCluster nodes
    GET /analytics/radical-positions — Root nodes aggregated by r1/r2/r3
    GET /analytics/r3-depth          — Distinct r3 counts per r1-r2 pair

Frontend:
  src/components/staticPages/Analytics.js   — main container + data fetch
  src/components/analytics/
    phonology.js       — shared PHON_CLASSES constant + helpers
    shared.js          — useSize hook
    Scatter3D.js       — Chart 4: canvas 3D projection (same math as Universe)
    DepthMap.js        — Chart 5: r3 depth heatmap
    NetworkGraph.js    — Chart 6: D3 force simulation
    OCPMatrix.js       — Chart 7: 5×5 class occupancy matrix
    DepthFertility.js  — Chart 8: depth × fertility scatter
    ZipfChart.js       — Chart 9: log-log power law fit
    LeadershipChart.js — Chart 10: per-radical r1 share bars
    DarkMatter.js      — Chart 11: absent pair analysis + mystery classification
```

Charts 1-3 are inline in `Analytics.js` (small enough); Charts 4-11 are separate files.

Each chart has a short interpretive report rendered below it in the UI (defined in the `REPORTS` object in `Analytics.js`).

The 3D scatter uses the identical perspective-projection math as `Universe.js` — rotation about X and Y axes, perspective divide, back-to-front sort per frame via `requestAnimationFrame`.

---

## Open Questions

1. **Are the absent r1-r2 pairs phonologically clustered or scattered?** The OCP overlay begins to answer this — quantitative confirmation pending data review.

2. **Does r3 depth correlate with corpus gravity?** High depth might mean high gravity (the language committed deeply AND used it heavily), or they might be independent.

3. **Which radicals are positional specialists vs generalists?** Chart 3 position ecology + Chart 6 network combined can answer this.

4. **Is the empty 36% stable across historical Arabic, or does it change with loanwords and neologisms?** This would require corpus-tagged data by time period.

5. **Can we predict which currently-absent pairs are phonologically "possible" (just unattested) vs. phonologically "forbidden" (OCP-blocked)?** A predicted pair that's actually attested in a Semitic cognate language would be particularly interesting.
