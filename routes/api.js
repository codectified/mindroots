const express = require('express');
const neo4j = require('neo4j-driver');
const { authenticateAPI, authenticateAdminAPI, sanitizeReadOnlyQuery } = require('../middleware/auth');
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

// API Authentication middleware
router.use(authenticateAPI);


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
    transliteration: record.get('transliteration'),
    sem: record.get('sem')
  }));
};

router.get('/list/quran_items', async (req, res) => {
  const { corpus_id, sura_index } = req.query;
  if (!corpus_id || !sura_index) {
    return res.status(400).send('Missing parameters');
  }

  const session = req.driver.session();
  try {
    // Handle different corpus schemas
    let result;
    if (corpus_id === '2') {
      // Corpus 2: Hierarchical IDs (surah:ayah:word) with s1_ prefixed properties
      result = await session.run(`
        MATCH (item:CorpusItem {corpus_id: toInteger($corpus_id)})
        WITH item, split(item.item_id, ':') as parts
        WHERE toInteger(parts[0]) = toInteger($sura_index)
        RETURN 
          item.sem AS arabic,  /* Use sem as full word display */
          item.transliteration AS transliteration, 
          item.item_id AS item_id,
          toInteger(parts[1]) AS aya_index,
          item.english AS english,
          item.sem AS sem,
          item.s1_tag AS pos,
          item.gender AS gender,
          toInteger(parts[0]) AS surah,
          toInteger(parts[1]) AS ayah,
          toInteger(parts[2]) AS word
        ORDER BY toInteger(parts[1]), toInteger(parts[2])
      `, { corpus_id, sura_index });
    } else {
      // Corpus 1 & 3: Sequential integer IDs - just return all items (no sura filtering)
      result = await session.run(`
        MATCH (item:CorpusItem {corpus_id: toInteger($corpus_id)})
        RETURN 
          item.arabic AS arabic, 
          item.transliteration AS transliteration, 
          toInteger(item.item_id) AS item_id,
          0 AS aya_index,  /* Default aya_index */
          item.english AS english,
          item.sem AS sem,
          item.part_of_speech AS pos,
          item.gender AS gender
        ORDER BY item.item_id
        LIMIT 50
      `, { corpus_id });
    }

// API Authentication middleware
router.use(authenticateAPI);

    const quranItems = result.records.map(record => record.toObject());
    res.json(quranItems);
  } catch (error) {
    console.error('Error fetching Quran items:', error);
    res.status(500).send('Error fetching Quran items');
  } finally {
    await session.close();
  }
});

// Optimized endpoint for Quran items with aya range support
router.get('/list/quran_items_range', async (req, res) => {
  const { corpus_id, sura_index, start_aya, end_aya } = req.query;
  if (!corpus_id || !sura_index) {
    return res.status(400).send('Missing required parameters: corpus_id, sura_index');
  }

  const session = req.driver.session();
  try {
    let query, params = { corpus_id, sura_index };
    
    if (corpus_id === '2') {
      // Corpus 2: Hierarchical IDs (surah:ayah:word)
      query = `
        MATCH (item:CorpusItem {corpus_id: toInteger($corpus_id)})
        WITH item, split(item.item_id, ':') as parts
        WHERE toInteger(parts[0]) = toInteger($sura_index)
      `;
      
      // Add aya range filtering if specified  
      if (start_aya && end_aya) {
        query += ` AND toInteger(parts[1]) >= toInteger($start_aya) AND toInteger(parts[1]) <= toInteger($end_aya)`;
        params.start_aya = start_aya;
        params.end_aya = end_aya;
      } else if (start_aya) {
        query += ` AND toInteger(parts[1]) >= toInteger($start_aya)`;
        params.start_aya = start_aya;
      } else if (end_aya) {
        query += ` AND toInteger(parts[1]) <= toInteger($end_aya)`;
        params.end_aya = end_aya;
      }
      
      query += `
        RETURN 
          item.sem AS arabic,  /* Use sem for full word display */
          item.transliteration AS transliteration, 
          item.item_id AS item_id,
          toInteger(parts[1]) AS aya_index,
          item.english AS english,
          item.sem AS sem,
          item.s1_tag AS pos,
          item.gender AS gender,
          toInteger(parts[0]) AS sura_index,
          toInteger(parts[0]) AS surah,
          toInteger(parts[1]) AS ayah,
          toInteger(parts[2]) AS word
        ORDER BY toInteger(parts[1]), toInteger(parts[2])
      `;
    } else {
      // Corpus 1 & 3: Sequential integer IDs - no sura/aya structure
      query = `
        MATCH (item:CorpusItem {corpus_id: toInteger($corpus_id)})
        RETURN 
          item.arabic AS arabic, 
          item.transliteration AS transliteration, 
          toInteger(item.item_id) AS item_id,
          0 AS aya_index,  /* Default aya_index */
          item.english AS english,
          item.sem AS sem,
          item.part_of_speech AS pos,
          item.gender AS gender,
          toInteger($corpus_id) AS sura_index
        ORDER BY item.item_id
        LIMIT 50
      `;
    }

    const result = await session.run(query, params);
    const quranItems = result.records.map(record => convertIntegers(record.toObject()));
    res.json(quranItems);
  } catch (error) {
    console.error('Error fetching Quran items with range:', error);
    res.status(500).send('Error fetching Quran items with range');
  } finally {
    await session.close();
  }
});

// API Authentication middleware
router.use(authenticateAPI);

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
        item.sem AS sem,
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
      ORDER BY item.line_number, item.item_id
    `, { corpus_id });

// API Authentication middleware
router.use(authenticateAPI);

    const poetryItems = result.records.map(record => convertIntegers(record.toObject()));
    res.json(poetryItems);
  } catch (error) {
    console.error('Error fetching poetry items:', error);
    res.status(500).send('Error fetching poetry items');
  } finally {
    await session.close();
  }
});

// API Authentication middleware
router.use(authenticateAPI);


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
      RETURN item.arabic AS arabic, item.transliteration AS transliteration, item.item_id AS item_id, item.english AS english, item.sem AS sem
      LIMIT 100
    `, { corpus_id });

// API Authentication middleware
router.use(authenticateAPI);

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

// API Authentication middleware
router.use(authenticateAPI);

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

// API Authentication middleware
router.use(authenticateAPI);

    const ayaCount = result.records[0].get('aya_count').toInt(); // Get the aya count
    res.json({ aya_count: ayaCount });

// API Authentication middleware
router.use(authenticateAPI);
  } catch (error) {
    console.error('Error fetching aya count:', error);
    res.status(500).send('Error fetching aya count');
  } finally {
    await session.close();
  }
});

// API Authentication middleware
router.use(authenticateAPI);


// DEPRECATED: Use /expand/corpusitem/:itemId/word instead
// corpus item graph
router.get('/words_by_corpus_item/:itemId', async (req, res) => {
  const { itemId } = req.params;
  const { corpusId, script } = req.query; // Added corpusId here
  const session = req.driver.session();
  
  try {
    // Updated query to match the CorpusItem with both item_id and corpus_id, and remove form
    let query = `
      MATCH (item:CorpusItem {item_id: toInteger($itemId), corpus_id: toInteger($corpusId)})
      OPTIONAL MATCH (item)-[:HAS_WORD]->(word:Word)
      OPTIONAL MATCH (word)<-[:HAS_WORD]-(root:Root)
      OPTIONAL MATCH (word)-[:HAS_FORM]->(form:Form)
      RETURN item, collect(DISTINCT word) as words, collect(DISTINCT root) as roots, collect(DISTINCT form) as forms
    `;

    const result = await session.run(query, { itemId, corpusId });

// API Authentication middleware
router.use(authenticateAPI);
    const records = result.records[0];
    if (records) {
      const item = records.get('item').properties;
      const words = records.get('words').map(record => convertIntegers(record.properties));
      const roots = records.get('roots').map(record => convertIntegers(record.properties));
      const forms = records.get('forms').map(record => convertIntegers(record.properties));
      res.json({ item, words, roots, forms });

// API Authentication middleware
router.use(authenticateAPI);
    } else {
      res.json({});

// API Authentication middleware
router.use(authenticateAPI);
    }
  } catch (error) {
    console.error('Error fetching words and roots by corpus item:', error);
    res.status(500).send('Error fetching words and roots by corpus item');
  } finally {
    await session.close();
  }
});

// API Authentication middleware
router.use(authenticateAPI);



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

// API Authentication middleware
router.use(authenticateAPI);
    const words = result.records.map(record => convertIntegers(record.get('word').properties));

    const formattedWords = words.map(word => {
      return {
        ...word,
        label: script === 'both' ? `${word.arabic} / ${word.english}` : word[script]
      };
    });

// API Authentication middleware
router.use(authenticateAPI);

    res.json(formattedWords);
  } catch (error) {
    console.error('Error fetching words by form:', error);
    res.status(500).send('Error fetching words by form');
  } finally {
    await session.close();
  }
});

// API Authentication middleware
router.use(authenticateAPI);


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

// API Authentication middleware
router.use(authenticateAPI);
    } else {
      res.json({});

// API Authentication middleware
router.use(authenticateAPI);
    }
  } catch (error) {
    console.error('Error fetching words by root radicals:', error);
    res.status(500).send('Error fetching words by root radicals');
  } finally {
    await session.close();
  }
});

// API Authentication middleware
router.use(authenticateAPI);


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

// API Authentication middleware
router.use(authenticateAPI);
    console.log(`Raw records for roots with radicals r1: ${r1}, r2: ${r2}, r3: ${r3}:`, result.records);

    const roots = result.records.map(record => convertIntegers(record.get('root').properties));

    const formattedRoots = roots.map(root => {
      return {
        ...root,
        id: `root_${Number(root.root_id?.low !== undefined ? root.root_id.low : root.root_id)}`,
        type: 'root',
        label: script === 'both' ? `${root.arabic} / ${root.english}` : root[script]
      };
    });

// API Authentication middleware
router.use(authenticateAPI);

    res.json(formattedRoots);
  } catch (error) {
    console.error('Error fetching roots by radicals:', error);
    res.status(500).send('Error fetching roots by radicals');
  } finally {
    await session.close();
  }
});

// API Authentication middleware
router.use(authenticateAPI);

// Endpoint to list all available corpora
router.get('/list/corpora', async (req, res) => {
  const session = req.driver.session();
  try {
    const result = await session.run(`
      MATCH (corpus:Corpus)
      RETURN corpus.corpus_id AS id, corpus.arabic AS arabic, corpus.english AS english, corpus.sem AS sem, corpus.corpusType AS corpusType
    `);

    const corpora = result.records.map(record => ({
      id: convertIntegers(record.get('id')),
      arabic: record.get('arabic'),
      english: record.get('english'),
      sem: record.get('sem'),
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

// API Authentication middleware
router.use(authenticateAPI);


// Consolidated expansion route
router.get('/expand/:sourceType/:sourceId/:targetType', async (req, res) => {
  const { sourceType, targetType } = req.params;
  const { L1, L2 } = req.query;
  
  // Handle different ID formats: hierarchical strings (Corpus 2) vs integers (Corpus 1,3)
  let sourceId = req.params.sourceId;
  const corpus_id = req.query.corpus_id ? parseInt(req.query.corpus_id, 10) : null;
  
  // Only convert to integer for non-corpus items or non-hierarchical corpus items
  if (sourceType !== 'corpusitem' || (sourceType === 'corpusitem' && !sourceId.includes(':'))) {
    sourceId = parseInt(sourceId, 10);
  }
  const limit = parseInt(req.query.limit || 25, 10);
  
  console.log(`Expand route called: ${sourceType}/${sourceId}/${targetType}`, { L1, L2, corpus_id, limit, sourceIdType: typeof sourceId, corpusIdType: typeof corpus_id, limitType: typeof limit });
  
  const session = req.driver.session();
  
  try {
    let query = '';
    let params = { sourceId, limit };
    
    // Add corpus_id to params if provided
    if (corpus_id) {
      params.corpus_id = corpus_id;
    }
    
    // Build query based on source and target types
    if (sourceType === 'root' && targetType === 'word') {
      if (corpus_id) {
        query = `
          MATCH (root:Root {root_id: toInteger($sourceId)})-[:HAS_WORD]->(word:Word)
          MATCH (corpus:Corpus {corpus_id: toInteger($corpus_id)})<-[:BELONGS_TO]-(item:CorpusItem)-[:HAS_WORD]->(word)
          OPTIONAL MATCH (word)-[:ETYM]->(etym:Word)
          RETURN DISTINCT root, word, etym
          LIMIT toInteger($limit)
        `;
      } else {
        query = `
          MATCH (root:Root {root_id: toInteger($sourceId)})-[:HAS_WORD]->(word:Word)
          OPTIONAL MATCH (word)-[:ETYM]->(etym:Word)
          RETURN DISTINCT root, word, etym
          LIMIT toInteger($limit)
        `;
      }
    } else if (sourceType === 'form' && targetType === 'word') {
      if (corpus_id) {
        query = `
          MATCH (form:Form {form_id: toInteger($sourceId)})<-[:HAS_FORM]-(word:Word)
          MATCH (corpus:Corpus {corpus_id: toInteger($corpus_id)})<-[:BELONGS_TO]-(item:CorpusItem)-[:HAS_WORD]->(word)
          RETURN DISTINCT form, word
          LIMIT toInteger($limit)
        `;
      } else {
        query = `
          MATCH (form:Form {form_id: toInteger($sourceId)})<-[:HAS_FORM]-(word:Word)
          RETURN DISTINCT form, word
          LIMIT toInteger($limit)
        `;
      }
    } else if (sourceType === 'corpusitem' && targetType === 'word') {
      // CONSOLIDATED: This replaces the legacy /words_by_corpus_item/:itemId route
      // Returns corpus item + connected words, forms, and roots with proper relationships
      if (!corpus_id) {
        return res.status(400).json({ error: 'corpus_id is required for corpusitem expansion' });

// API Authentication middleware
router.use(authenticateAPI);
      }
      // Handle different corpus ID formats
      const corpusItemQuery = typeof sourceId === 'string' 
        ? `MATCH (item:CorpusItem {item_id: $sourceId, corpus_id: toInteger($corpus_id)})`  // Hierarchical IDs
        : `MATCH (item:CorpusItem {item_id: toInteger($sourceId), corpus_id: toInteger($corpus_id)})`; // Integer IDs
        
      query = `
        ${corpusItemQuery}
        OPTIONAL MATCH (item)-[:HAS_WORD]->(word:Word)
        OPTIONAL MATCH (word)-[:HAS_FORM]->(form:Form)
        OPTIONAL MATCH (word)<-[:HAS_WORD]-(root:Root)
        RETURN DISTINCT item, word, root, form
      `;
    } else if (sourceType === 'word' && targetType === 'corpusitem') {
      // NEW: Word -> CorpusItem expansion
      // Find all corpus items that contain this word
      if (corpus_id) {
        query = `
          MATCH (word:Word {word_id: toInteger($sourceId)})
          MATCH (word)<-[:HAS_WORD]-(item:CorpusItem)-[:BELONGS_TO]->(corpus:Corpus {corpus_id: toInteger($corpus_id)})
          RETURN DISTINCT word, item
          LIMIT toInteger($limit)
        `;
      } else {
        query = `
          MATCH (word:Word {word_id: toInteger($sourceId)})
          MATCH (word)<-[:HAS_WORD]-(item:CorpusItem)
          RETURN DISTINCT word, item
          LIMIT toInteger($limit)
        `;
      }
    } else if (sourceType === 'word' && targetType === 'root') {
      // NEW: Word -> Root expansion
      // Find the root this word belongs to
      query = `
        MATCH (word:Word {word_id: toInteger($sourceId)})
        MATCH (word)<-[:HAS_WORD]-(root:Root)
        RETURN DISTINCT word, root
        LIMIT toInteger($limit)
      `;
    } else if (sourceType === 'word' && targetType === 'form') {
      // NEW: Word -> Form expansion  
      // Find forms this word is connected to
      query = `
        MATCH (word:Word {word_id: toInteger($sourceId)})
        MATCH (word)-[:HAS_FORM]->(form:Form)
        RETURN DISTINCT word, form
        LIMIT toInteger($limit)
      `;
    } else {
      console.error('Invalid source/target combination:', sourceType, targetType);
      return res.status(400).json({ 
        error: `Invalid source/target type combination: ${sourceType} -> ${targetType}`,
        supportedCombinations: ['root->word', 'form->word', 'corpusitem->word', 'word->corpusitem', 'word->root', 'word->form']
      });

// API Authentication middleware
router.use(authenticateAPI);
    }
    
    console.log('=== EXPAND REQUEST DEBUG ===');
    console.log('Source:', sourceType, sourceId);
    console.log('Target:', targetType);
    console.log('Corpus filter:', corpus_id || 'none');
    console.log('Query params:', params);
    console.log('Generated Cypher Query:');
    console.log(query);
    console.log('=== END DEBUG ===');
    
    const result = await session.run(query, params);
    const nodes = [];
    const links = [];
    const nodeMap = new Map();
    const linkIds = new Set(); // Separate set for link deduplication
    
    // Helper function for canonical ID generation: ${type}_${Number(idProp)}
    const getCanonicalId = (type, idValue) => {
      const numericId = idValue?.low !== undefined ? idValue.low : idValue;
      // Handle hierarchical IDs (keep as string) vs integer IDs (convert to number)
      const finalId = typeof numericId === 'string' && numericId.includes(':') 
        ? numericId  // Keep hierarchical IDs as strings
        : Number(numericId);  // Convert integer IDs to numbers
      return `${type}_${finalId}`;
    };
    
    console.log(`Query returned ${result.records.length} records`);
    
    // If no records found, we need to distinguish between:
    // 1. Source node doesn't exist (404)
    // 2. Source node exists but no targets in corpus (200 with empty data)
    if (result.records.length === 0) {
      // Check if the source node exists at all
      let sourceExistsQuery = '';
      if (sourceType === 'root') {
        sourceExistsQuery = `MATCH (n:Root {root_id: toInteger($sourceId)}) RETURN n LIMIT 1`;
      } else if (sourceType === 'form') {
        sourceExistsQuery = `MATCH (n:Form {form_id: toInteger($sourceId)}) RETURN n LIMIT 1`;
      }
      
      if (sourceExistsQuery) {
        const sourceCheck = await session.run(sourceExistsQuery, { sourceId });

// API Authentication middleware
router.use(authenticateAPI);
        if (sourceCheck.records.length === 0) {
          // Source node doesn't exist - return 404
          return res.status(404).json({ 
            error: `No ${sourceType} node found with ID ${sourceId}`,
            sourceType,
            sourceId,
            targetType
          });

// API Authentication middleware
router.use(authenticateAPI);
        } else {
          // Source exists but no targets found (possibly due to corpus filter) - return empty result
          console.log(`${sourceType} ${sourceId} exists but no ${targetType} nodes found${corpus_id ? ` in corpus ${corpus_id}` : ''}`);
          return res.json({ 
            nodes: [], 
            links: [],
            info: {
              message: `${sourceType} exists but no ${targetType} nodes found${corpus_id ? ` in corpus ${corpus_id}` : ''}`,
              sourceExists: true,
              corpusFiltered: !!corpus_id
            }
          });

// API Authentication middleware
router.use(authenticateAPI);
        }
      }
    }
    
    if (sourceType === 'corpusitem' && targetType === 'word') {
      // Handle corpus item expansion using individual records (FIXED: no more cartesian product)
      result.records.forEach(record => {
        const item = record.get('item')?.properties;
        const word = record.get('word')?.properties;
        const root = record.get('root')?.properties;
        const form = record.get('form')?.properties;
        
        // Add the corpus item node
        if (item) {
          const itemId = getCanonicalId('corpusitem', item.item_id);
          if (!nodeMap.has(itemId)) {
            const itemNode = {
              id: itemId,
              label: L2 === 'off' ? item[L1] : `${item[L1]} / ${item[L2]}`,
              ...convertIntegers(item),
              type: 'corpusitem'
            };
            nodes.push(itemNode);
            nodeMap.set(itemId, itemNode);
          }
        }
        
        // Add word node and corpus item -> word link
        if (word) {
          const wordId = getCanonicalId('word', word.word_id);
          if (!nodeMap.has(wordId)) {
            const wordNode = {
              id: wordId,
              label: L2 === 'off' ? word[L1] : `${word[L1]} / ${word[L2]}`,
              ...convertIntegers(word),
              type: 'word'
            };
            nodes.push(wordNode);
            nodeMap.set(wordId, wordNode);
          }
          
          // Add link from corpus item to word (only if both exist in this record)
          if (item) {
            const linkId = `${getCanonicalId('corpusitem', item.item_id)}-${getCanonicalId('word', word.word_id)}`;
            if (!linkIds.has(linkId)) {
              links.push({
                source: getCanonicalId('corpusitem', item.item_id),
                target: wordId,
                type: 'HAS_WORD'
              });
              linkIds.add(linkId); // Track link to prevent duplicates
            }
          }
        }
        
        // Add root node and root -> word link (only for the specific word in this record)
        if (root && word) {
          const rootId = getCanonicalId('root', root.root_id);
          if (!nodeMap.has(rootId)) {
            const rootNode = {
              id: rootId,
              label: L2 === 'off' ? root[L1] : `${root[L1]} / ${root[L2]}`,
              ...convertIntegers(root),
              type: 'root'
            };
            nodes.push(rootNode);
            nodeMap.set(rootId, rootNode);
          }
          
          // Add link from root to word (only for this specific word)
          const linkId = `${getCanonicalId('root', root.root_id)}-${getCanonicalId('word', word.word_id)}`;
          if (!linkIds.has(linkId)) {
            links.push({
              source: rootId,
              target: getCanonicalId('word', word.word_id),
              type: 'HAS_WORD'
            });
            linkIds.add(linkId); // Track link to prevent duplicates
          }
        }
        
        // Add form node and word -> form link (only for the specific word in this record)
        if (form && word) {
          const formId = getCanonicalId('form', form.form_id);
          if (!nodeMap.has(formId)) {
            const formNode = {
              id: formId,
              label: L2 === 'off' ? form[L1] : `${form[L1]} / ${form[L2]}`,
              ...convertIntegers(form),
              type: 'form'
            };
            nodes.push(formNode);
            nodeMap.set(formId, formNode);
          }
          
          // Add link from word to form (only for this specific word)
          const linkId = `${getCanonicalId('word', word.word_id)}-${getCanonicalId('form', form.form_id)}`;
          if (!linkIds.has(linkId)) {
            links.push({
              source: getCanonicalId('word', word.word_id),
              target: formId,
              type: 'HAS_FORM'
            });
            linkIds.add(linkId); // Track link to prevent duplicates
          }
        }
      });
      
    } else if (sourceType === 'word' && targetType === 'corpusitem') {
      // Handle word to corpus item expansion
      result.records.forEach(record => {
        const sourceNode = record.get('word')?.properties;
        const targetNode = record.get('item')?.properties;
        
        // Add source word node if not already present
        if (sourceNode && !nodeMap.has(`word_${sourceNode.word_id}`)) {
          const wordNode = {
            id: `word_${sourceNode.word_id}`,
            label: L2 === 'off' ? sourceNode[L1] : `${sourceNode[L1]} / ${sourceNode[L2]}`,
            ...convertIntegers(sourceNode),
            type: 'word'
          };
          nodes.push(wordNode);
          nodeMap.set(wordNode.id, wordNode);
        }
        
        // Add target corpus item node
        if (targetNode && !nodeMap.has(`corpusitem_${targetNode.item_id}`)) {
          const corpusItemNode = {
            id: `corpusitem_${targetNode.item_id}`,
            label: L2 === 'off' ? targetNode[L1] : `${targetNode[L1]} / ${targetNode[L2]}`,
            ...convertIntegers(targetNode),
            type: 'corpusitem' // corpus items
          };
          nodes.push(corpusItemNode);
          nodeMap.set(corpusItemNode.id, corpusItemNode);
          
          // Create link from word to corpus item
          const linkId = `word_${sourceNode.word_id}-corpusitem_${targetNode.item_id}`;
          if (!linkIds.has(linkId)) {
            links.push({
              source: `word_${sourceNode.word_id}`,
              target: `corpusitem_${targetNode.item_id}`,
              type: 'USED_IN'
            });
            linkIds.add(linkId);
          }

// API Authentication middleware
router.use(authenticateAPI);
        }
      });

// API Authentication middleware
router.use(authenticateAPI);
      
    } else if (sourceType === 'word' && (targetType === 'root' || targetType === 'form')) {
      // Handle word to root/form expansion
      result.records.forEach(record => {
        const sourceNode = record.get('word')?.properties;
        const targetNode = record.get(targetType)?.properties;
        
        // Add source word node if not already present
        if (sourceNode && !nodeMap.has(`word_${sourceNode.word_id}`)) {
          const wordNode = {
            id: `word_${sourceNode.word_id}`,
            label: L2 === 'off' ? sourceNode[L1] : `${sourceNode[L1]} / ${sourceNode[L2]}`,
            ...convertIntegers(sourceNode),
            type: 'word'
          };
          nodes.push(wordNode);
          nodeMap.set(wordNode.id, wordNode);
        }
        
        // Add target node (root or form)
        if (targetNode && !nodeMap.has(`${targetType}_${targetNode[`${targetType}_id`]}`)) {
          const node = {
            id: `${targetType}_${targetNode[`${targetType}_id`]}`,
            label: L2 === 'off' ? targetNode[L1] : `${targetNode[L1]} / ${targetNode[L2]}`,
            ...convertIntegers(targetNode),
            type: targetType
          };
          nodes.push(node);
          nodeMap.set(node.id, node);
          
          // Create appropriate link
          if (targetType === 'root') {
            const linkId = `root_${targetNode.root_id}-word_${sourceNode.word_id}`;
            if (!linkIds.has(linkId)) {
              links.push({
                source: `${targetType}_${targetNode[`${targetType}_id`]}`,
                target: `word_${sourceNode.word_id}`,
                type: 'HAS_WORD'
              });
              linkIds.add(linkId);
            }
          } else if (targetType === 'form') {
            const linkId = `word_${sourceNode.word_id}-form_${targetNode.form_id}`;
            if (!linkIds.has(linkId)) {
              links.push({
                source: `word_${sourceNode.word_id}`,
                target: `${targetType}_${targetNode[`${targetType}_id`]}`,
                type: 'HAS_FORM'
              });
              linkIds.add(linkId);
            }
          }
        }
      });

// API Authentication middleware
router.use(authenticateAPI);
      
    } else {
      // Handle root/form to word expansion
      result.records.forEach(record => {
        const sourceNode = record.get(sourceType)?.properties;
        const targetNode = record.get(targetType)?.properties;
        
        if (sourceNode && !nodeMap.has(`${sourceType}_${sourceNode[`${sourceType}_id`]}`)) {
          const node = {
            id: `${sourceType}_${sourceNode[`${sourceType}_id`]}`,
            label: L2 === 'off' ? sourceNode[L1] : `${sourceNode[L1]} / ${sourceNode[L2]}`,
            ...convertIntegers(sourceNode),
            type: sourceType
          };
          nodes.push(node);
          nodeMap.set(node.id, node);
        }
        
        if (targetNode && !nodeMap.has(`${targetType}_${targetNode[`${targetType}_id`]}`)) {
          const node = {
            id: `${targetType}_${targetNode[`${targetType}_id`]}`,
            label: L2 === 'off' ? targetNode[L1] : `${targetNode[L1]} / ${targetNode[L2]}`,
            ...convertIntegers(targetNode),
            type: targetType
          };
          nodes.push(node);
          nodeMap.set(node.id, node);
          
          // Create appropriate link based on relationship type
          if (sourceType === 'root' && targetType === 'word') {
            const linkId = `root_${sourceNode.root_id}-word_${targetNode.word_id}`;
            if (!linkIds.has(linkId)) {
              links.push({
                source: `${sourceType}_${sourceNode[`${sourceType}_id`]}`,
                target: `${targetType}_${targetNode[`${targetType}_id`]}`,
                type: 'HAS_WORD'
              });
              linkIds.add(linkId);
            }
          } else if (sourceType === 'form' && targetType === 'word') {
            const linkId = `word_${targetNode.word_id}-form_${sourceNode.form_id}`;
            if (!linkIds.has(linkId)) {
              links.push({
                source: `${targetType}_${targetNode[`${targetType}_id`]}`,
                target: `${sourceType}_${sourceNode[`${sourceType}_id`]}`,
                type: 'HAS_FORM'
              });
              linkIds.add(linkId);
            }
          }
        }
        
        // Handle ETYM relationships for root expansions
        if (sourceType === 'root' && targetType === 'word') {
          const etymNode = record.get('etym')?.properties;
          if (etymNode && targetNode) {
            const etymNodeId = `word_${etymNode.word_id}`;
            const sourceWordId = `word_${targetNode.word_id}`;
            
            // Add etym node if not already present
            if (!nodeMap.has(etymNodeId)) {
              const node = {
                id: etymNodeId,
                label: L2 === 'off' ? etymNode[L1] : `${etymNode[L1]} / ${etymNode[L2]}`,
                ...convertIntegers(etymNode),
                type: 'word'
              };
              nodes.push(node);
              nodeMap.set(etymNodeId, node);
            }
            
            // Add ETYM link
            const linkId = `${sourceWordId}-${etymNodeId}`;
            if (!linkIds.has(linkId)) {
              links.push({
                source: sourceWordId,
                target: etymNodeId,
                type: 'ETYM'
              });
              linkIds.add(linkId);
            }
          }
        }
      });

// API Authentication middleware
router.use(authenticateAPI);
    }
    
    console.log(`Returning ${nodes.length} nodes and ${links.length} links`);
    res.json({ nodes, links });

// API Authentication middleware
router.use(authenticateAPI);
  } catch (error) {
    console.error('Error in expand route:', error);
    res.status(500).json({ error: 'Error expanding graph', details: error.message });

// API Authentication middleware
router.use(authenticateAPI);
  } finally {
    await session.close();
  }
});

// API Authentication middleware
router.use(authenticateAPI);

// DEPRECATED: Use /expand/form/:formId/word instead
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

// API Authentication middleware
router.use(authenticateAPI);
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

// API Authentication middleware
router.use(authenticateAPI);


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

// API Authentication middleware
router.use(authenticateAPI);
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

// API Authentication middleware
router.use(authenticateAPI);




// DEPRECATED: Use /expand/root/:rootId/word instead
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

// API Authentication middleware
router.use(authenticateAPI);
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

// API Authentication middleware
router.use(authenticateAPI);


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

// API Authentication middleware
router.use(authenticateAPI);
    const words = result.records.map(record => convertIntegers(record.get('word').properties));

    const formattedWords = words.map(word => {
      return {
        ...word,
        label: script === 'both' ? `${word.arabic} / ${word.english}` : word[script]
      };
    });

// API Authentication middleware
router.use(authenticateAPI);

    res.json(formattedWords);
  } catch (error) {
    console.error('Error fetching words by root:', error);
    res.status(500).send('Error fetching words by root');
  } finally {
    await session.close();
  }
});

// API Authentication middleware
router.use(authenticateAPI);

// DEPRECATED: Use /expand/root/:rootId/word instead
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

// API Authentication middleware
router.use(authenticateAPI);
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

// API Authentication middleware
router.use(authenticateAPI);

// Endpoint to execute Cypher queries
// READ-ONLY Cypher query execution endpoint (PUBLIC API)
router.post('/execute-query', async (req, res) => {
  const { query } = req.body;  
  
  // Validate query is read-only
  const sanitizationResult = sanitizeReadOnlyQuery(query);
  if (!sanitizationResult.isValid) {
    console.log(`Blocked write operation attempt from IP: ${req.ip}, Query: ${query?.substring(0, 100)}...`);
    return res.status(403).json({ 
      error: sanitizationResult.error,
      hint: 'Use /api/query endpoint with admin credentials for write operations'
    });
  }
  
  const session = req.driver.session();  
  try {
    console.log(`Executing read-only query from IP: ${req.ip}`);
    const result = await session.run(query);
    const records = result.records.map(record => {
      const processedRecord = record.toObject();
      return convertIntegers(processedRecord);  // Ensure integers are converted
    });
    
    res.json(records);
  } catch (error) {
    console.error('Error executing read-only query:', error);
    res.status(500).json({ error: 'Error executing query' });
  } finally {
    await session.close();
  }
});

// FULL ACCESS Cypher query execution endpoint (ADMIN API ONLY)
router.post('/query', authenticateAdminAPI, async (req, res) => {
  const { query } = req.body;  
  
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ 
      error: 'Query must be a non-empty string' 
    });
  }
  
  const session = req.driver.session();  
  try {
    console.log(`Executing admin query from IP: ${req.ip}, Query: ${query.substring(0, 100)}...`);
    const result = await session.run(query);
    const records = result.records.map(record => {
      const processedRecord = record.toObject();
      return convertIntegers(processedRecord);  // Ensure integers are converted
    });
    
    // Include additional metadata for admin queries
    const responseData = {
      records,
      summary: {
        totalRecords: records.length,
        queryType: result.summary?.queryType || 'unknown',
        counters: result.summary?.counters || {},
        executionTime: result.summary?.resultAvailableAfter?.toNumber() || 0
      }
    };
    
    res.json(responseData);
  } catch (error) {
    console.error('Error executing admin query:', error);
    res.status(500).json({ 
      error: 'Error executing query',
      details: error.message 
    });
  } finally {
    await session.close();
  }
});

// SPECIALIZED ROOT ANALYSIS WRITE ENDPOINT
// Creates structured Analysis nodes linked to Root nodes
router.post('/write-root-analysis', async (req, res) => {
  // Verify this is using public API key (GPT authentication)
  if (req.authLevel !== 'public') {
    return res.status(403).json({ 
      error: 'This endpoint requires public GPT API key authentication' 
    });
  }

  const { rootId, analysis } = req.body;
  
  // Validate analysis object structure
  if (!analysis || typeof analysis !== 'object') {
    return res.status(400).json({ 
      error: 'analysis object is required',
      usage: 'POST /api/write-root-analysis',
      format: '{ "rootId": 123, "analysis": { "concrete_origin": "...", "fundamental_frame": "..." } }',
      requiredFields: ['rootId', 'analysis'],
      v2Fields: ['concrete_origin', 'path_to_abstraction', 'fundamental_frame', 'basic_stats', 'quranic_refs', 'hadith_refs', 'poetic_refs', 'proverbial_refs'],
      v1Fields: ['lexical_summary', 'semantic_path', 'words_expressions', 'poetic_references']
    });
  }
  
  const { 
    // v2 schema fields
    concrete_origin,
    path_to_abstraction,
    fundamental_frame,
    basic_stats,
    quranic_refs,
    hadith_refs,
    poetic_refs,
    proverbial_refs,
    // Legacy v1 fields (backward compatibility)
    lexical_summary, 
    semantic_path, 
    words_expressions, 
    poetic_references, 
    version 
  } = analysis;

  // Validate required parameters - support both v1 and v2 schemas
  const hasV2Fields = concrete_origin || path_to_abstraction || fundamental_frame || basic_stats || 
                      quranic_refs || hadith_refs || poetic_refs || proverbial_refs;
  const hasV1Fields = lexical_summary || semantic_path || words_expressions || poetic_references;
  
  if (!rootId || (!hasV1Fields && !hasV2Fields)) {
    return res.status(400).json({ 
      error: 'rootId and at least one analysis field are required',
      usage: 'POST /api/write-root-analysis',
      format: '{ "rootId": 123, "analysis": { "concrete_origin": "...", "fundamental_frame": "..." } }',
      requiredFields: ['rootId'],
      v2Fields: ['concrete_origin', 'path_to_abstraction', 'fundamental_frame', 'basic_stats', 'quranic_refs', 'hadith_refs', 'poetic_refs', 'proverbial_refs'],
      v1Fields: ['lexical_summary', 'semantic_path', 'words_expressions', 'poetic_references'],
      systemFields: ['version']
    });
  }

  const session = req.driver.session();
  try {
    // First, verify the node is actually a Root node
    const verifyQuery = `
      MATCH (r:Root) 
      WHERE r.root_id = toInteger($rootId) OR r.id = toInteger($rootId) OR r.root_id = $rootId OR r.id = $rootId
      RETURN r.root_id as root_id, r.arabic as arabic, r.id as id
    `;
    
    const verifyResult = await session.run(verifyQuery, { rootId });
    
    if (verifyResult.records.length === 0) {
      console.log(`Root analysis write failed - root not found: ${rootId}, IP: ${req.ip}`);
      return res.status(404).json({ 
        error: 'Root node not found',
        rootId: rootId 
      });
    }

    const rootRecord = verifyResult.records[0];
    const actualRootId = rootRecord.get('root_id') || rootRecord.get('id');
    const arabicRoot = rootRecord.get('arabic');

    // Generate unique analysis ID and get next version number
    const timestamp = new Date().toISOString();
    const analysisId = `analysis_${actualRootId}_${Date.now()}`;
    
    // Check for existing analyses to determine version number
    const versionQuery = `
      MATCH (r:Root)-[:HAS_ANALYSIS]->(a:Analysis)
      WHERE r.root_id = toInteger($rootId) OR r.id = toInteger($rootId) OR r.root_id = $rootId OR r.id = $rootId
      RETURN MAX(a.version) as max_version
    `;
    
    const versionResult = await session.run(versionQuery, { rootId });
    const maxVersion = versionResult.records[0]?.get('max_version') || 0;
    const nextVersion = version || (convertIntegers(maxVersion) + 1);

    // Hard-coded Cypher for security - create Analysis node with structured sections (v2 + v1 support)
    const writeQuery = `
      MATCH (r:Root) 
      WHERE r.root_id = toInteger($rootId) OR r.id = toInteger($rootId) OR r.root_id = $rootId OR r.id = $rootId
      CREATE (a:Analysis {
        id: $analysisId,
        version: $version,
        created: $timestamp,
        source: "gpt-analysis",
        ip: $ip,
        user_edited: false,
        validation_status: "pending",
        
        // v2 schema fields
        concrete_origin: $concrete_origin,
        path_to_abstraction: $path_to_abstraction,
        fundamental_frame: $fundamental_frame,
        basic_stats: $basic_stats,
        quranic_refs: $quranic_refs,
        hadith_refs: $hadith_refs,
        poetic_refs: $poetic_refs,
        proverbial_refs: $proverbial_refs,
        
        // Legacy v1 fields (backward compatibility)
        lexical_summary: $lexical_summary,
        semantic_path: $semantic_path,
        words_expressions: $words_expressions,
        poetic_references: $poetic_references
      })
      CREATE (r)-[:HAS_ANALYSIS]->(a)
      RETURN r.root_id as root_id, r.arabic as arabic, a.id as analysis_id, a.version as version
    `;

    console.log(`Creating Analysis node v${nextVersion} for root ${actualRootId} (${arabicRoot}) from IP: ${req.ip}`);
    const writeResult = await session.run(writeQuery, { 
      rootId,
      analysisId,
      version: nextVersion,
      timestamp,
      ip: req.ip,
      // v2 schema fields
      concrete_origin: concrete_origin?.trim() || null,
      path_to_abstraction: path_to_abstraction?.trim() || null,
      fundamental_frame: fundamental_frame?.trim() || null,
      basic_stats: basic_stats?.trim() || null,
      quranic_refs: quranic_refs?.trim() || null,
      hadith_refs: hadith_refs?.trim() || null,
      poetic_refs: poetic_refs?.trim() || null,
      proverbial_refs: proverbial_refs?.trim() || null,
      // Legacy v1 fields
      lexical_summary: lexical_summary?.trim() || null,
      semantic_path: semantic_path?.trim() || null,
      words_expressions: words_expressions?.trim() || null,
      poetic_references: poetic_references?.trim() || null
    });

    const updatedRecord = writeResult.records[0];
    const createdAnalysisId = updatedRecord.get('analysis_id');
    const createdVersion = updatedRecord.get('version');

    res.json({
      success: true,
      message: 'Analysis node created successfully',
      rootId: convertIntegers(actualRootId),
      arabic: arabicRoot,
      analysisId: createdAnalysisId,
      version: convertIntegers(createdVersion),
      timestamp: timestamp,
      sections: {
        lexical_summary: !!lexical_summary,
        semantic_path: !!semantic_path,
        fundamental_frame: !!fundamental_frame,
        words_expressions: !!words_expressions,
        poetic_references: !!poetic_references,
        basic_stats: !!basic_stats
      }
    });

    console.log(`Successfully created Analysis node ${createdAnalysisId} v${createdVersion} for root ${actualRootId}`);

  } catch (error) {
    console.error('Error creating root analysis:', error);
    res.status(500).json({ 
      error: 'Error creating analysis node',
      details: error.message 
    });
  } finally {
    await session.close();
  }
});

// API Authentication middleware
router.use(authenticateAPI);


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

// API Authentication middleware
router.use(authenticateAPI);

    if (result.records.length > 0) {
      const root = result.records[0].get('root').properties;
      res.json({
        ...root,
        label: L2 === 'off' ? root[L1] : `${root[L1]} / ${root[L2]}`,
        root_id: root.root_id
      });

// API Authentication middleware
router.use(authenticateAPI);
    } else {
      res.status(404).json({ error: 'Root not found' });

// API Authentication middleware
router.use(authenticateAPI);
    }
  } catch (error) {
    console.error('Error fetching root by word:', error);
    res.status(500).json({ error: 'Error fetching root by word' });

// API Authentication middleware
router.use(authenticateAPI);
  } finally {
    await session.close();
  }
});

// API Authentication middleware
router.use(authenticateAPI);



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

// API Authentication middleware
router.use(authenticateAPI);

    if (result.records.length > 0) {
      const forms = result.records.map(record => record.get('form').properties);
      res.json(forms.map(form => ({
        ...form,
        label: L2 === 'off' ? form[L1] : `${form[L1]} / ${form[L2]}`,
        form_id: form.form_id
      })));
    } else {
      res.status(404).json({ error: 'Forms not found' });

// API Authentication middleware
router.use(authenticateAPI);
    }
  } catch (error) {
    console.error('Error fetching forms by word:', error);
    res.status(500).json({ error: 'Error fetching forms by word' });

// API Authentication middleware
router.use(authenticateAPI);
  } finally {
    await session.close();
  }
});

// API Authentication middleware
router.use(authenticateAPI);


router.get('/laneentry/:wordId', async (req, res) => {
  const { wordId } = req.params;
  const session = req.driver.session();
  
  try {
    const query = `
      MATCH (word:Word {word_id: toInteger($wordId)})
      RETURN word.definitions AS definitions
    `;
    const result = await session.run(query, { wordId: parseInt(wordId) });

// API Authentication middleware
router.use(authenticateAPI);

    if (result.records.length > 0) {
      const definitions = result.records[0].get('definitions');
      res.json(definitions);
    } else {
      res.status(404).json({ error: 'Lane entry not found' });

// API Authentication middleware
router.use(authenticateAPI);
    }
  } catch (error) {
    console.error('Error fetching Lane entry by word:', error);
    res.status(500).json({ error: 'Error fetching Lane entry by word' });

// API Authentication middleware
router.use(authenticateAPI);
  } finally {
    await session.close();
  }
});

// API Authentication middleware
router.use(authenticateAPI);

router.get('/hanswehrentry/:wordId', async (req, res) => {
  const { wordId } = req.params;
  const session = req.driver.session();
  
  try {
    const query = `
      MATCH (word:Word {word_id: toInteger($wordId)})
      RETURN word.hanswehr_entry AS hanswehrEntry
    `;
    const result = await session.run(query, { wordId: parseInt(wordId) });

// API Authentication middleware
router.use(authenticateAPI);

    if (result.records.length > 0) {
      const hanswehrEntry = result.records[0].get('hanswehrEntry');
      res.json(hanswehrEntry);
    } else {
      res.status(404).json({ error: 'Hans Wehr entry not found' });

// API Authentication middleware
router.use(authenticateAPI);
    }
  } catch (error) {
    console.error('Error fetching Hans Wehr entry by word:', error);
    res.status(500).json({ error: 'Error fetching Hans Wehr entry by word' });

// API Authentication middleware
router.use(authenticateAPI);
  } finally {
    await session.close();
  }
});

// API Authentication middleware
router.use(authenticateAPI);

router.get('/corpusitementry/:corpusId/:itemId', async (req, res) => {
  const { corpusId, itemId } = req.params;
  const session = req.driver.session();
  
  try {
    // Determine if this is a hierarchical ID (contains ':')
    const isHierarchicalId = itemId.includes(':');
    const isCorpus2 = parseInt(corpusId) === 2;
    
    const query = isHierarchicalId && isCorpus2 ? `
      MATCH (item:CorpusItem {corpus_id: toInteger($corpusId), item_id: $itemId})
      RETURN item.entry AS entry
    ` : `
      MATCH (item:CorpusItem {corpus_id: toInteger($corpusId), item_id: toInteger($itemId)})
      RETURN item.entry AS entry
    `;
    
    const result = await session.run(query, { 
      corpusId: parseInt(corpusId), 
      itemId: isHierarchicalId && isCorpus2 ? itemId : parseInt(itemId)
    });

// API Authentication middleware
router.use(authenticateAPI);

    if (result.records.length > 0) {
      const entry = result.records[0].get('entry');
      res.json(entry);
    } else {
      res.status(404).json({ error: 'Corpus item entry not found' });

// API Authentication middleware
router.use(authenticateAPI);
    }
  } catch (error) {
    console.error('Error fetching corpus item entry:', error);
    res.status(500).json({ error: 'Error fetching corpus item entry' });

// API Authentication middleware
router.use(authenticateAPI);
  } finally {
    await session.close();
  }
});

// API Authentication middleware
router.use(authenticateAPI);

router.get('/rootentry/:rootId', async (req, res) => {
  const { rootId } = req.params;
  const session = req.driver.session();
  
  try {
    const query = `
      MATCH (root:Root {root_id: toInteger($rootId)})
      RETURN root.entry AS entry
    `;
    const result = await session.run(query, { rootId: parseInt(rootId) });

// API Authentication middleware
router.use(authenticateAPI);

    if (result.records.length > 0) {
      const entry = result.records[0].get('entry');
      res.json(entry);
    } else {
      res.status(404).json({ error: 'Root entry not found' });

// API Authentication middleware
router.use(authenticateAPI);
    }
  } catch (error) {
    console.error('Error fetching root entry:', error);
    res.status(500).json({ error: 'Error fetching root entry' });

// API Authentication middleware
router.use(authenticateAPI);
  } finally {
    await session.close();
  }
});

// API Authentication middleware
router.use(authenticateAPI);

// Generic analysis data endpoint for any node type
router.get('/analysis/:nodeType/:nodeId', async (req, res) => {
  const { nodeType, nodeId } = req.params;
  const session = req.driver.session();
  
  try {
    let query;
    let params;

    // Build query based on node type
    switch (nodeType.toLowerCase()) {
      case 'root':
        query = `
          MATCH (n:Root {root_id: toInteger($nodeId)})
          OPTIONAL MATCH (n)-[:HAS_ANALYSIS]->(analysis:Analysis)
          RETURN collect(DISTINCT {
            // Core Fields (v2 schema)
            concrete_origin: analysis.concrete_origin,
            path_to_abstraction: analysis.path_to_abstraction,
            fundamental_frame: analysis.fundamental_frame,
            basic_stats: analysis.basic_stats,
            
            // Reference Fields (v2 schema)
            quranic_refs: analysis.quranic_refs,
            hadith_refs: analysis.hadith_refs,
            poetic_refs: analysis.poetic_refs,
            proverbial_refs: analysis.proverbial_refs,
            
            // Legacy v1 fields (backward compatibility)
            lexical_summary: analysis.lexical_summary,
            semantic_path: analysis.semantic_path,
            words_expressions: analysis.words_expressions,
            poetic_references: analysis.poetic_references,
            
            // System fields
            version: analysis.version,
            created_at: analysis.created_at
          }) AS analyses
        `;
        params = { nodeId: parseInt(nodeId) };
        break;
        
      // Future: Add other node types here
      case 'word':
      case 'form':
      default:
        // For now, return empty analyses for other node types
        res.json({ analyses: [] });
        return;
    }

    const result = await session.run(query, params);

    if (result.records.length > 0) {
      const analyses = result.records[0].get('analyses').filter(a => 
        // Check for v2 schema fields
        a.concrete_origin || a.path_to_abstraction || 
        // Or legacy v1 fields for backward compatibility
        a.lexical_summary || a.semantic_path
      );
      res.json({ analyses: analyses });
    } else {
      res.json({ analyses: [] });
    }
  } catch (error) {
    console.error('Error fetching analysis data:', error);
    res.status(500).json({ error: 'Error fetching analysis data' });
  } finally {
    await session.close();
  }
});


// LEGACY ROUTE WARNING: This endpoint is incompatible with Corpus 2 hierarchical IDs (surah:ayah:word)
// Uses hardcoded radical position mapping and does not support the new RadicalPosition system
// Consider migrating to /search-roots, /search-combinate, or /search-extended endpoints
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
        const convertedProps = convertIntegers(props);
        return {
          ...convertedProps,
          id: `root_${Number(convertedProps.root_id?.low !== undefined ? convertedProps.root_id.low : convertedProps.root_id)}`,
          type: 'root',
          label: L2 === 'off' ? convertedProps[L1] : `${convertedProps[L1]} / ${convertedProps[L2]}`,
          root_id: convertedProps.root_id,
        };
      });

// API Authentication middleware
router.use(authenticateAPI);
      res.json({ roots, total });

// API Authentication middleware
router.use(authenticateAPI);
    } else {
      res.status(404).json({ error: 'No roots found' });

// API Authentication middleware
router.use(authenticateAPI);
    }
  } catch (error) {
    console.error('Error fetching root by letters:', error);
    res.status(500).json({ error: 'Error fetching root by letters' });

// API Authentication middleware
router.use(authenticateAPI);
  } finally {
    await session.close();
  }
});

// API Authentication middleware
router.use(authenticateAPI);

// LEGACY ROUTE WARNING: This endpoint is incompatible with Corpus 2 hierarchical IDs (surah:ayah:word)
// Uses hardcoded biradical logic and does not support the new RadicalPosition system
// Consider migrating to /search-roots with None wildcard for biradical searches
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
        const convertedRoot = convertIntegers(root);
        return {
          ...convertedRoot,
          id: `root_${Number(convertedRoot.root_id?.low !== undefined ? convertedRoot.root_id.low : convertedRoot.root_id)}`,
          type: 'root',
          label: L2 === 'off' ? convertedRoot[L1] : `${convertedRoot[L1]} / ${convertedRoot[L2]}`,
          root_id: convertedRoot.root_id,
        };
      });

// API Authentication middleware
router.use(authenticateAPI);
      res.json({ roots, total: roots.length });

// API Authentication middleware
router.use(authenticateAPI);
    } else {
      res.status(404).json({ error: 'No geminate roots found' });

// API Authentication middleware
router.use(authenticateAPI);
    }
  } catch (error) {
    console.error('Error fetching geminate roots:', error);
    res.status(500).json({ error: 'Error fetching geminate roots' });

// API Authentication middleware
router.use(authenticateAPI);
  } finally {
    await session.close();
  }
});

// API Authentication middleware
router.use(authenticateAPI);


// LEGACY ROUTE WARNING: This endpoint is incompatible with Corpus 2 hierarchical IDs (surah:ayah:word)
// Uses hardcoded triradical logic and does not support the new RadicalPosition system
// Consider migrating to /search-roots or /search-combinate endpoints
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
        const convertedRoot = convertIntegers(root);
        return {
          ...convertedRoot,
          id: `root_${Number(convertedRoot.root_id?.low !== undefined ? convertedRoot.root_id.low : convertedRoot.root_id)}`,
          type: 'root',
          label: L2 === 'off' ? convertedRoot[L1] : `${convertedRoot[L1]} / ${convertedRoot[L2]}`,
          root_id: convertedRoot.root_id,
        };
      });

// API Authentication middleware
router.use(authenticateAPI);
      res.json({ roots, total: roots.length });

// API Authentication middleware
router.use(authenticateAPI);
    } else {
      res.status(404).json({ error: 'No triliteral roots found' });

// API Authentication middleware
router.use(authenticateAPI);
    }
  } catch (error) {
    console.error('Error fetching triliteral roots:', error);
    res.status(500).json({ error: 'Error fetching triliteral roots' });

// API Authentication middleware
router.use(authenticateAPI);
  } finally {
    await session.close();
  }
});

// API Authentication middleware
router.use(authenticateAPI);


// LEGACY ROUTE WARNING: This endpoint is incompatible with Corpus 2 hierarchical IDs (surah:ayah:word)
// Uses hardcoded extended root logic and does not support the new RadicalPosition system
// Consider migrating to /search-extended endpoint
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
        const convertedRoot = convertIntegers(root);
        return {
          ...convertedRoot,
          id: `root_${Number(convertedRoot.root_id?.low !== undefined ? convertedRoot.root_id.low : convertedRoot.root_id)}`,
          type: 'root',
          label: L2 === 'off' ? convertedRoot[L1] : `${convertedRoot[L1]} / ${convertedRoot[L2]}`,
          root_id: convertedRoot.root_id,
        };
      });

// API Authentication middleware
router.use(authenticateAPI);
      res.json({ roots, total: roots.length });

// API Authentication middleware
router.use(authenticateAPI);
    } else {
      res.status(404).json({ error: 'No extended roots found' });

// API Authentication middleware
router.use(authenticateAPI);
    }
  } catch (error) {
    console.error('Error fetching extended roots:', error);
    res.status(500).json({ error: 'Error fetching extended roots' });

// API Authentication middleware
router.use(authenticateAPI);
  } finally {
    await session.close();
  }
});

// API Authentication middleware
router.use(authenticateAPI);

// ===== NEW RADICALPOSITION-BASED ROOT SEARCH ENDPOINT =====
router.get('/radical-search', async (req, res) => {
  try {
    const { radicals, L1, L2, searchType } = req.query;
    
    // Parse radicals array from JSON string
    let radicalsArray = [];
    try {
      radicalsArray = JSON.parse(radicals || '[]');
    } catch (e) {
      return res.status(400).json({ error: 'Invalid radicals format. Expected JSON array.' });

// API Authentication middleware
router.use(authenticateAPI);
    }
    
    // Validate input
    if (!Array.isArray(radicalsArray) || radicalsArray.length === 0) {
      return res.status(400).json({ error: 'At least one radical is required' });

// API Authentication middleware
router.use(authenticateAPI);
    }
    
    if (!L1) {
      return res.status(400).json({ error: 'L1 language parameter is required' });

// API Authentication middleware
router.use(authenticateAPI);
    }
    
    // Extract radicals and positions for Cypher query
    const radicalStrings = radicalsArray.map(r => r.radical);
    const positions = radicalsArray.map(r => r.position);
    
    // Build Cypher query based on searchType
    let cypherQuery = '';
    let queryParams = {
      radicals: radicalStrings,
      positions: positions
    };
    
    switch (searchType) {
      case 'biradical_only':
        cypherQuery = `
          MATCH (root:Root)-[:HAS_RADICAL]->(rp:RadicalPosition)
          WHERE rp.radical IN $radicals AND rp.position IN $positions
          WITH root, collect(rp) as matched_radicals
          WHERE size(matched_radicals) = size($radicals) 
            AND size([(root)-[:HAS_RADICAL]->(:RadicalPosition) | 1]) = 2
          RETURN root
          ORDER BY root.${L1}
          LIMIT 25
        `;
        break;
        
      case 'exact_match':
        cypherQuery = `
          MATCH (root:Root)-[:HAS_RADICAL]->(rp:RadicalPosition)
          WHERE rp.radical IN $radicals AND rp.position IN $positions
          WITH root, collect(rp) as matched_radicals
          WHERE size(matched_radicals) = size($radicals) 
            AND size([(root)-[:HAS_RADICAL]->(:RadicalPosition) | 1]) = size($radicals)
          RETURN root
          ORDER BY root.${L1}
          LIMIT 25
        `;
        break;
        
      case 'biradical_and_matching_triradical':
        cypherQuery = `
          MATCH (root:Root)-[:HAS_RADICAL]->(rp:RadicalPosition)
          WHERE rp.radical IN $radicals AND rp.position IN $positions
          WITH root, collect(rp) as matched_radicals, 
               size([(root)-[:HAS_RADICAL]->(:RadicalPosition) | 1]) as root_length
          WHERE size(matched_radicals) >= 2 AND (
            (root_length = 2 AND size(matched_radicals) = 2) OR
            (root_length = 3 AND size(matched_radicals) = 3)
          )
          RETURN root
          ORDER BY root_length, root.${L1}
          LIMIT 25
        `;
        break;
        
      case 'extended_and_longer':
        cypherQuery = `
          MATCH (root:Root)-[:HAS_RADICAL]->(rp:RadicalPosition)
          WHERE rp.radical IN $radicals AND rp.position IN $positions
          WITH root, collect(rp) as matched_radicals
          WHERE size(matched_radicals) = size($radicals) 
            AND size([(root)-[:HAS_RADICAL]->(:RadicalPosition) | 1]) >= 4
          RETURN root
          ORDER BY root.${L1}
          LIMIT 25
        `;
        break;
        
      case 'flexible':
      default:
        cypherQuery = `
          MATCH (root:Root)-[:HAS_RADICAL]->(rp:RadicalPosition)
          WHERE rp.radical IN $radicals AND rp.position IN $positions
          WITH root, collect(rp) as matched_radicals
          WHERE size(matched_radicals) = size($radicals)
          RETURN root
          ORDER BY root.${L1}
          LIMIT 25
        `;
        break;
    }
    
    console.log('=== RADICAL SEARCH DEBUG ===');
    console.log('SearchType:', searchType);
    console.log('Radicals:', radicalsArray);
    console.log('Generated Cypher Query:');
    console.log(cypherQuery);
    console.log('Query params:', queryParams);
    console.log('=== END DEBUG ===');
    
    // Execute query
    const session = req.driver.session();
    try {
      const result = await session.run(cypherQuery, queryParams);
      
      // Format results
      const roots = result.records.map(record => {
        const root = record.get('root').properties;
        
        // Convert Neo4j integers to regular numbers
        const convertedRoot = convertIntegers(root);
        
        // Add label formatting
        return {
          ...convertedRoot,
          label: L2 === 'off' ? convertedRoot[L1] : `${convertedRoot[L1]} / ${convertedRoot[L2]}`
        };
      });

// API Authentication middleware
router.use(authenticateAPI);
      
      // Return results with metadata
      res.json({
        roots,
        total: roots.length,
        searchType,
        radicals: radicalsArray,
        message: `Found ${roots.length} roots using RadicalPosition search`
      });

// API Authentication middleware
router.use(authenticateAPI);
      
    } finally {
      await session.close();
    }
    
  } catch (error) {
    console.error('Error in radical-search endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      searchType: req.query.searchType
    });

// API Authentication middleware
router.use(authenticateAPI);
  }
});

// API Authentication middleware
router.use(authenticateAPI);





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

// API Authentication middleware
router.use(authenticateAPI);
});

// API Authentication middleware
router.use(authenticateAPI);

// ===== NEW UPDATED SEARCH ENDPOINTS WITH DISTINCT BEHAVIORS =====

// 1. Fetch Root(s) - Position-specific search with wildcards and "None" support  
router.get('/search-roots', async (req, res) => {
  try {
    const { r1, r2, r3, L1, L2, limit = 25 } = req.query;
    
    if (!L1) {
      return res.status(400).json({ error: 'L1 language parameter is required' });

// API Authentication middleware
router.use(authenticateAPI);
    }

    const session = req.driver.session();
    let cypherQuery = '';
    let queryParams = {};

    // Create mutable copy of r3 for potential modification
    let actualR3 = r3;
    
    // Handle "None" case for R3 (biradical/geminate search)
    if (r3 === 'None') {
      // If r2 is specified, treat as geminate search (r3 = r2)
      // This saves the user from manually setting r3 to the same value as r2
      if (r2 && r2 !== '*') {
        // Convert None + specified r2 to geminate search
        actualR3 = r2; // Set r3 to same value as r2
        // Fall through to standard search logic below
      } else {
        // Return all biradical roots (wildcard search when r2 is also wildcard)
        cypherQuery = `
          MATCH (root:Root)
          WHERE size([(root)-[:HAS_RADICAL]->(:RadicalPosition) | 1]) = 2
        `;
        
        // Add r1 filter if specified
        if (r1 && r1 !== '*') {
          cypherQuery += `
            AND EXISTS { MATCH (root)-[:HAS_RADICAL]->(rp1:RadicalPosition) WHERE rp1.radical = $r1 AND rp1.position = 1 }
          `;
          queryParams.r1 = r1;
        }
        
        cypherQuery += `
          RETURN root
          ORDER BY root.${L1}
          LIMIT ${parseInt(limit)}
        `;
      }
    }
    
    // Standard position-specific search (handles both regular and converted geminate searches)
    if (actualR3 !== 'None') {
      // Standard position-specific search (2-3 radicals)
      const conditions = [];
      if (r1 && r1 !== '*') {
        conditions.push('(rp.radical = $r1 AND rp.position = 1)');
        queryParams.r1 = r1;
      }
      if (r2 && r2 !== '*') {
        conditions.push('(rp.radical = $r2 AND rp.position = 2)');
        queryParams.r2 = r2;
      }
      if (actualR3 && actualR3 !== '*') {
        conditions.push('(rp.radical = $r3 AND rp.position = 3)');
        queryParams.r3 = actualR3;
      }
      
      // If no radicals specified (all wildcards), return all roots
      if (conditions.length === 0) {
        cypherQuery = `
          MATCH (root:Root)
          WHERE size([(root)-[:HAS_RADICAL]->(:RadicalPosition) | 1]) <= 3
          RETURN root
          ORDER BY root.${L1}
          LIMIT ${parseInt(limit)}
        `;
      } else {
        cypherQuery = `
          MATCH (root:Root)-[:HAS_RADICAL]->(rp:RadicalPosition)
          WHERE (${conditions.join(' OR ')})
          WITH root, collect(rp) as matched_radicals
          WHERE size([(root)-[:HAS_RADICAL]->(:RadicalPosition) | 1]) <= 3
            AND size(matched_radicals) = ${conditions.length}
          RETURN root
          ORDER BY root.${L1}
          LIMIT ${parseInt(limit)}
        `;
      }
    }

    const result = await session.run(cypherQuery, queryParams);
    
    const roots = result.records.map(record => {
      const root = record.get('root').properties;
      const convertedRoot = convertIntegers(root);
      return {
        ...convertedRoot,
        id: `root_${Number(convertedRoot.root_id?.low !== undefined ? convertedRoot.root_id.low : convertedRoot.root_id)}`,
        type: 'root',
        label: L2 === 'off' ? convertedRoot[L1] : `${convertedRoot[L1]} / ${convertedRoot[L2]}`
      };
    });

// API Authentication middleware
router.use(authenticateAPI);

    await session.close();
    res.json({
      roots,
      total: roots.length,
      searchType: 'position-specific',
      message: `Found ${roots.length} roots with position-specific search`
    });

// API Authentication middleware
router.use(authenticateAPI);

  } catch (error) {
    console.error('Error in search-roots endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });

// API Authentication middleware
router.use(authenticateAPI);
  }
});

// API Authentication middleware
router.use(authenticateAPI);

// 2. Combinate - Return all valid permutations of specified radicals
router.get('/search-combinate', async (req, res) => {
  try {
    const { r1, r2, r3, L1, L2, limit = 25 } = req.query;
    
    if (!L1) {
      return res.status(400).json({ error: 'L1 language parameter is required' });

// API Authentication middleware
router.use(authenticateAPI);
    }

    // Collect non-wildcard radicals
    const inputRadicals = [r1, r2, r3].filter(r => r && r !== '*');
    
    if (inputRadicals.length === 0) {
      return res.status(400).json({ error: 'At least one radical is required for combinate search' });

// API Authentication middleware
router.use(authenticateAPI);
    }

    const session = req.driver.session();
    let cypherQuery = '';
    let queryParams = { radicals: inputRadicals };

    // Handle "None" case - only biradical permutations
    if (r3 === 'None') {
      cypherQuery = `
        MATCH (root:Root)-[:HAS_RADICAL]->(rp:RadicalPosition)
        WHERE rp.radical IN $radicals
        WITH root, collect(rp.radical) as root_radicals
        WHERE size([(root)-[:HAS_RADICAL]->(:RadicalPosition) | 1]) = 2
          AND all(radical in $radicals WHERE radical in root_radicals)
          AND size(root_radicals) = 2
        RETURN root
        ORDER BY root.${L1}
        LIMIT ${parseInt(limit)}
      `;
    } else {
      // Standard combinate - any permutations (2-3 radicals)
      cypherQuery = `
        MATCH (root:Root)-[:HAS_RADICAL]->(rp:RadicalPosition)
        WHERE rp.radical IN $radicals
        WITH root, collect(rp.radical) as root_radicals
        WHERE size([(root)-[:HAS_RADICAL]->(:RadicalPosition) | 1]) <= 3
          AND all(radical in $radicals WHERE radical in root_radicals)
          AND size([r in root_radicals WHERE r IN $radicals]) = size($radicals)
        RETURN root
        ORDER BY root.${L1}
        LIMIT ${parseInt(limit)}
      `;
    }

    const result = await session.run(cypherQuery, queryParams);
    
    const roots = result.records.map(record => {
      const root = record.get('root').properties;
      const convertedRoot = convertIntegers(root);
      return {
        ...convertedRoot,
        id: `root_${Number(convertedRoot.root_id?.low !== undefined ? convertedRoot.root_id.low : convertedRoot.root_id)}`,
        type: 'root',
        label: L2 === 'off' ? convertedRoot[L1] : `${convertedRoot[L1]} / ${convertedRoot[L2]}`
      };
    });

// API Authentication middleware
router.use(authenticateAPI);

    await session.close();
    res.json({
      roots,
      total: roots.length,
      searchType: 'combinate',
      message: `Found ${roots.length} roots with combinate search`
    });

// API Authentication middleware
router.use(authenticateAPI);

  } catch (error) {
    console.error('Error in search-combinate endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });

// API Authentication middleware
router.use(authenticateAPI);
  }
});

// API Authentication middleware
router.use(authenticateAPI);

// 3. Fetch Extended - Only roots with 4+ radicals
router.get('/search-extended', async (req, res) => {
  try {
    const { r1, r2, r3, L1, L2, limit = 25 } = req.query;
    
    if (!L1) {
      return res.status(400).json({ error: 'L1 language parameter is required' });

// API Authentication middleware
router.use(authenticateAPI);
    }

    const session = req.driver.session();
    let cypherQuery = `
      MATCH (root:Root)-[:HAS_RADICAL]->(rp:RadicalPosition)
      WHERE size([(root)-[:HAS_RADICAL]->(:RadicalPosition) | 1]) >= 4
    `;
    
    let queryParams = {};
    const conditions = [];
    
    // Optional filtering by provided radicals
    if (r1 && r1 !== '*') {
      conditions.push('(rp.radical = $r1)');
      queryParams.r1 = r1;
    }
    if (r2 && r2 !== '*') {
      conditions.push('(rp.radical = $r2)');
      queryParams.r2 = r2;
    }
    if (r3 && r3 !== '*') {
      conditions.push('(rp.radical = $r3)');  
      queryParams.r3 = r3;
    }
    
    if (conditions.length > 0) {
      cypherQuery += ' AND (' + conditions.join(' OR ') + ')';
      cypherQuery += `
        WITH root, collect(rp.radical) as matched_radicals
        WHERE size(matched_radicals) > 0
      `;
    } else {
      cypherQuery += ' WITH root';
    }

    cypherQuery += `
      RETURN DISTINCT root
      ORDER BY root.${L1}
      LIMIT ${parseInt(limit)}
    `;

    const result = await session.run(cypherQuery, queryParams);
    
    const roots = result.records.map(record => {
      const root = record.get('root').properties;
      const convertedRoot = convertIntegers(root);
      return {
        ...convertedRoot,
        id: `root_${Number(convertedRoot.root_id?.low !== undefined ? convertedRoot.root_id.low : convertedRoot.root_id)}`,
        type: 'root',
        label: L2 === 'off' ? convertedRoot[L1] : `${convertedRoot[L1]} / ${convertedRoot[L2]}`
      };
    });

// API Authentication middleware
router.use(authenticateAPI);

    await session.close();
    res.json({
      roots,
      total: roots.length,
      searchType: 'extended',
      message: `Found ${roots.length} extended roots (4+ radicals)`
    });

// API Authentication middleware
router.use(authenticateAPI);

  } catch (error) {
    console.error('Error in search-extended endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });

// API Authentication middleware
router.use(authenticateAPI);
  }
});

// API Authentication middleware
router.use(authenticateAPI);

// Node Inspector - Get comprehensive node information for corpus items
router.get('/inspect/corpusitem/:corpusId/:itemId', async (req, res) => {
  try {
    const { corpusId, itemId } = req.params;
    const session = req.driver.session();
    
    // Determine if this is a hierarchical ID (contains ':')
    const isHierarchicalId = itemId.includes(':');
    const isCorpus2 = parseInt(corpusId) === 2;
    
    // Query to get corpus item properties and relationship counts
    const query = isHierarchicalId && isCorpus2 ? `
      MATCH (n:CorpusItem {corpus_id: toInteger($corpusId), item_id: $itemId})
      
      // Get all node properties
      WITH n, keys(n) as propertyKeys
      
      // Get relationship counts by type and direction
      OPTIONAL MATCH (n)-[r]->(target)
      WITH n, propertyKeys, type(r) as outRelType, count(target) as outCount
      WITH n, propertyKeys, collect({type: outRelType, direction: 'outgoing', count: outCount}) as outgoingRels
      
      OPTIONAL MATCH (source)-[r]->(n)
      WITH n, propertyKeys, outgoingRels, type(r) as inRelType, count(source) as inCount
      WITH n, propertyKeys, outgoingRels, collect({type: inRelType, direction: 'incoming', count: inCount}) as incomingRels
      
      // Get connected node type counts
      OPTIONAL MATCH (n)-[:HAS_WORD]->(w:Word)
      WITH n, propertyKeys, outgoingRels, incomingRels, count(w) as wordCount
      
      OPTIONAL MATCH (n)<-[:BELONGS_TO]-(c:Corpus)
      WITH n, propertyKeys, outgoingRels, incomingRels, wordCount, count(c) as corpusCount
      
      RETURN n, 
             propertyKeys,
             outgoingRels + incomingRels as relationships,
             {
               words: wordCount,
               corpora: corpusCount
             } as connectedCounts
    ` : `
      MATCH (n:CorpusItem {corpus_id: toInteger($corpusId), item_id: toInteger($itemId)})
      
      // Get all node properties
      WITH n, keys(n) as propertyKeys
      
      // Get relationship counts by type and direction
      OPTIONAL MATCH (n)-[r]->(target)
      WITH n, propertyKeys, type(r) as outRelType, count(target) as outCount
      WITH n, propertyKeys, collect({type: outRelType, direction: 'outgoing', count: outCount}) as outgoingRels
      
      OPTIONAL MATCH (source)-[r]->(n)
      WITH n, propertyKeys, outgoingRels, type(r) as inRelType, count(source) as inCount
      WITH n, propertyKeys, outgoingRels, collect({type: inRelType, direction: 'incoming', count: inCount}) as incomingRels
      
      // Get connected node type counts
      OPTIONAL MATCH (n)-[:HAS_WORD]->(w:Word)
      WITH n, propertyKeys, outgoingRels, incomingRels, count(w) as wordCount
      
      OPTIONAL MATCH (n)<-[:BELONGS_TO]-(c:Corpus)
      WITH n, propertyKeys, outgoingRels, incomingRels, wordCount, count(c) as corpusCount
      
      RETURN n, 
             propertyKeys,
             outgoingRels + incomingRels as relationships,
             {
               words: wordCount,
               corpora: corpusCount
             } as connectedCounts
    `;
    
    const result = await session.run(query, { 
      corpusId: parseInt(corpusId), 
      itemId: isHierarchicalId && isCorpus2 ? itemId : parseInt(itemId)
    });
    
    if (result.records.length === 0) {
      return res.status(404).json({ 
        error: `No CorpusItem found with corpus_id: ${corpusId}, item_id: ${itemId}` 
      });
    }
    
    const record = result.records[0];
    const node = record.get('n').properties;
    const propertyKeys = record.get('propertyKeys');
    const relationships = record.get('relationships');
    const connectedCounts = record.get('connectedCounts');
    
    // Convert Neo4j integers and organize data
    const nodeData = convertIntegers(node);
    const relationshipData = convertIntegers(relationships.filter(r => r.type !== null));
    const connectedData = convertIntegers(connectedCounts);
    
    // Organize properties in the format expected by NodeInspector
    const organizedProperties = {};
    propertyKeys.forEach(key => {
      const value = nodeData[key];
      organizedProperties[key] = {
        value: value,
        type: typeof value,
        isEmpty: value === null || value === undefined || value === ''
      };
    });
    
    await session.close();
    
    res.json({
      nodeType: 'CorpusItem',
      nodeId: `${corpusId}_${itemId}`,
      properties: organizedProperties,
      relationships: relationshipData,
      connectedNodeCounts: connectedData,
      summary: {
        totalProperties: propertyKeys.length,
        totalRelationships: relationshipData.reduce((sum, r) => sum + r.count, 0),
        totalConnectedNodes: Object.values(connectedData).reduce((sum, count) => sum + count, 0)
      }
    });
    
  } catch (error) {
    console.error('Error in corpus item inspect endpoint:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Node Inspector - Get comprehensive node information (for other node types)
router.get('/inspect/:nodeType/:nodeId', async (req, res) => {
  try {
    const { nodeType, nodeId } = req.params;
    const session = req.driver.session();
    
    // Validate node type
    const validNodeTypes = ['Root', 'Word', 'Form', 'CorpusItem'];
    // Map input node types to proper case
    const nodeTypeMap = {
      'root': 'Root',
      'word': 'Word', 
      'form': 'Form',
      'corpusitem': 'CorpusItem'
    };
    const capitalizedNodeType = nodeTypeMap[nodeType.toLowerCase()] || nodeType;
    
    if (!validNodeTypes.includes(capitalizedNodeType)) {
      return res.status(400).json({ 
        error: `Invalid node type: ${nodeType}. Valid types: ${validNodeTypes.join(', ')}` 
      });
    }
    
    // Determine the ID property name based on node type
    let idProperty;
    switch (capitalizedNodeType) {
      case 'Root': idProperty = 'root_id'; break;
      case 'Word': idProperty = 'word_id'; break;
      case 'Form': idProperty = 'form_id'; break;
      case 'CorpusItem': idProperty = 'item_id'; break;
    }
    
    // Query to get node properties and relationship counts
    const query = `
      MATCH (n:${capitalizedNodeType} {${idProperty}: toInteger($nodeId)})
      
      // Get all node properties
      WITH n, keys(n) as propertyKeys
      
      // Get relationship counts by type and direction
      OPTIONAL MATCH (n)-[r]->(target)
      WITH n, propertyKeys, type(r) as outRelType, count(target) as outCount
      WITH n, propertyKeys, collect({type: outRelType, direction: 'outgoing', count: outCount}) as outgoingRels
      
      OPTIONAL MATCH (source)-[r]->(n)
      WITH n, propertyKeys, outgoingRels, type(r) as inRelType, count(source) as inCount
      WITH n, propertyKeys, outgoingRels, collect({type: inRelType, direction: 'incoming', count: inCount}) as incomingRels
      
      // Get connected node type counts
      OPTIONAL MATCH (n)-[:HAS_WORD]->(w:Word)
      WITH n, propertyKeys, outgoingRels, incomingRels, count(w) as wordCount
      
      OPTIONAL MATCH (n)-[:HAS_FORM]->(f:Form)
      WITH n, propertyKeys, outgoingRels, incomingRels, wordCount, count(f) as formCount
      
      OPTIONAL MATCH (n)<-[:HAS_WORD]-(r:Root)
      WITH n, propertyKeys, outgoingRels, incomingRels, wordCount, formCount, count(r) as rootCount
      
      OPTIONAL MATCH (n)-[:HAS_RADICAL]->(rp:RadicalPosition)
      WITH n, propertyKeys, outgoingRels, incomingRels, wordCount, formCount, rootCount, count(rp) as radicalCount
      
      OPTIONAL MATCH (n)-[:BELONGS_TO]->(c:Corpus)
      WITH n, propertyKeys, outgoingRels, incomingRels, wordCount, formCount, rootCount, radicalCount, count(c) as corpusCount
      
      RETURN n, 
             propertyKeys,
             outgoingRels + incomingRels as relationships,
             {
               words: wordCount,
               forms: formCount, 
               roots: rootCount,
               radicals: radicalCount,
               corpora: corpusCount
             } as connectedCounts
    `;
    
    const result = await session.run(query, { nodeId: parseInt(nodeId) });
    
    if (result.records.length === 0) {
      return res.status(404).json({ 
        error: `No ${capitalizedNodeType} found with ID: ${nodeId}` 
      });
    }
    
    const record = result.records[0];
    const node = record.get('n').properties;
    const propertyKeys = record.get('propertyKeys');
    const relationships = record.get('relationships');
    const connectedCounts = record.get('connectedCounts');
    
    // Convert Neo4j integers and organize data
    const nodeData = convertIntegers(node);
    const relationshipData = convertIntegers(relationships.filter(r => r.type !== null));
    const connectedData = convertIntegers(connectedCounts);
    
    // Organize properties by type
    const organizedProperties = {};
    propertyKeys.forEach(key => {
      const value = nodeData[key];
      organizedProperties[key] = {
        value: value,
        type: typeof value,
        isEmpty: value === null || value === undefined || value === ''
      };
    });
    
    await session.close();
    
    res.json({
      nodeType: capitalizedNodeType,
      nodeId: parseInt(nodeId),
      properties: organizedProperties,
      relationships: relationshipData,
      connectedNodeCounts: connectedData,
      summary: {
        totalProperties: propertyKeys.length,
        totalRelationships: relationshipData.reduce((sum, r) => sum + r.count, 0),
        totalConnectedNodes: Object.values(connectedData).reduce((sum, count) => sum + count, 0)
      }
    });
    
  } catch (error) {
    console.error('Error in node inspection:', error);
    res.status(500).json({ 
      error: 'Error inspecting node',
      message: error.message 
    });
  }
});

// Navigation endpoints for NodeInspector
router.get('/navigate/word/:wordId/:direction', async (req, res) => {
  const session = req.driver.session();
  const { wordId, direction } = req.params;
  
  try {
    const currentId = parseInt(wordId);
    
    // Find the next/previous word that actually exists
    const query = direction === 'next' 
      ? `
        MATCH (w:Word) 
        WHERE toInteger(w.word_id) > $currentId
        RETURN w
        ORDER BY toInteger(w.word_id) ASC
        LIMIT 1
      `
      : `
        MATCH (w:Word) 
        WHERE toInteger(w.word_id) < $currentId
        RETURN w
        ORDER BY toInteger(w.word_id) DESC
        LIMIT 1
      `;
    
    const result = await session.run(query, { currentId });
    
    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Node not found' });
    }
    
    // If word exists, get full inspection data
    const wordNode = result.records[0].get('w');
    const nodeId = wordNode.identity.toNumber();
    
    // Reuse the inspection logic
    const inspectQuery = `
      MATCH (n) WHERE id(n) = $nodeId
      OPTIONAL MATCH (n)-[r]-(connected)
      RETURN n, 
             type(r) as rel_type, 
             startNode(r) = n as is_outgoing,
             count(connected) as rel_count,
             labels(connected)[0] as connected_type
    `;
    
    const inspectResult = await session.run(inspectQuery, { nodeId });
    
    // Process inspection data (same logic as /inspect endpoint)
    const nodeData = inspectResult.records[0].get('n');
    const nodeProperties = nodeData.properties;
    const nodeLabels = nodeData.labels;
    
    const propertyKeys = Object.keys(nodeProperties);
    const properties = {};
    
    propertyKeys.forEach(key => {
      const value = nodeProperties[key];
      const isEmpty = value === null || value === undefined || value === '';
      properties[key] = {
        value: convertIntegers(value),
        type: isEmpty ? 'empty' : typeof value,
        isEmpty
      };
    });
    
    // Process relationships
    const relationshipMap = new Map();
    const connectedNodeTypes = {};
    
    inspectResult.records.forEach(record => {
      const relType = record.get('rel_type');
      const isOutgoing = record.get('is_outgoing');
      const relCount = record.get('rel_count');
      const connectedType = record.get('connected_type');
      
      if (relType) {
        const direction = isOutgoing ? 'outgoing' : 'incoming';
        const key = `${relType}_${direction}`;
        
        if (!relationshipMap.has(key)) {
          relationshipMap.set(key, { type: relType, direction, count: 0 });
        }
        relationshipMap.get(key).count += relCount.toNumber();
        
        if (connectedType) {
          connectedNodeTypes[connectedType.toLowerCase()] = (connectedNodeTypes[connectedType.toLowerCase()] || 0) + relCount.toNumber();
        }
      }
    });
    
    const relationships = Array.from(relationshipMap.values());
    
    res.json({
      nodeData: {
        nodeType: nodeLabels[0],
        nodeId: convertIntegers(nodeProperties.word_id || nodeId),
        properties,
        relationships,
        connectedNodeCounts: connectedNodeTypes,
        summary: {
          totalProperties: propertyKeys.length,
          totalRelationships: relationships.reduce((sum, r) => sum + r.count, 0),
          totalConnectedNodes: Object.values(connectedNodeTypes).reduce((sum, count) => sum + count, 0)
        }
      }
    });
    
  } catch (error) {
    console.error('Error navigating word:', error);
    res.status(500).json({ 
      error: 'Error navigating to adjacent word',
      message: error.message 
    });
  } finally {
    await session.close();
  }
});

router.get('/navigate/corpusitem/:corpusId/:itemId/:direction', async (req, res) => {
  const session = req.driver.session();
  const { corpusId, itemId, direction } = req.params;
  
  try {
    const currentCorpusId = parseInt(corpusId);
    const isHierarchicalId = itemId.includes(':');
    const isCorpus2 = currentCorpusId === 2;
    
    let query, queryParams;
    
    if (isHierarchicalId && isCorpus2) {
      // Hierarchical ID logic for Corpus 2
      const [currentSurah, currentAyah, currentWord] = itemId.split(':').map(Number);
      
      query = direction === 'next' 
        ? `
          MATCH (c:CorpusItem) 
          WHERE toInteger(c.corpus_id) = $corpusId
          WITH c, split(c.item_id, ':') as parts
          WITH c, toInteger(parts[0]) as surah, toInteger(parts[1]) as ayah, toInteger(parts[2]) as word
          WHERE (
            surah > $currentSurah OR
            (surah = $currentSurah AND ayah > $currentAyah) OR  
            (surah = $currentSurah AND ayah = $currentAyah AND word > $currentWord)
          )
          RETURN c
          ORDER BY surah, ayah, word
          LIMIT 1
        `
        : `
          MATCH (c:CorpusItem) 
          WHERE toInteger(c.corpus_id) = $corpusId
          WITH c, split(c.item_id, ':') as parts
          WITH c, toInteger(parts[0]) as surah, toInteger(parts[1]) as ayah, toInteger(parts[2]) as word
          WHERE (
            surah < $currentSurah OR
            (surah = $currentSurah AND ayah < $currentAyah) OR
            (surah = $currentSurah AND ayah = $currentAyah AND word < $currentWord)
          )
          RETURN c
          ORDER BY surah DESC, ayah DESC, word DESC
          LIMIT 1
        `;
      
      queryParams = { 
        corpusId: currentCorpusId, 
        currentSurah,
        currentAyah,
        currentWord
      };
      
    } else {
      // Integer ID logic for Corpus 1&3
      const currentItemId = parseInt(itemId);
      
      query = direction === 'next' 
        ? `
          MATCH (c:CorpusItem) 
          WHERE toInteger(c.corpus_id) = $corpusId AND toInteger(c.item_id) > $currentItemId
          RETURN c
          ORDER BY toInteger(c.item_id)
          LIMIT 1
        `
        : `
          MATCH (c:CorpusItem) 
          WHERE toInteger(c.corpus_id) = $corpusId AND toInteger(c.item_id) < $currentItemId
          RETURN c
          ORDER BY toInteger(c.item_id) DESC
          LIMIT 1
        `;
      
      queryParams = { 
        corpusId: currentCorpusId, 
        currentItemId
      };
    }
    
    const result = await session.run(query, queryParams);
    
    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Node not found' });
    }
    
    // If corpus item exists, get full inspection data
    const corpusItemNode = result.records[0].get('c');
    const nodeId = corpusItemNode.identity.toNumber();
    
    // Reuse the inspection logic
    const inspectQuery = `
      MATCH (n) WHERE id(n) = $nodeId
      OPTIONAL MATCH (n)-[r]-(connected)
      RETURN n, 
             type(r) as rel_type, 
             startNode(r) = n as is_outgoing,
             count(connected) as rel_count,
             labels(connected)[0] as connected_type
    `;
    
    const inspectResult = await session.run(inspectQuery, { nodeId });
    
    // Process inspection data (same logic as /inspect endpoint)
    const nodeData = inspectResult.records[0].get('n');
    const nodeProperties = nodeData.properties;
    const nodeLabels = nodeData.labels;
    
    const propertyKeys = Object.keys(nodeProperties);
    const properties = {};
    
    propertyKeys.forEach(key => {
      const value = nodeProperties[key];
      const isEmpty = value === null || value === undefined || value === '';
      properties[key] = {
        value: convertIntegers(value),
        type: isEmpty ? 'empty' : typeof value,
        isEmpty
      };
    });
    
    // Process relationships
    const relationshipMap = new Map();
    const connectedNodeTypes = {};
    
    inspectResult.records.forEach(record => {
      const relType = record.get('rel_type');
      const isOutgoing = record.get('is_outgoing');
      const relCount = record.get('rel_count');
      const connectedType = record.get('connected_type');
      
      if (relType) {
        const direction = isOutgoing ? 'outgoing' : 'incoming';
        const key = `${relType}_${direction}`;
        
        if (!relationshipMap.has(key)) {
          relationshipMap.set(key, { type: relType, direction, count: 0 });
        }
        relationshipMap.get(key).count += relCount.toNumber();
        
        if (connectedType) {
          connectedNodeTypes[connectedType.toLowerCase()] = (connectedNodeTypes[connectedType.toLowerCase()] || 0) + relCount.toNumber();
        }
      }
    });
    
    const relationships = Array.from(relationshipMap.values());
    
    res.json({
      nodeData: {
        nodeType: nodeLabels[0],
        nodeId: convertIntegers(nodeProperties.item_id || nodeId),
        properties,
        relationships,
        connectedNodeCounts: connectedNodeTypes,
        summary: {
          totalProperties: propertyKeys.length,
          totalRelationships: relationships.reduce((sum, r) => sum + r.count, 0),
          totalConnectedNodes: Object.values(connectedNodeTypes).reduce((sum, count) => sum + count, 0)
        }
      }
    });
    
  } catch (error) {
    console.error('Error navigating corpus item:', error);
    res.status(500).json({ 
      error: 'Error navigating to adjacent corpus item',
      message: error.message 
    });
  } finally {
    await session.close();
  }
});

// Update validation fields for a node
router.post('/update-validation/:nodeType/:nodeId', async (req, res) => {
  const session = req.driver.session();
  const { nodeType, nodeId } = req.params;
  const { updates } = req.body; // { field_name: { value: "new_value", approve: true }, ... }
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  
  try {
    // Validate node type
    const validNodeTypes = ['word', 'root', 'form', 'corpusitem'];
    if (!validNodeTypes.includes(nodeType.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid node type' });
    }
    
    // Get the node first to verify it exists - use only the property-based lookup
    const nodeQuery = `MATCH (n:${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}) WHERE n.${nodeType}_id = $nodeId RETURN n`;
    const nodeResult = await session.run(nodeQuery, { nodeId: parseInt(nodeId) });
    
    if (nodeResult.records.length === 0) {
      return res.status(404).json({ error: 'Node not found' });
    }
    
    const node = nodeResult.records[0].get('n');
    const actualNodeId = node.identity.toNumber();
    
    // Process each field update sequentially to avoid transaction conflicts
    for (const [fieldName, updateData] of Object.entries(updates)) {
      if (updateData.value !== undefined) {
        // Update field value
        const updateValueQuery = `
          MATCH (n) WHERE id(n) = $nodeId
          SET n.${fieldName} = $value
          RETURN n
        `;
        await session.run(updateValueQuery, { 
          nodeId: actualNodeId, 
          value: updateData.value 
        });
      }
      
      if (updateData.approve === true) {
        // Check for recent approval from same IP (basic spam protection)
        const recentApprovalQuery = `
          MATCH (n)-[:APPROVED_BY]->(approval:Approval)
          WHERE id(n) = $nodeId 
          AND approval.field = $fieldName 
          AND approval.ip = $ip 
          AND approval.timestamp > datetime() - duration('PT24H')
          RETURN approval LIMIT 1
        `;
        
        const recentResult = await session.run(recentApprovalQuery, {
          nodeId: actualNodeId,
          fieldName: fieldName,
          ip: clientIP
        });
        
        if (recentResult.records.length > 0) {
          continue; // Skip this approval - IP already approved in last 24h
        }
        
        // Create approval record and increment counter
        const approvalQuery = `
          MATCH (n) WHERE id(n) = $nodeId
          CREATE (n)-[:APPROVED_BY]->(approval:Approval {
            field: $fieldName,
            ip: $ip,
            timestamp: datetime(),
            value: $value
          })
          SET n.${fieldName}_validated_count = COALESCE(n.${fieldName}_validated_count, 0) + 1
          RETURN n
        `;
        
        await session.run(approvalQuery, {
          nodeId: actualNodeId,
          fieldName: fieldName,
          ip: clientIP,
          value: updateData.value || ''
        });
      }
    }
    
    // Return updated node data
    const finalQuery = `MATCH (n) WHERE id(n) = $nodeId RETURN n`;
    const finalResult = await session.run(finalQuery, { nodeId: actualNodeId });
    const updatedNode = finalResult.records[0].get('n').properties;
    
    res.json({
      success: true,
      message: `Updated ${Object.keys(updates).length} fields`,
      nodeData: convertIntegers(updatedNode)
    });
    
  } catch (error) {
    console.error('Error updating validation fields:', error);
    res.status(500).json({ 
      error: 'Error updating validation fields',
      message: error.message 
    });
  } finally {
    await session.close();
  }
});

// Latest Analysis for News section
router.get('/latest-analysis', async (req, res) => {
  const session = req.driver.session();
  try {
    const result = await session.run(`
      MATCH (r:Root)-[:HAS_ANALYSIS]->(a:Analysis)
      WITH r, a, 
           a.created as timestamp,
           COALESCE(a.version, 1) as version
      ORDER BY timestamp DESC, version DESC
      LIMIT 1
      RETURN {
        root: {
          root_id: r.root_id,
          arabic: r.arabic,
          english: r.english,
          definitions: r.definitions,
          hanswehr_entry: r.hanswehr_entry,
          meaning: r.meaning
        },
        analysis: {
          concrete_origin: a.concrete_origin,
          path_to_abstraction: a.path_to_abstraction,
          fundamental_frame: a.fundamental_frame,
          basic_stats: a.basic_stats,
          quranic_refs: a.quranic_refs,
          hadith_refs: a.hadith_refs,
          poetic_refs: a.poetic_refs,
          proverbial_refs: a.proverbial_refs,
          lexical_summary: a.lexical_summary,
          semantic_path: a.semantic_path,
          words_expressions: a.words_expressions,
          poetic_references: a.poetic_references,
          version: version,
          timestamp: timestamp
        }
      } as latest_analysis
    `);

    if (result.records.length === 0) {
      return res.json({ 
        latest_analysis: null,
        message: "No analysis found" 
      });
    }

    const latestAnalysis = convertIntegers(result.records[0].get('latest_analysis'));
    res.json({ latest_analysis: latestAnalysis });
    
  } catch (error) {
    console.error('Error fetching latest analysis:', error);
    res.status(500).json({ 
      error: 'Error fetching latest analysis',
      message: error.message 
    });
  } finally {
    await session.close();
  }
});

// All Previous Analyses for News section
router.get('/all-analyses', async (req, res) => {
  const session = req.driver.session();
  try {
    const result = await session.run(`
      MATCH (r:Root)-[:HAS_ANALYSIS]->(a:Analysis)
      WITH r, a, 
           a.created as timestamp,
           COALESCE(a.version, 1) as version
      ORDER BY timestamp DESC, version DESC
      RETURN {
        root: {
          root_id: r.root_id,
          arabic: r.arabic,
          english: r.english,
          definitions: r.definitions,
          hanswehr_entry: r.hanswehr_entry,
          meaning: r.meaning
        },
        analysis: {
          concrete_origin: a.concrete_origin,
          path_to_abstraction: a.path_to_abstraction,
          fundamental_frame: a.fundamental_frame,
          basic_stats: a.basic_stats,
          quranic_refs: a.quranic_refs,
          hadith_refs: a.hadith_refs,
          poetic_refs: a.poetic_refs,
          proverbial_refs: a.proverbial_refs,
          lexical_summary: a.lexical_summary,
          semantic_path: a.semantic_path,
          words_expressions: a.words_expressions,
          poetic_references: a.poetic_references,
          version: version,
          timestamp: timestamp
        }
      } as analysis_entry
    `);

    if (result.records.length === 0) {
      return res.json({ 
        analyses: [],
        message: "No analyses found" 
      });
    }

    const analyses = result.records.map(record => 
      convertIntegers(record.get('analysis_entry'))
    );
    
    res.json({ analyses });
    
  } catch (error) {
    console.error('Error fetching all analyses:', error);
    res.status(500).json({ 
      error: 'Error fetching all analyses',
      message: error.message 
    });
  } finally {
    await session.close();
  }
});

// Root Headers for Previous Analyses (lightweight - no full analysis data)
router.get('/analysis-headers', async (req, res) => {
  const session = req.driver.session();
  try {
    const result = await session.run(`
      MATCH (r:Root)-[:HAS_ANALYSIS]->(a:Analysis)
      WITH r, a, 
           a.created as timestamp,
           COALESCE(a.version, 1) as version
      ORDER BY r.root_id, timestamp DESC, version DESC
      WITH r, 
           collect(a)[0] as latest_analysis,
           collect(timestamp)[0] as latest_timestamp,
           collect(version)[0] as latest_version
      ORDER BY latest_timestamp DESC
      RETURN {
        root: {
          root_id: r.root_id,
          arabic: r.arabic,
          english: r.english
        },
        analysis_meta: {
          version: latest_version,
          timestamp: latest_timestamp
        }
      } as analysis_header
    `);

    if (result.records.length === 0) {
      return res.json({ 
        headers: [],
        message: "No analyses found" 
      });
    }

    const headers = result.records.map(record => 
      convertIntegers(record.get('analysis_header'))
    );
    
    res.json({ headers });
    
  } catch (error) {
    console.error('Error fetching analysis headers:', error);
    res.status(500).json({ 
      error: 'Error fetching analysis headers',
      message: error.message 
    });
  } finally {
    await session.close();
  }
});

// Single Analysis by Root ID (for on-demand loading)
router.get('/analysis-by-root/:rootId', async (req, res) => {
  const session = req.driver.session();
  try {
    const { rootId } = req.params;
    
    const result = await session.run(`
      MATCH (r:Root {root_id: toInteger($rootId)})-[:HAS_ANALYSIS]->(a:Analysis)
      WITH r, a, 
           a.created as timestamp,
           COALESCE(a.version, 1) as version
      ORDER BY timestamp DESC, version DESC
      LIMIT 1
      RETURN {
        root: {
          root_id: r.root_id,
          arabic: r.arabic,
          english: r.english,
          definitions: r.definitions,
          hanswehr_entry: r.hanswehr_entry,
          meaning: r.meaning
        },
        analysis: {
          concrete_origin: a.concrete_origin,
          path_to_abstraction: a.path_to_abstraction,
          fundamental_frame: a.fundamental_frame,
          basic_stats: a.basic_stats,
          quranic_refs: a.quranic_refs,
          hadith_refs: a.hadith_refs,
          poetic_refs: a.poetic_refs,
          proverbial_refs: a.proverbial_refs,
          lexical_summary: a.lexical_summary,
          semantic_path: a.semantic_path,
          words_expressions: a.words_expressions,
          poetic_references: a.poetic_references,
          version: version,
          timestamp: timestamp
        }
      } as analysis_data
    `, { rootId: parseInt(rootId) });

    if (result.records.length === 0) {
      return res.status(404).json({ 
        error: 'Analysis not found',
        message: `No analysis found for root ID ${rootId}` 
      });
    }

    const analysisData = convertIntegers(result.records[0].get('analysis_data'));
    res.json({ analysis: analysisData });
    
  } catch (error) {
    console.error('Error fetching analysis by root:', error);
    res.status(500).json({ 
      error: 'Error fetching analysis by root',
      message: error.message 
    });
  } finally {
    await session.close();
  }
});

module.exports = router;
