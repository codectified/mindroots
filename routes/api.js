const express = require('express');
const neo4j = require('neo4j-driver'); // Import neo4j
const router = express.Router();

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
    arabic: record.get('arabic'),
    english: record.get('english'),
    name_id: convertIntegers(record.get('name_id')) // Convert and include name_id
  }));
};

// Endpoint to list all the names of Allah
router.get('/list/names_of_allah', async (req, res) => {
  const session = req.driver.session();
  try {
    const result = await session.run(`
      MATCH (name:NameOfAllah)
      RETURN name.arabic AS arabic, name.transliteration AS english, name.name_id AS name_id
    `);

    const names = formatSimpleData(result.records);
    console.log('Fetched all names of Allah:', names); // Add logging
    res.json(names);
  } catch (error) {
    console.error('Error fetching names of Allah:', error);
    res.status(500).send('Error fetching names of Allah');
  } finally {
    await session.close();
  }
});


// Endpoint to fetch words, forms, and roots by name ID
router.get('/words_by_name/:nameId', async (req, res) => {
  const { nameId } = req.params;
  const { script, corpusId } = req.query;
  const session = req.driver.session();
  try {
    let query = `
      MATCH (name:NameOfAllah {name_id: toInteger($nameId)})-[:HAS_WORD]->(word:Word)
      OPTIONAL MATCH (word)-[:HAS_FORM]->(form:Form)
      OPTIONAL MATCH (word)<-[:HAS_WORD]-(root:Root)
    `;

    if (corpusId) {
      query += `
        WHERE word.corpus_id = toInteger($corpusId)
      `;
    }

    query += `
      RETURN name, collect(DISTINCT word) as words, collect(DISTINCT form) as forms, collect(DISTINCT root) as roots
    `;

    const result = await session.run(query, { nameId, corpusId });
    const records = result.records[0];
    if (records) {
      const name = records.get('name').properties;
      const words = records.get('words').map(record => convertIntegers(record.properties));
      const forms = records.get('forms').map(record => convertIntegers(record.properties));
      const roots = records.get('roots').map(record => convertIntegers(record.properties));
      res.json({ name, words, forms, roots });
    } else {
      res.json({});
    }
  } catch (error) {
    console.error('Error fetching words, forms, and roots by name:', error);
    res.status(500).send('Error fetching words, forms, and roots by name');
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




// Endpoint to fetch words by root radicals
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


// Endpoint to fetch roots by radicals
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
      RETURN corpus.id AS id, corpus.name AS name
    `);

    const corpora = result.records.map(record => ({
      id: convertIntegers(record.get('id')),
      name: record.get('name')
    }));

    res.json(corpora);
  } catch (error) {
    console.error('Error fetching corpora:', error);
    res.status(500).send('Error fetching corpora');
  } finally {
    await session.close();
  }
});


module.exports = router;
