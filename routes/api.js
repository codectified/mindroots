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
      RETURN item, collect(DISTINCT word) as words, collect(DISTINCT root) as roots
    `;

    const result = await session.run(query, { itemId, corpusId });
    const records = result.records[0];
    if (records) {
      const item = records.get('item').properties;
      const words = records.get('words').map(record => convertIntegers(record.properties));
      const roots = records.get('roots').map(record => convertIntegers(record.properties));
      res.json({ item, words, roots });
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
      RETURN corpus.corpus_id AS id, corpus.arabic AS arabic, corpus.english AS english
    `);

    const corpora = result.records.map(record => ({
      id: convertIntegers(record.get('id')),
      arabic: record.get('arabic'),
      english: record.get('english')
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
  const { r1, r2, r3, L1, L2 } = req.query;
  const session = req.driver.session();

  try {
    // Dynamically build the Cypher query based on which letters are provided
    let query = 'MATCH (root:Root)';
    const conditions = [];
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

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Query to count all matching roots (for total count)
    const countQuery = query + ' RETURN COUNT(root) AS total';
    const countResult = await session.run(countQuery, params);
    const total = countResult.records[0].get('total').low || 0; // Total count of root nodes

    // Fetch the first 25 roots
    query += ' RETURN root LIMIT 25';
    const result = await session.run(query, params);

    if (result.records.length > 0) {
      const roots = result.records.map(record => {
        const root = record.get('root').properties;
        return {
          ...root,
          label: L2 === 'off' ? root[L1] : `${root[L1]} / ${root[L2]}`,
          root_id: root.root_id
        };
      });
      res.json({ roots, total }); // Return roots and total number of matching roots
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
