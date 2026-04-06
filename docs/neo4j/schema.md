MindRoots Graph Database Schema Documentation

Overview

This document describes the current Neo4j schema for the MindRoots system based on live database inspection.

The graph is a multi-layer linguistic + corpus + semantic model centered around Arabic roots and Quranic text.

⸻

Core Architecture Layers

1. Lexical Layer
	•	Root → Word

2. Corpus Layer
	•	Word ↔ CorpusItem (token-level occurrences)

3. Structural Layer (Quran)
	•	Ayah → CorpusItem
	•	(Optional higher layer: Surah → Ayah)

4. Semantic Layer (partially implemented)
	•	Root → Analysis
	•	(Future: Ayah → Tag / Passage)

⸻

Node Types

Root

Represents triliteral / quadriliteral Arabic roots.

Key Properties:
	•	root_id
	•	r1, r2, r3
	•	arabic
	•	english
	•	plain_root
	•	sem
	•	quran_occurrences

⸻

Word

Dictionary-level lexical entries (Lane’s Lexicon + generated forms).

Key Properties:
	•	word_id
	•	arabic
	•	english
	•	transliteration
	•	root_id
	•	word_type
	•	arabic_normalized
	•	arabic_no_diacritics
	•	wazn

⸻

CorpusItem

Represents a token instance in text (word occurrence).

Important: This is the primary execution unit for filtering and search.

Key Properties:
	•	corpus_id
	•	item_id (“69:51:3” format = surah:ayah:word)
	•	arabic
	•	english
	•	transliteration
	•	word_position
	•	lemma
	•	part_of_speech

Quran-specific additions
	•	surah_number (int)
	•	ayah_number (int)

⸻

Ayah

Represents a verse in the Quran.

Count: ~6,236 nodes

Key Properties:
	•	ayah_key (“2:3”)
	•	surah_id
	•	ayah_id
	•	corpus_id

⸻

Surah (exists but not actively used)

Connected via:
	•	(:Surah)-[:HAS_AYAH]->(:Ayah)

⸻

Analysis

Semantic annotations attached to roots.

⸻

Relationships

Core Relationships

Root → Word

(:Root)-[:HAS_WORD]->(:Word)


⸻

Word ↔ CorpusItem

(:CorpusItem)-[:HAS_WORD]->(:Word)

Maps token → dictionary entry.

⸻

Ayah → CorpusItem

(:Ayah)-[:HAS_ITEM]->(:CorpusItem)

Represents containment of tokens within a verse.

⸻

Surah → Ayah

(:Surah)-[:HAS_AYAH]->(:Ayah)


⸻

Root → Analysis

(:Root)-[:HAS_ANALYSIS]->(:Analysis)


⸻

Key Design Principles

1. Dual-layer design (critical)

Performance Layer
	•	CorpusItem properties
	•	Used for filtering, indexing, search

Semantic Layer
	•	Ayah nodes
	•	Used for grouping, tagging, meaning

⸻

2. Filtering Strategy

Filtering is ALWAYS done on CorpusItem properties:

WHERE ci.corpus_id = 2
  AND ci.surah_number IN [2,18,55]

Reason:
	•	Uses index
	•	Avoids traversal
	•	High performance

⸻

3. Traversal Strategy

Traversal is used for:
	•	lexical relationships
	•	semantic expansion

Example:

(ci:CorpusItem)-[:HAS_WORD]->(w:Word)-[:HAS_ROOT]->(r:Root)


⸻

Current Indexes

Quran filtering index

(corpus_id, surah_number)

Used for:
	•	search endpoints
	•	random node filtering

⸻

Current Usage (Backend)

Actively used
	•	Root
	•	Word
	•	CorpusItem

Not actively used in queries
	•	Ayah
	•	Surah

However, Ayah is fully connected and ready for use.

⸻

Known Patterns

Efficient Word Filtering (EXISTS semi-join)

MATCH (n:Word)
WHERE EXISTS {
  MATCH (ci:CorpusItem)
  WHERE ci.corpus_id = $corpusId
    AND ci.surah_number IN $surahNumbers
    AND (ci)-[:HAS_WORD]->(n)
}


⸻

Random Selection (optimized)

Uses:
	•	count + skip
	•	cached counts

Avoids:
	•	ORDER BY rand()

⸻

Future Extensions

Ayah Tagging (planned)

(:Ayah)-[:HAS_TAG]->(:Tag)

Passage Grouping

(:Ayah)-[:PART_OF]->(:Passage)


⸻

Design Guidance

When to use properties
	•	filtering
	•	indexing
	•	high-frequency queries

When to use nodes
	•	tagging
	•	grouping
	•	semantic relationships

⸻

Summary

The MindRoots graph is structured as:

Root → Word ← CorpusItem ← Ayah ← Surah

With a clear separation between:
	•	execution layer (CorpusItem)
	•	semantic layer (Ayah)

This enables:
	•	high-performance querying
	•	future semantic expansion

⸻

Status: Verified against production database
Last Updated: April 2026