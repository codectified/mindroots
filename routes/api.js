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
    const records = result.records[0];
    if (records) {
      const item = records.get('item').properties;
      const words = records.get('words').map(record => convertIntegers(record.properties));
      const roots = records.get('roots').map(record => convertIntegers(record.properties));
      const forms = records.get('forms').map(record => convertIntegers(record.properties));
      res.json({ item, words, roots, forms });
    } else {
      res.json({});
    }
  } catch (error) {
    console.error('Error fetching words and roots by corpus item:', error);
    res.status(500).send('Error fetching words and roots by corpus item');
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


// Consolidated expansion route
router.get('/expand/:sourceType/:sourceId/:targetType', async (req, res) => {
  const { sourceType, sourceId, targetType } = req.params;
  const { L1, L2, corpus_id, limit = 25 } = req.query;
  
  console.log(`Expand route called: ${sourceType}/${sourceId}/${targetType}`, { L1, L2, corpus_id, limit, limitType: typeof limit });
  
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
          RETURN root, word, etym
          LIMIT toInteger($limit)
        `;
      } else {
        query = `
          MATCH (root:Root {root_id: toInteger($sourceId)})-[:HAS_WORD]->(word:Word)
          OPTIONAL MATCH (word)-[:ETYM]->(etym:Word)
          RETURN root, word, etym
          LIMIT toInteger($limit)
        `;
      }
    } else if (sourceType === 'form' && targetType === 'word') {
      if (corpus_id) {
        query = `
          MATCH (form:Form {form_id: toInteger($sourceId)})<-[:HAS_FORM]-(word:Word)
          MATCH (corpus:Corpus {corpus_id: toInteger($corpus_id)})<-[:BELONGS_TO]-(item:CorpusItem)-[:HAS_WORD]->(word)
          RETURN form, word
          LIMIT toInteger($limit)
        `;
      } else {
        query = `
          MATCH (form:Form {form_id: toInteger($sourceId)})<-[:HAS_FORM]-(word:Word)
          RETURN form, word
          LIMIT toInteger($limit)
        `;
      }
    } else if (sourceType === 'corpusitem' && targetType === 'word') {
      // CONSOLIDATED: This replaces the legacy /words_by_corpus_item/:itemId route
      // Returns corpus item + connected words, forms, and roots with proper relationships
      if (!corpus_id) {
        return res.status(400).json({ error: 'corpus_id is required for corpusitem expansion' });
      }
      query = `
        MATCH (item:CorpusItem {item_id: toInteger($sourceId), corpus_id: toInteger($corpus_id)})
        OPTIONAL MATCH (item)-[:HAS_WORD]->(word:Word)
        OPTIONAL MATCH (word)-[:HAS_FORM]->(form:Form)
        OPTIONAL MATCH (word)<-[:HAS_WORD]-(root:Root)
        RETURN item, collect(DISTINCT word) as words, collect(DISTINCT root) as roots, collect(DISTINCT form) as forms
      `;
    } else if (sourceType === 'word' && targetType === 'corpusitem') {
      // NEW: Word -> CorpusItem expansion
      // Find all corpus items that contain this word
      if (corpus_id) {
        query = `
          MATCH (word:Word {word_id: toInteger($sourceId)})
          MATCH (word)<-[:HAS_WORD]-(item:CorpusItem)-[:BELONGS_TO]->(corpus:Corpus {corpus_id: toInteger($corpus_id)})
          RETURN word, item
          LIMIT toInteger($limit)
        `;
      } else {
        query = `
          MATCH (word:Word {word_id: toInteger($sourceId)})
          MATCH (word)<-[:HAS_WORD]-(item:CorpusItem)
          RETURN word, item
          LIMIT toInteger($limit)
        `;
      }
    } else if (sourceType === 'word' && targetType === 'root') {
      // NEW: Word -> Root expansion
      // Find the root this word belongs to
      query = `
        MATCH (word:Word {word_id: toInteger($sourceId)})
        MATCH (word)<-[:HAS_WORD]-(root:Root)
        RETURN word, root
        LIMIT toInteger($limit)
      `;
    } else if (sourceType === 'word' && targetType === 'form') {
      // NEW: Word -> Form expansion  
      // Find forms this word is connected to
      query = `
        MATCH (word:Word {word_id: toInteger($sourceId)})
        MATCH (word)-[:HAS_FORM]->(form:Form)
        RETURN word, form
        LIMIT toInteger($limit)
      `;
    } else {
      console.error('Invalid source/target combination:', sourceType, targetType);
      return res.status(400).json({ 
        error: `Invalid source/target type combination: ${sourceType} -> ${targetType}`,
        supportedCombinations: ['root->word', 'form->word', 'corpusitem->word', 'word->corpusitem', 'word->root', 'word->form']
      });
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
        if (sourceCheck.records.length === 0) {
          // Source node doesn't exist - return 404
          return res.status(404).json({ 
            error: `No ${sourceType} node found with ID ${sourceId}`,
            sourceType,
            sourceId,
            targetType
          });
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
        }
      }
    }
    
    if (sourceType === 'corpusitem' && targetType === 'word') {
      // Handle corpus item expansion using collect pattern
      const record = result.records[0];
      const item = record.get('item')?.properties;
      const words = record.get('words') || [];
      const roots = record.get('roots') || [];
      const forms = record.get('forms') || [];
      
      // Add the corpus item node
      if (item) {
        const itemNode = {
          id: `corpusitem_${item.item_id}`,
          label: L2 === 'off' ? item[L1] : `${item[L1]} / ${item[L2]}`,
          ...convertIntegers(item),
          type: 'name'
        };
        nodes.push(itemNode);
        nodeMap.set(itemNode.id, itemNode);
      }
      
      // Add word nodes and links
      words.forEach(wordObj => {
        if (wordObj && wordObj.properties) {
          const word = wordObj.properties;
          const wordNode = {
            id: `word_${word.word_id}`,
            label: L2 === 'off' ? word[L1] : `${word[L1]} / ${word[L2]}`,
            ...convertIntegers(word),
            type: 'word'
          };
          
          if (!nodeMap.has(wordNode.id)) {
            nodes.push(wordNode);
            nodeMap.set(wordNode.id, wordNode);
            
            // Add link from corpus item to word
            if (item) {
              links.push({
                source: `corpusitem_${item.item_id}`,
                target: `word_${word.word_id}`,
                type: 'HAS_WORD'
              });
            }
          }
        }
      });
      
      // Add root nodes and links
      roots.forEach(rootObj => {
        if (rootObj && rootObj.properties) {
          const root = rootObj.properties;
          const rootNode = {
            id: `root_${root.root_id}`,
            label: L2 === 'off' ? root[L1] : `${root[L1]} / ${root[L2]}`,
            ...convertIntegers(root),
            type: 'root'
          };
          
          if (!nodeMap.has(rootNode.id)) {
            nodes.push(rootNode);
            nodeMap.set(rootNode.id, rootNode);
          }
        }
      });
      
      // Add form nodes and links
      forms.forEach(formObj => {
        if (formObj && formObj.properties) {
          const form = formObj.properties;
          const formNode = {
            id: `form_${form.form_id}`,
            label: L2 === 'off' ? form[L1] : `${form[L1]} / ${form[L2]}`,
            ...convertIntegers(form),
            type: 'form'
          };
          
          if (!nodeMap.has(formNode.id)) {
            nodes.push(formNode);
            nodeMap.set(formNode.id, formNode);
          }
        }
      });
      
      // Add links between words and their roots/forms
      words.forEach(wordObj => {
        if (wordObj && wordObj.properties) {
          const word = wordObj.properties;
          const wordId = `word_${word.word_id}`;
          
          // Find matching roots and forms for this word
          roots.forEach(rootObj => {
            if (rootObj && rootObj.properties) {
              const root = rootObj.properties;
              links.push({
                source: `root_${root.root_id}`,
                target: wordId,
                type: 'HAS_WORD'
              });
            }
          });
          
          forms.forEach(formObj => {
            if (formObj && formObj.properties) {
              const form = formObj.properties;
              links.push({
                source: wordId,
                target: `form_${form.form_id}`,
                type: 'HAS_FORM'
              });
            }
          });
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
            type: 'name' // corpus items use 'name' type
          };
          nodes.push(corpusItemNode);
          nodeMap.set(corpusItemNode.id, corpusItemNode);
          
          // Create link from word to corpus item
          links.push({
            source: `word_${sourceNode.word_id}`,
            target: `corpusitem_${targetNode.item_id}`,
            type: 'USED_IN'
          });
        }
      });
      
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
            links.push({
              source: `${targetType}_${targetNode[`${targetType}_id`]}`,
              target: `word_${sourceNode.word_id}`,
              type: 'HAS_WORD'
            });
          } else if (targetType === 'form') {
            links.push({
              source: `word_${sourceNode.word_id}`,
              target: `${targetType}_${targetNode[`${targetType}_id`]}`,
              type: 'HAS_FORM'
            });
          }
        }
      });
      
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
            links.push({
              source: `${sourceType}_${sourceNode[`${sourceType}_id`]}`,
              target: `${targetType}_${targetNode[`${targetType}_id`]}`,
              type: 'HAS_WORD'
            });
          } else if (sourceType === 'form' && targetType === 'word') {
            links.push({
              source: `${targetType}_${targetNode[`${targetType}_id`]}`,
              target: `${sourceType}_${sourceNode[`${sourceType}_id`]}`,
              type: 'HAS_FORM'
            });
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
            const linkId = `${sourceWordId}->${etymNodeId}`;
            if (!nodeMap.has(linkId)) {
              links.push({
                source: sourceWordId,
                target: etymNodeId,
                type: 'ETYM'
              });
              nodeMap.set(linkId, true); // Track link to avoid duplicates
            }
          }
        }
      });
    }
    
    console.log(`Returning ${nodes.length} nodes and ${links.length} links`);
    res.json({ nodes, links });
  } catch (error) {
    console.error('Error in expand route:', error);
    res.status(500).json({ error: 'Error expanding graph', details: error.message });
  } finally {
    await session.close();
  }
});

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

router.get('/corpusitementry/:corpusId/:itemId', async (req, res) => {
  const { corpusId, itemId } = req.params;
  const session = req.driver.session();
  
  try {
    const query = `
      MATCH (item:CorpusItem {corpus_id: toInteger($corpusId), item_id: toInteger($itemId)})
      RETURN item.entry AS entry
    `;
    const result = await session.run(query, { 
      corpusId: parseInt(corpusId), 
      itemId: parseInt(itemId) 
    });

    if (result.records.length > 0) {
      const entry = result.records[0].get('entry');
      res.json(entry);
    } else {
      res.status(404).json({ error: 'Corpus item entry not found' });
    }
  } catch (error) {
    console.error('Error fetching corpus item entry:', error);
    res.status(500).json({ error: 'Error fetching corpus item entry' });
  } finally {
    await session.close();
  }
});

router.get('/rootentry/:rootId', async (req, res) => {
  const { rootId } = req.params;
  const session = req.driver.session();
  
  try {
    const query = `
      MATCH (root:Root {root_id: toInteger($rootId)})
      RETURN root.entry AS entry
    `;
    const result = await session.run(query, { rootId: parseInt(rootId) });

    if (result.records.length > 0) {
      const entry = result.records[0].get('entry');
      res.json(entry);
    } else {
      res.status(404).json({ error: 'Root entry not found' });
    }
  } catch (error) {
    console.error('Error fetching root entry:', error);
    res.status(500).json({ error: 'Error fetching root entry' });
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
    }
    
    // Validate input
    if (!Array.isArray(radicalsArray) || radicalsArray.length === 0) {
      return res.status(400).json({ error: 'At least one radical is required' });
    }
    
    if (!L1) {
      return res.status(400).json({ error: 'L1 language parameter is required' });
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
      
      // Return results with metadata
      res.json({
        roots,
        total: roots.length,
        searchType,
        radicals: radicalsArray,
        message: `Found ${roots.length} roots using RadicalPosition search`
      });
      
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

// ===== NEW UPDATED SEARCH ENDPOINTS WITH DISTINCT BEHAVIORS =====

// 1. Fetch Root(s) - Position-specific search with wildcards and "None" support  
router.get('/search-roots', async (req, res) => {
  try {
    const { r1, r2, r3, L1, L2 } = req.query;
    
    if (!L1) {
      return res.status(400).json({ error: 'L1 language parameter is required' });
    }

    const session = req.driver.session();
    let cypherQuery = '';
    let queryParams = {};

    // Handle "None" case for R3 (biradical only)
    if (r3 === 'None') {
      cypherQuery = `
        MATCH (root:Root)-[:HAS_RADICAL]->(rp:RadicalPosition)
        WHERE 1=1
      `;
      
      const conditions = [];
      if (r1 && r1 !== '*') {
        conditions.push('(rp.radical = $r1 AND rp.position = 1)');
        queryParams.r1 = r1;
      }
      if (r2 && r2 !== '*') {
        conditions.push('(rp.radical = $r2 AND rp.position = 2)');
        queryParams.r2 = r2;
      }
      
      if (conditions.length > 0) {
        cypherQuery += ' AND (' + conditions.join(' OR ') + ')';
      }
      
      cypherQuery += `
        WITH root, collect(rp) as matched_radicals
        WHERE size([(root)-[:HAS_RADICAL]->(:RadicalPosition) | 1]) = 2
      `;
      
      // Additional filtering for matched positions
      if (r1 && r1 !== '*' && r2 && r2 !== '*') {
        cypherQuery += ' AND size(matched_radicals) = 2';
      } else if (r1 && r1 !== '*') {
        cypherQuery += ' AND any(rp in matched_radicals WHERE rp.position = 1)';
      } else if (r2 && r2 !== '*') {
        cypherQuery += ' AND any(rp in matched_radicals WHERE rp.position = 2)';
      }
      
    } else {
      // Standard position-specific search (2-3 radicals)
      cypherQuery = `
        MATCH (root:Root)-[:HAS_RADICAL]->(rp:RadicalPosition)
        WHERE 1=1
      `;
      
      const conditions = [];
      if (r1 && r1 !== '*') {
        conditions.push('(rp.radical = $r1 AND rp.position = 1)');
        queryParams.r1 = r1;
      }
      if (r2 && r2 !== '*') {
        conditions.push('(rp.radical = $r2 AND rp.position = 2)');
        queryParams.r2 = r2;
      }
      if (r3 && r3 !== '*') {
        conditions.push('(rp.radical = $r3 AND rp.position = 3)');
        queryParams.r3 = r3;
      }
      
      if (conditions.length > 0) {
        cypherQuery += ' AND (' + conditions.join(' OR ') + ')';
      }
      
      cypherQuery += `
        WITH root, collect(rp) as matched_radicals
        WHERE size([(root)-[:HAS_RADICAL]->(:RadicalPosition) | 1]) <= 3
      `;
      
      // Count expected matches
      const expectedMatches = [r1, r2, r3].filter(r => r && r !== '*').length;
      if (expectedMatches > 0) {
        cypherQuery += ` AND size(matched_radicals) = ${expectedMatches}`;
      }
    }

    cypherQuery += `
      RETURN root
      ORDER BY root.${L1}
      LIMIT 25
    `;

    const result = await session.run(cypherQuery, queryParams);
    
    const roots = result.records.map(record => {
      const root = record.get('root').properties;
      const convertedRoot = convertIntegers(root);
      return {
        ...convertedRoot,
        label: L2 === 'off' ? convertedRoot[L1] : `${convertedRoot[L1]} / ${convertedRoot[L2]}`
      };
    });

    await session.close();
    res.json({
      roots,
      total: roots.length,
      searchType: 'position-specific',
      message: `Found ${roots.length} roots with position-specific search`
    });

  } catch (error) {
    console.error('Error in search-roots endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
});

// 2. Combinate - Return all valid permutations of specified radicals
router.get('/search-combinate', async (req, res) => {
  try {
    const { r1, r2, r3, L1, L2 } = req.query;
    
    if (!L1) {
      return res.status(400).json({ error: 'L1 language parameter is required' });
    }

    // Collect non-wildcard radicals
    const inputRadicals = [r1, r2, r3].filter(r => r && r !== '*');
    
    if (inputRadicals.length === 0) {
      return res.status(400).json({ error: 'At least one radical is required for combinate search' });
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
        LIMIT 25
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
        LIMIT 25
      `;
    }

    const result = await session.run(cypherQuery, queryParams);
    
    const roots = result.records.map(record => {
      const root = record.get('root').properties;
      const convertedRoot = convertIntegers(root);
      return {
        ...convertedRoot,
        label: L2 === 'off' ? convertedRoot[L1] : `${convertedRoot[L1]} / ${convertedRoot[L2]}`
      };
    });

    await session.close();
    res.json({
      roots,
      total: roots.length,
      searchType: 'combinate',
      message: `Found ${roots.length} roots with combinate search`
    });

  } catch (error) {
    console.error('Error in search-combinate endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
});

// 3. Fetch Extended - Only roots with 4+ radicals
router.get('/search-extended', async (req, res) => {
  try {
    const { r1, r2, r3, L1, L2 } = req.query;
    
    if (!L1) {
      return res.status(400).json({ error: 'L1 language parameter is required' });
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
      LIMIT 25
    `;

    const result = await session.run(cypherQuery, queryParams);
    
    const roots = result.records.map(record => {
      const root = record.get('root').properties;
      const convertedRoot = convertIntegers(root);
      return {
        ...convertedRoot,
        label: L2 === 'off' ? convertedRoot[L1] : `${convertedRoot[L1]} / ${convertedRoot[L2]}`
      };
    });

    await session.close();
    res.json({
      roots,
      total: roots.length,
      searchType: 'extended',
      message: `Found ${roots.length} extended roots (4+ radicals)`
    });

  } catch (error) {
    console.error('Error in search-extended endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
});


module.exports = router;
