// Load roots data
LOAD CSV WITH HEADERS FROM 'https://theoption.life/data/roots.csv' AS rootRow
MERGE (root:Root {root_id: toInteger(rootRow.id), arabic: rootRow.`الجذور`, english: rootRow.transliterated_root, r3: rootRow.r3, r2: rootRow.r2, r1: rootRow.r1})

// Load forms data
WITH *  // Pass all variables to the next context
LOAD CSV WITH HEADERS FROM 'https://theoption.life/data/forms.csv' AS formRow
MERGE (form:Form {form_id: toInteger(formRow.id), arabic: formRow.arabic, english: formRow.english})

// Load derivatives data and link them to roots and forms
WITH *  // Pass all variables to the next context
LOAD CSV WITH HEADERS FROM 'https://theoption.life/data/derivatives.csv' AS derivativeRow
MERGE (word:Word {word_id: toInteger(derivativeRow.id), arabic: derivativeRow.arabic, english: derivativeRow.english})
WITH derivativeRow, word
MATCH (root:Root {root_id: toInteger(derivativeRow.root_id)})
MERGE (root)-[:HAS_WORD]->(word)
SET word.root_id = root.root_id
WITH derivativeRow, word
WITH word, split(replace(replace(derivativeRow.form_id, '[', ''), ']', ''), ',') AS form_ids
UNWIND form_ids AS form_id
MATCH (form:Form {form_id: toInteger(form_id)})
MERGE (word)-[:HAS_FORM]->(form)

// Load names of allah as corpus items data
WITH *  // Pass all variables to the next context
LOAD CSV WITH HEADERS FROM 'https://theoption.life/data/most_excellent_names.csv' AS nameRow
WITH nameRow 
WHERE nameRow.arabic IS NOT NULL AND nameRow.id IS NOT NULL
MERGE (item:CorpusItem {item_id: toInteger(nameRow.id), corpus_id: toInteger(nameRow.corpus_id), arabic: nameRow.arabic, transliteration: nameRow.transliteration, english: nameRow.english})

// Load quran as corpus items
LOAD CSV WITH HEADERS FROM 'https://theoption.life/data/quran.csv' AS quranRow
WITH quranRow 
WHERE quranRow.qid IS NOT NULL
MERGE (item:CorpusItem {item_id: toInteger(quranRow.qid), corpus_id: toInteger(quranRow.corpus_id), arabic: quranRow.arabic, english: quranRow.english})

LOAD CSV WITH HEADERS FROM 'https://theoption.life/data/mapping.csv' AS mappingRow
MATCH (word:Word {word_id: toInteger(mappingRow.derivative_id)})
MATCH (item:CorpusItem {item_id: toInteger(mappingRow.item_id), corpus_id: toInteger(mappingRow.corpus_id)})
MERGE (item)-[:HAS_WORD]->(word)

// Load corpora nodes with Arabic and English names
LOAD CSV WITH HEADERS FROM 'https://theoption.life/data/corpora.csv' AS corpusRow
MERGE (corpus:Corpus {
    corpus_id: toInteger(corpusRow.id)
})
SET corpus.arabic = corpusRow.arabic,
    corpus.english = corpusRow.english

// Link corpus items to Corpus nodes
WITH *
MATCH (item:CorpusItem), (corpus:Corpus {corpus_id: item.corpus_id})
MERGE (item)-[:BELONGS_TO]->(corpus)
