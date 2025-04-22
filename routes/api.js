const express = require('express');
const neo4j = require('neo4j-driver');
const router = express.Router();
const langs   = require('../config/languages');


const { convertIntegers, formatSimpleData, addNode, addLink, selectLanguageProps } = require('../utils/neo4jHelpers.js');

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

// GET  /api/languages
router.get('/languages', (_req, res) => {
  res.json(langs);
});


router.get('/list/quran_items', async (req, res) => {
  const { corpus_id, sura_index } = req.query;
  if (!corpus_id || !sura_index) {
    return res.status(400).send('Missing parameters');
  }

  const session = req.driver.session();
  try {
    const query = `
      MATCH (item:CorpusItem {corpus_id: toInteger($corpus_id), sura_index: toInteger($sura_index)})
      RETURN item {
        ${selectLanguageProps('item')},
        item_id: toInteger(item.item_id),
        aya_index: toInteger(item.aya_index),
        part_of_speech: item.part_of_speech,
        gender: item.gender
      } AS item
      ORDER BY item.aya_index
    `;

    const result = await session.run(query, { corpus_id, sura_index });
    const quranItems = result.records.map(r => r.get('item'));
    res.json(quranItems);
  } catch (error) {
    console.error('Error fetching Quran items:', error);
    res.status(500).send('Error fetching Quran items');
  } finally {
    await session.close();
  }
});

// Endpoint to list all corpus items by corpus_id
router.get('/list/corpus_items', async (req, res) => {
  const { corpus_id } = req.query;
  if (!corpus_id) {
    return res.status(400).send('Missing corpus_id parameter');
  }

  const session = req.driver.session();
  try {
    const query = `
      MATCH (item:CorpusItem {corpus_id: toInteger($corpus_id)})
      RETURN item {
        ${selectLanguageProps('item')},
        item_id: toInteger(item.item_id)
      } AS item
      LIMIT 100
    `;

    const result = await session.run(query, { corpus_id });
    const items = result.records.map(r => convertIntegers(r.get('item')));
    res.json(items);
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
router.get('/words_by_corpus_item/:itemId', async (req, res) => {
  const { itemId } = req.params;
  const { corpusId } = req.query;
  const session = req.driver.session();

  try {
    const query = `
      MATCH (item:CorpusItem { item_id: toInteger($itemId), corpus_id: toInteger($corpusId) })
      OPTIONAL MATCH (item)-[r1:HAS_WORD]->(word:Word)
      OPTIONAL MATCH (word)<-[r2:HAS_WORD]-(root:Root)
      OPTIONAL MATCH (word)-[r3:HAS_FORM]->(form:Form)
      RETURN
        item,
        collect(DISTINCT word) AS words,
        collect(DISTINCT root) AS roots,
        collect(DISTINCT form) AS forms,
        collect(DISTINCT r1)   AS hasWordLinks,
        collect(DISTINCT r2)   AS hasRootLinks,
        collect(DISTINCT r3)   AS hasFormLinks
    `;

    const result = await session.run(query, { itemId, corpusId });
    const record = result.records[0];

    // No match → empty graph
    if (!record) {
      return res.json({ nodes: [], links: [] });
    }

    const nodes = [];
    const links = [];
    const nodeMap = {};

    // Extract raw Neo4j objects
    const itemNode     = record.get('item');
    const words        = record.get('words');
    const roots        = record.get('roots');
    const forms        = record.get('forms');
    const hasWordLinks = record.get('hasWordLinks');
    const hasRootLinks = record.get('hasRootLinks');
    const hasFormLinks = record.get('hasFormLinks');

    // Build nodes
    addNode(itemNode, 'item_id', 'CorpusItem', nodes, nodeMap);
    words.forEach(w => addNode(w, 'word_id', 'Word', nodes, nodeMap));
    roots.forEach(r => addNode(r, 'root_id', 'Root', nodes, nodeMap));
    forms.forEach(f => addNode(f, 'form_id', 'Form', nodes, nodeMap));

    // Build links
    hasWordLinks.forEach(r => addLink(r, nodeMap, links, 'HAS_WORD'));
    hasRootLinks.forEach(r => addLink(r, nodeMap, links, 'HAS_WORD'));  // schema uses HAS_WORD
    hasFormLinks.forEach(r => addLink(r, nodeMap, links, 'HAS_FORM'));

    return res.json({ nodes, links });
  } catch (error) {
    console.error('Error fetching words and roots by corpus item:', error);
    return res.status(500).send('Internal Server Error');
  } finally {
    await session.close();
  }
});


// Endpoint to fetch words by form ID
router.get('/form/:formId', async (req, res) => {
  const { formId } = req.params;
  const {
    L1 = 'arabic',
    L2 = 'english',
    corpusId,
    rootIds
  } = req.query;
  const session = req.driver.session();

  try {
    // Build the MATCH clause
    let query = `
      MATCH (form:Form { form_id: toInteger($formId) })<-[:HAS_FORM]-(word:Word)
    `;
    const params = { formId: parseInt(formId, 10) };

    // Optional corpus filter
    if (corpusId) {
      query += ` WHERE word.corpus_id = toInteger($corpusId)`;
      params.corpusId = parseInt(corpusId, 10);
    }

    // Optional rootIds filter
    if (rootIds) {
      const ids = rootIds.split(',').map(id => parseInt(id, 10));
      query += corpusId ? ` AND ` : ` WHERE `;
      query += ` word.root_id IN $rootIds`;
      params.rootIds = ids;
    }

    // Project dynamic language props + key IDs
    query += `
      RETURN word {
        ${selectLanguageProps('word')},
        word_id: toInteger(word.word_id),
        form_id: toInteger(word.form_id),
        root_id: toInteger(word.root_id),
        corpus_id: toInteger(word.corpus_id)
      } AS word
    `;

    // Execute and normalize
    const result = await session.run(query, params);
    const words = result.records.map(r => convertIntegers(r.get('word')));

    // Build labels from L1/L2
    const labeled = words.map(w => {
      const label = (L2 === 'off' || !w[L2])
        ? w[L1]
        : `${w[L1]} / ${w[L2]}`;
      return { ...w, label };
    });

    res.json(labeled);
  } catch (error) {
    console.error('Error fetching words by form:', error);
    res.status(500).send('Error fetching words by form');
  } finally {
    await session.close();
  }
});


// Endpoint to list all available corpora
router.get('/list/corpora', async (req, res) => {
  const session = req.driver.session();
  try {
    const query = `
      MATCH (c:Corpus)
      RETURN c {
        ${selectLanguageProps('c')},
        id: toInteger(c.corpus_id),
        corpusType: c.corpusType
      } AS corpus
    `;
    const result = await session.run(query);

    const corpora = result.records.map(r =>
      convertIntegers(r.get('corpus'))
    );

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
