const express = require('express');
const neo4j = require('neo4j-driver');
const router = express.Router();

// CORS Middleware
router.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');  // Adjust according to your security policy
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  
  // If the request method is OPTIONS, send a response with status 200 and end the request
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});


// Helper function to convert Neo4j integers to regular numbers
const convertIntegers = (obj) => {
  if (typeof obj === 'object' && obj !== null) {
    if ('low' in obj && 'high' in obj) {
      return neo4j.int(obj.low, obj.high).toNumber(); // Convert Neo4j integers to numbers
    }
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        obj[key] = convertIntegers(obj[key]);
      }
    }
  }
  return obj;
};

const formatSimpleData = (records) => {
  return records.map(record => ({
    item_id: record.get('item_id'),
    arabic: record.get('arabic'),
    english: record.get('english'),
    transliteration: record.get('transliteration')
  }));
};

router.get('/list/quran_items', async (req, res) => {
  const { corpus_id, sura_index } = req.query;
  if (!corpus_id || !sura_index) {
    return res.status(400).send('Missing parameters');
  }

  const session = req.driver.session();
  try {
    const result = await session.run(`
      MATCH (item:CorpusItem {corpus_id: toInteger($corpus_id), sura_index: toInteger($sura_index)})
      RETURN 
        item.arabic AS arabic, 
        item.transliteration AS transliteration, 
        toInteger(item.item_id) AS item_id,   /* Convert item_id */
        toInteger(item.aya_index) AS aya_index, /* Convert aya_index */
        item.english AS english,
        item.part_of_speech AS pos,
        item.gender AS gender
      ORDER BY item.aya_index
    `, { corpus_id, sura_index });

    const quranItems = result.records.map(record => record.toObject());
    res.json(quranItems);
  } catch (error) {
    console.error('Error fetching Quran items:', error);
    res.status(500).send('Error fetching Quran items');
  } finally {
    await session.close();
  }
});

// Endpoint to fetch poetry items by corpus_id
router.get('/list/poetry_items', async (req, res) => {
  const { corpus_id } = req.query;

  if (!corpus_id) {
    return res.status(400).send('Missing corpus_id parameter');
  }

  const session = req.driver.session();
  try {
    const result = await session.run(`
      MATCH (item:CorpusItem {corpus_id: toInteger($corpus_id)})
      RETURN 
        item.arabic AS arabic,
        item.transliteration AS transliteration,
        toInteger(item.item_id) AS item_id,  /* Convert item_id */
        item.lemma AS lemma,
        item.wazn AS wazn,
        item.part_of_speech AS pos,
        item.gender AS gender,
        item.number AS number,
        item.case AS case,
        item.prefix AS prefix,
        item.suffix AS suffix,
        toInteger(item.line_number) AS line_number,
        toInteger(item.word_position) AS word_position
      ORDER BY item.line_number, item.word_position
    `, { corpus_id });

    const poetryItems = result.records.map(record => record.toObject());
    res.json(poetryItems);
  } catch (error) {
    console.error('Error fetching poetry items:', error);
    res.status(500).send('Error fetching poetry items');
  } finally {
    await session.close();
  }
});


// Endpoint to list all corpus items by corpus_id
router.get('/list/corpus_items', async (req, res) => {
  const { corpus_id } = req.query; // Get corpus_id from query parameters
  if (!corpus_id) {
    return res.status(400).send('Missing corpus_id parameter');
  }

  const session = req.driver.session();
  try {
    const result = await session.run(`
      MATCH (item:CorpusItem {corpus_id: toInteger($corpus_id)})
      RETURN item.arabic AS arabic, item.transliteration AS transliteration, item.item_id AS item_id, item.english AS english
      LIMIT 100
    `, { corpus_id });

    const corpusItems = formatSimpleData(result.records);
    console.log('Fetched all corpus items:', corpusItems); // Add logging
    res.json(corpusItems);
  } catch (error) {
    console.error('Error fetching corpus items:', error);
    res.status(500).send('Error fetching corpus items');
  } finally {
    await session.close();
  }
});

// Endpoint to get the aya count for a specific surah
router.get('/list/surah_aya_count', async (req, res) => {
  const { sura_index } = req.query;
  if (!sura_index) {
    return res.status(400).send('Missing sura_index parameter');
  }

  const session = req.driver.session();
  try {
    const result = await session.run(`
      MATCH (item:CorpusItem {sura_index: toInteger($sura_index)})
      WITH DISTINCT item.aya_index AS aya
      RETURN count(aya) AS aya_count
    `, { sura_index });

    const ayaCount = result.records[0].get('aya_count').toInt(); // Get the aya count
    res.json({ aya_count: ayaCount });
  } catch (error) {
    console.error('Error fetching aya count:', error);
    res.status(500).send('Error fetching aya count');
  } finally {
    await session.close();
  }
});


// corpus item graph
// corpus item graph
router.get('/words_by_corpus_item/:itemId', async (req, res) => {
  const { itemId } = req.params;
  const { corpusId } = req.query;
  const session = req.driver.session();

  try {
    // Retrieve both nodes and relationships
    const query = `
      MATCH (item:CorpusItem { item_id: toInteger($itemId), corpus_id: toInteger($corpusId) })
      OPTIONAL MATCH (item)-[r1:HAS_WORD]->(word:Word)
      OPTIONAL MATCH (word)<-[r2:HAS_WORD]-(root:Root)
      OPTIONAL MATCH (word)-[r3:HAS_FORM]->(form:Form)
      OPTIONAL MATCH (word)-[r4:ETYM]-(etymWord:Word)
      RETURN
        item,
        collect(DISTINCT word)       AS words,
        collect(DISTINCT root)       AS roots,
        collect(DISTINCT form)       AS forms,
        collect(DISTINCT etymWord)   AS etymWords,
        collect(DISTINCT r1)         AS hasWordLinks,
        collect(DISTINCT r2)         AS hasRootLinks,
        collect(DISTINCT r3)         AS hasFormLinks,
        collect(DISTINCT r4)         AS hasEtymLinks
    `;

    const result = await session.run(query, { itemId, corpusId });
    const record = result.records[0];

    // If no data, return empty arrays
    if (!record) {
      return res.json({ nodes: [], links: [] });
    }

    // Prepare arrays to hold final nodes and links
    const nodes = [];
    const links = [];

    // A map of Neo4j elementId -> node object we create
    // This lets us track each node by the internal Neo4j ID so we can attach relationships correctly
    const nodeMap = {};

    // Helper function to push a node into `nodes`
    function addNode(neo4jNode, idProp, nodeType) {
      if (!neo4jNode) return;
      const properties = convertIntegers(neo4jNode.properties);

      // We build a custom string ID in React-friendly format
      // e.g. "word-123" or "form-10" etc.
      const nodeIdValue = properties[idProp]; // e.g. word.word_id
      if (!nodeIdValue) return; // If the property is missing, skip

      const uniqueId = `${nodeType.toLowerCase()}-${nodeIdValue}`;
      const fullNode = {
        id: uniqueId,
        type: nodeType,
        ...properties
      };

      nodes.push(fullNode);
      // We also store it in our map using Neo4j's elementId
      nodeMap[neo4jNode.elementId] = fullNode;
    }

    // --- Extract the raw Node objects from the record ---
    const item       = record.get('item');        // single node
    const words      = record.get('words');       // array
    const roots      = record.get('roots');       // array
    const forms      = record.get('forms');       // array
    const etymWords  = record.get('etymWords');   // array

    // --- Add them to "nodes" ---
    addNode(item, 'item_id', 'CorpusItem');

    words.forEach((w)     => addNode(w, 'word_id', 'Word'));
    roots.forEach((r)     => addNode(r, 'root_id', 'Root'));
    forms.forEach((f)     => addNode(f, 'form_id', 'Form'));
    etymWords.forEach((e) => addNode(e, 'word_id', 'Word')); 
    // Note: EtymWords are still Word nodes, just matched differently.

    // Helper function to convert each relationship to a {source, target, type} link
    function addLink(rel, defaultRelType = '') {
      if (!rel) return;
      const relType = rel.type || defaultRelType;

      // Some drivers store start node info on `rel.startNodeElementId`, others require 
      // 'id(startNode(r))' in the query. Adjust as needed:
      const startId = rel.startNodeElementId;
      const endId   = rel.endNodeElementId;
      if (!startId || !endId) return;

      const sourceNode = nodeMap[startId];
      const targetNode = nodeMap[endId];
      if (!sourceNode || !targetNode) return;

      links.push({
        source: sourceNode.id,
        target: targetNode.id,
        type:   relType
      });
    }

    // --- Now get arrays of relationships from the record ---
    const hasWordLinks = record.get('hasWordLinks'); // r1
    const hasRootLinks = record.get('hasRootLinks'); // r2
    const hasFormLinks = record.get('hasFormLinks'); // r3
    const hasEtymLinks = record.get('hasEtymLinks'); // r4

    // --- Add each relationship as a link ---
    hasWordLinks.forEach((r) => addLink(r, 'HAS_WORD'));
    hasRootLinks.forEach((r) => addLink(r, 'HAS_WORD')); // or "HAS_ROOT", but the actual rel is "HAS_WORD" in your schema
    hasFormLinks.forEach((r) => addLink(r, 'HAS_FORM'));
    hasEtymLinks.forEach((r) => addLink(r, 'ETYM'));

    // Return final response
    return res.json({ nodes, links });
  } catch (error) {
    console.error('Error fetching data:', error);
    return res.status(500).send('Internal Server Error');
  } finally {
    await session.close();
  }
});



// Endpoint to fetch words by form ID
router.get('/form/:formId', async (req, res) => {
  const { formId } = req.params;
  const { script, corpusId, rootIds } = req.query;
  const session = req.driver.session();
  try {
    let query = `
      MATCH (form:Form {form_id: toInteger($formId)})<-[:HAS_FORM]-(word:Word)
    `;

    if (corpusId) {
      query += `
        WHERE word.corpus_id = toInteger($corpusId)
      `;
    }

    if (rootIds) {
      const rootIdArray = rootIds.split(',').map(id => `toInteger(${id})`);
      query += `
        AND word.root_id IN [${rootIdArray.join(',')}]
      `;
    }

    query += `
      RETURN word
    `;

    const result = await session.run(query, { formId, script, corpusId });
    const words = result.records.map(record => convertIntegers(record.get('word').properties));

    const formattedWords = words.map(word => {
      return {
        ...word,
        label: script === 'both' ? `${word.arabic} / ${word.english}` : word[script]
      };
    });

    res.json(formattedWords);
  } catch (error) {
    console.error('Error fetching words by form:', error);
    res.status(500).send('Error fetching words by form');
  } finally {
    await session.close();
  }
});


// Endpoint to fetch words by root radicals (not working curently)
router.get('/words_by_root_radicals', async (req, res) => {
  const { r1, r2, r3, script } = req.query;
  const session = req.driver.session();
  try {
    console.log(`Received request with r1: ${r1}, r2: ${r2}, r3: ${r3}, script: ${script}`);

    let query = `
      MATCH (root:Root)
      WHERE root.r1 = $r1
    `;
    if (r2) query += ` AND root.r2 = $r2`;
    if (r3) query += ` AND root.r3 = $r3`;
    query += `
      MATCH (root)-[:HAS_WORD]->(word:Word)
      RETURN root, collect(DISTINCT word) as words
    `;

    console.log(`Generated query: ${query}`);

    const params = { r1 };
    if (r2) params.r2 = r2;
    if (r3) params.r3 = r3;

    console.log(`Query parameters: ${JSON.stringify(params)}`);

    const result = await session.run(query, params);
    console.log(`Query result: ${JSON.stringify(result.records)}`);

    const records = result.records[0];
    if (records) {
      const root = records.get('root').properties;
      const words = records.get('words').map(record => convertIntegers(record.properties));
      res.json({ root, words });
    } else {
      res.json({});
    }
  } catch (error) {
    console.error('Error fetching words by root radicals:', error);
    res.status(500).send('Error fetching words by root radicals');
  } finally {
    await session.close();
  }
});


// Endpoint to fetch roots by radicals (not working currently)
router.get('/roots_by_radicals', async (req, res) => {
  const { r1, r2, r3, script } = req.query;
  const session = req.driver.session();
  try {
    console.log(`Received request for roots with radicals r1: ${r1}, r2: ${r2}, r3: ${r3}, script: ${script}`);

    let query = `
      MATCH (root:Root)
      WHERE (root.r1 = $r1 OR $r1 = '*')
        AND (root.r2 = $r2 OR $r2 = '*')
        AND (root.r3 = $r3 OR $r3 = '*')
      RETURN root
    `;

    const result = await session.run(query, { r1, r2, r3 });
    console.log(`Raw records for roots with radicals r1: ${r1}, r2: ${r2}, r3: ${r3}:`, result.records);

    const roots = result.records.map(record => convertIntegers(record.get('root').properties));

    const formattedRoots = roots.map(root => {
      return {
        ...root,
        label: script === 'both' ? `${root.arabic} / ${root.english}` : root[script]
      };
    });

    res.json(formattedRoots);
  } catch (error) {
    console.error('Error fetching roots by radicals:', error);
    res.status(500).send('Error fetching roots by radicals');
  } finally {
    await session.close();
  }
});

// Endpoint to list all available corpora
router.get('/list/corpora', async (req, res) => {
  const session = req.driver.session();
  try {
    const result = await session.run(`
      MATCH (corpus:Corpus)
      RETURN corpus.corpus_id AS id, corpus.arabic AS arabic, corpus.english AS english, corpus.corpusType AS corpusType
    `);

    const corpora = result.records.map(record => ({
      id: convertIntegers(record.get('id')),
      arabic: record.get('arabic'),
      english: record.get('english'),
      corpusType: record.get('corpusType')
    }));

    res.json(corpora);
  } catch (error) {
    console.error('Error fetching corpora:', error);
    res.status(500).send('Error fetching corpora');
  } finally {
    await session.close();
  }
});


// Fetch words by form ID with lexicon context (no filter)
router.get('/form/:formId/lexicon', async (req, res) => {
  const { formId } = req.params;
  const { L1, L2, limit = 25 } = req.query; // Default limit to 100 if not provided
  const session = req.driver.session();
  try {
    let query = `
      MATCH (form:Form {form_id: toInteger($formId)})<-[:HAS_FORM]-(word:Word)
      RETURN word
      LIMIT toInteger($limit)
    `;
    const result = await session.run(query, { formId, limit });
    const words = result.records.map(record => convertIntegers(record.get('word').properties));
    res.json(words.map(word => ({
      ...word,
      label: L2 === 'off' ? word[L1] : `${word[L1]} / ${word[L2]}`
    })));
  } catch (error) {
    res.status(500).send('Error fetching words by form');
  } finally {
    await session.close();
  }
});

// Fetch words by form and corpus filter
router.get('/form/:formId/corpus/:corpusId', async (req, res) => {
  const { formId, corpusId } = req.params;
  const { L1, L2, limit = 25 } = req.query; // Default limit to 100 if not provided
  const session = req.driver.session();
  try {
    let query = `
      MATCH (corpus:Corpus {corpus_id: toInteger($corpusId)})<-[:BELONGS_TO]-(item:CorpusItem)-[:HAS_WORD]->(word:Word)-[:HAS_FORM]->(form:Form {form_id: toInteger($formId)})
      RETURN word
      LIMIT toInteger($limit)
    `;
    const result = await session.run(query, { formId, corpusId, limit });
    const words = result.records.map(record => convertIntegers(record.get('word').properties));
    res.json(words.map(word => ({
      ...word,
      label: L2 === 'off' ? word[L1] : `${word[L1]} / ${word[L2]}`
    })));
  } catch (error) {
    res.status(500).send('Error fetching words by form and corpus');
  } finally {
    await session.close();
  }
});


router.get('/form/:formId/roots', async (req, res) => {
  const { formId } = req.params;
  const { L1, L2, rootIds } = req.query;
  const session = req.driver.session();
  try {
    let query = `
      MATCH (form:Form {form_id: toInteger($formId)})<-[:HAS_FORM]-(word:Word)-[:HAS_ROOT]->(root:Root)
      WHERE root.root_id IN $rootIds
      RETURN word
    `;
    const result = await session.run(query, { formId, rootIds: rootIds.map(id => parseInt(id, 10)) });
    const words = result.records.map(record => convertIntegers(record.get('word').properties));
    res.json(words.map(word => ({
      ...word,
      label: L2 === 'off' ? word[L1] : `${word[L1]} / ${word[L2]}`
    })));
  } catch (error) {
    res.status(500).send('Error fetching words by form and roots');
  } finally {
    await session.close();
  }
});




// Fetch words by root ID with corpus context
router.get('/root/:rootId/corpus/:corpusId', async (req, res) => {
  const { rootId, corpusId } = req.params;
  const { script } = req.query;
  const session = req.driver.session();
  try {
    let query = `
      MATCH (corpus:Corpus {corpus_id: toInteger($corpusId)})<-[:BELONGS_TO]-(item:CorpusItem)-[:HAS_WORD]->(word:Word)-[:HAS_ROOT]->(root:Root {root_id: toInteger($rootId)})
      RETURN word
    `;
    const result = await session.run(query, { rootId, corpusId, script });
    const words = result.records.map(record => convertIntegers(record.get('word').properties));
    res.json(words.map(word => ({
      ...word,
      label: script === 'both' ? `${word.arabic} / ${word.english}` : word[script]
    })));
  } catch (error) {
    res.status(500).send('Error fetching words by root and corpus');
  } finally {
    await session.close();
  }
});


// Endpoint to fetch words by root ID
router.get('/root/:rootId', async (req, res) => {
  const { rootId } = req.params;
  const { script, corpusId } = req.query;
  const session = req.driver.session();
  try {
    let query = `
      MATCH (root:Root {root_id: toInteger($rootId)})-[:HAS_WORD]->(word:Word)
    `;

    if (corpusId) {
      query += `
        WHERE word.corpus_id = toInteger($corpusId)
      `;
    }

    query += `
      RETURN word
    `;

    const result = await session.run(query, { rootId, script, corpusId });
    const words = result.records.map(record => convertIntegers(record.get('word').properties));

    const formattedWords = words.map(word => {
      return {
        ...word,
        label: script === 'both' ? `${word.arabic} / ${word.english}` : word[script]
      };
    });

    res.json(formattedWords);
  } catch (error) {
    console.error('Error fetching words by root:', error);
    res.status(500).send('Error fetching words by root');
  } finally {
    await session.close();
  }
});

// Fetch words by root ID with lexicon context (no filter)
router.get('/root/:rootId/lexicon', async (req, res) => {
  const { rootId } = req.params;
  const { script } = req.query;
  const session = req.driver.session();
  try {
    let query = `
      MATCH (root:Root {root_id: toInteger($rootId)})-[:HAS_WORD]->(word:Word)
      RETURN word
    `;
    const result = await session.run(query, { rootId, script });
    const words = result.records.map(record => convertIntegers(record.get('word').properties));
    res.json(words.map(word => ({
      ...word,
      label: script === 'both' ? `${word.arabic} / ${word.english}` : word[script]
    })));
  } catch (error) {
    res.status(500).send('Error fetching words by root');
  } finally {
    await session.close();
  }
});

// Endpoint to execute Cypher queries
router.post('/execute-query', async (req, res) => {
  const { query } = req.body;  
  const session = req.driver.session();  

  try {
    const result = await session.run(query);
    const records = result.records.map(record => {
      const processedRecord = record.toObject();
      return convertIntegers(processedRecord);  // Ensure integers are converted
    });
    res.json(records);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Error executing query' });
  } finally {
    await session.close();
  }
});


router.get('/rootbyword/:wordId', async (req, res) => {
  const { wordId } = req.params;
  const { L1, L2 } = req.query;
  const session = req.driver.session();
  try {
    const query = `
      MATCH (root:Root)-[:HAS_WORD]->(word:Word {word_id: toInteger($wordId)})
      RETURN root
    `;
    const result = await session.run(query, { wordId: parseInt(wordId) });

    if (result.records.length > 0) {
      const root = result.records[0].get('root').properties;
      res.json({
        ...root,
        label: L2 === 'off' ? root[L1] : `${root[L1]} / ${root[L2]}`,
        root_id: root.root_id
      });
    } else {
      res.status(404).json({ error: 'Root not found' });
    }
  } catch (error) {
    console.error('Error fetching root by word:', error);
    res.status(500).json({ error: 'Error fetching root by word' });
  } finally {
    await session.close();
  }
});



router.get('/formsbyword/:wordId', async (req, res) => {
  const { wordId } = req.params;
  const { L1, L2 } = req.query;
  const session = req.driver.session();
  try {
    const query = `
      MATCH (word:Word {word_id: toInteger($wordId)})-[:HAS_FORM]->(form:Form)
      RETURN form
    `;
    const result = await session.run(query, { wordId: parseInt(wordId) });

    if (result.records.length > 0) {
      const forms = result.records.map(record => record.get('form').properties);
      res.json(forms.map(form => ({
        ...form,
        label: L2 === 'off' ? form[L1] : `${form[L1]} / ${form[L2]}`,
        form_id: form.form_id
      })));
    } else {
      res.status(404).json({ error: 'Forms not found' });
    }
  } catch (error) {
    console.error('Error fetching forms by word:', error);
    res.status(500).json({ error: 'Error fetching forms by word' });
  } finally {
    await session.close();
  }
});


router.get('/laneentry/:wordId', async (req, res) => {
  const { wordId } = req.params;
  const session = req.driver.session();
  
  try {
    const query = `
      MATCH (word:Word {word_id: toInteger($wordId)})
      RETURN word.definitions AS definitions
    `;
    const result = await session.run(query, { wordId: parseInt(wordId) });

    if (result.records.length > 0) {
      const definitions = result.records[0].get('definitions');
      res.json(definitions);
    } else {
      res.status(404).json({ error: 'Lane entry not found' });
    }
  } catch (error) {
    console.error('Error fetching Lane entry by word:', error);
    res.status(500).json({ error: 'Error fetching Lane entry by word' });
  } finally {
    await session.close();
  }
});

router.get('/hanswehrentry/:wordId', async (req, res) => {
  const { wordId } = req.params;
  const session = req.driver.session();
  
  try {
    const query = `
      MATCH (word:Word {word_id: toInteger($wordId)})
      RETURN word.hanswehr_entry AS hanswehrEntry
    `;
    const result = await session.run(query, { wordId: parseInt(wordId) });

    if (result.records.length > 0) {
      const hanswehrEntry = result.records[0].get('hanswehrEntry');
      res.json(hanswehrEntry);
    } else {
      res.status(404).json({ error: 'Hans Wehr entry not found' });
    }
  } catch (error) {
    console.error('Error fetching Hans Wehr entry by word:', error);
    res.status(500).json({ error: 'Error fetching Hans Wehr entry by word' });
  } finally {
    await session.close();
  }
});


router.get('/rootbyletters', async (req, res) => {
  const { r1, r2, r3, L1, L2, searchType } = req.query;
  const session = req.driver.session();

  try {
    let query = 'MATCH (root:Root)';
    const conditions = [];
    const params = {};

    // (1) Always consider r1 and r2 if they're set
    if (r1) {
      conditions.push('root.r1 = $r1');
      params.r1 = r1;
    }
    if (r2) {
      conditions.push('root.r2 = $r2');
      params.r2 = r2;
    }

    // (2) r3 logic:
    // If r3 === "NoR3" and searchType = "Geminate", we skip matching root.r3
    // Else if r3 is a letter, we add that condition
    if (r3 && r3 !== 'NoR3') {
      conditions.push('root.r3 = $r3');
      params.r3 = r3;
    }

    // (3) Distinguish which root types to fetch
    switch (searchType) {
      case 'Geminate':
        // Match geminate only
        conditions.push('root.root_type = "Geminate"');
        break;

      case 'Extended':
        // Quadriliteral or beyond
        conditions.push(`
          root.root_type IN [
            "Quadriliteral", 
            "Quintiliteral", 
            "Hexaliteral", 
            "Heptaliteral", 
            "BeyondTriliteral"
          ]
        `);
        break;

      case 'Triliteral':
      default:
        // If user doesn't specify or picks "Triliteral", then restrict to triliteral only
        conditions.push('root.root_type = "Triliteral"');
        break;
    }

    // (4) Build the WHERE clause
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // (5) Count total
    const countQuery = query + ' RETURN COUNT(root) AS total';
    const countResult = await session.run(countQuery, params);
    const total = countResult.records[0]?.get('total')?.low || 0;

    // (6) Fetch up to 25
    query += ' RETURN root LIMIT 25';
    const result = await session.run(query, params);

    if (result.records.length > 0) {
      const roots = result.records.map((rec) => {
        const props = rec.get('root').properties;
        return {
          ...props,
          label: L2 === 'off' ? props[L1] : `${props[L1]} / ${props[L2]}`,
          root_id: props.root_id,
        };
      });
      res.json({ roots, total });
    } else {
      res.status(404).json({ error: 'No roots found' });
    }
  } catch (error) {
    console.error('Error fetching root by letters:', error);
    res.status(500).json({ error: 'Error fetching root by letters' });
  } finally {
    await session.close();
  }
});

router.get('/geminate-roots', async (req, res) => {
  const { r1, r2, L1, L2 } = req.query;
  const session = req.driver.session();

  try {
    let query = 'MATCH (root:Root)';
    const conditions = ['root.root_type = "Geminate"'];
    const params = {};

    if (r1) {
      conditions.push('root.r1 = $r1');
      params.r1 = r1;
    }
    if (r2) {
      conditions.push('root.r2 = $r2');
      params.r2 = r2;
    }

    query += ' WHERE ' + conditions.join(' AND ') + ' RETURN root LIMIT 25';
    const result = await session.run(query, params);

    if (result.records.length > 0) {
      const roots = result.records.map(record => {
        const root = record.get('root').properties;
        return {
          ...root,
          label: L2 === 'off' ? root[L1] : `${root[L1]} / ${root[L2]}`,
          root_id: root.root_id,
        };
      });
      res.json({ roots, total: roots.length });
    } else {
      res.status(404).json({ error: 'No geminate roots found' });
    }
  } catch (error) {
    console.error('Error fetching geminate roots:', error);
    res.status(500).json({ error: 'Error fetching geminate roots' });
  } finally {
    await session.close();
  }
});


router.get('/triliteral-roots', async (req, res) => {
  const { r1, r2, r3, L1, L2 } = req.query;
  const session = req.driver.session();

  try {
    let query = 'MATCH (root:Root)';
    const conditions = ['root.root_type = "Triliteral"'];
    const params = {};

    // Add conditions for R1 and R2
    if (r1 && r1 !== '*') {
      conditions.push('root.r1 = $r1');
      params.r1 = r1;
    }
    if (r2 && r2 !== '*') {
      conditions.push('root.r2 = $r2');
      params.r2 = r2;
    }

    // Handle R3
    if (r3 === 'NoR3') {
      // Geminate case; exclude R3
      conditions.push('root.r3 IS NULL');
    } else if (r3 && r3 !== '*') {
      // Specific triliteral case
      conditions.push('root.r3 = $r3');
      params.r3 = r3;
    }

    // Ensure no additional radicals exist
    conditions.push('root.r4 IS NULL');
    conditions.push('root.r5 IS NULL');
    conditions.push('root.r6 IS NULL');

    query += ' WHERE ' + conditions.join(' AND ') + ' RETURN root LIMIT 25';

    const result = await session.run(query, params);

    if (result.records.length > 0) {
      const roots = result.records.map((record) => {
        const root = record.get('root').properties;
        return {
          ...root,
          label: L2 === 'off' ? root[L1] : `${root[L1]} / ${root[L2]}`,
          root_id: root.root_id,
        };
      });
      res.json({ roots, total: roots.length });
    } else {
      res.status(404).json({ error: 'No triliteral roots found' });
    }
  } catch (error) {
    console.error('Error fetching triliteral roots:', error);
    res.status(500).json({ error: 'Error fetching triliteral roots' });
  } finally {
    await session.close();
  }
});


router.get('/extended-roots', async (req, res) => {
  const { r1, r2, r3, L1, L2 } = req.query;
  const session = req.driver.session();

  try {
    let query = 'MATCH (root:Root)';
    const conditions = [
      `root.root_type IN [
        "Quadriliteral",
        "Quintiliteral",
        "Hexaliteral",
        "Heptaliteral",
        "BeyondTriliteral"
      ]`,
    ];
    const params = {};

    if (r1) {
      conditions.push('root.r1 = $r1');
      params.r1 = r1;
    }
    if (r2) {
      conditions.push('root.r2 = $r2');
      params.r2 = r2;
    }
    if (r3) {
      conditions.push('root.r3 = $r3');
      params.r3 = r3;
    }

    query += ' WHERE ' + conditions.join(' AND ') + ' RETURN root LIMIT 25';
    const result = await session.run(query, params);

    if (result.records.length > 0) {
      const roots = result.records.map(record => {
        const root = record.get('root').properties;
        return {
          ...root,
          label: L2 === 'off' ? root[L1] : `${root[L1]} / ${root[L2]}`,
          root_id: root.root_id,
        };
      });
      res.json({ roots, total: roots.length });
    } else {
      res.status(404).json({ error: 'No extended roots found' });
    }
  } catch (error) {
    console.error('Error fetching extended roots:', error);
    res.status(500).json({ error: 'Error fetching extended roots' });
  } finally {
    await session.close();
  }
});





const fs = require('fs');
const path = require('path');

// Endpoint to list all Markdown files in a directory
router.get('/list-markdown-files', (req, res) => {
  const directoryPath = path.join(__dirname, '../public/theoption.life'); // Adjust path if needed

  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error('Unable to scan directory:', err);
      return res.status(500).send('Unable to scan directory');
    }

    // Filter only .md files and return their names
    const markdownFiles = files.filter(file => file.endsWith('.md'));
    res.json(markdownFiles);
  });
});


module.exports = router;
