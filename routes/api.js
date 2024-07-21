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

// Helper function to format the data
const formatData = (records) => {
  return records.map(record => {
    const root = record.get('root').properties;
    const words = record.get('words').map(word => word.properties);
    return { root, words };
  });
};

const formatSimpleData = (records) => {
  return records.map(record => ({
    arabic: record.get('arabic'),
    english: record.get('english')
  }));
};

// Endpoint to list all root nodes
router.get('/list/roots', async (req, res) => {
  const session = req.driver.session();
  try {
    const result = await session.run(`
      MATCH (root:Root)
      RETURN root.arabic AS arabic, root.english AS english
    `);

    const roots = formatSimpleData(result.records);
    console.log('Fetched all roots:', roots); // Add logging
    res.json(roots);
  } catch (error) {
    console.error('Error fetching roots:', error);
    res.status(500).send('Error fetching roots');
  } finally {
    await session.close();
  }
});

// Endpoint to list all the names of Allah
router.get('/list/names_of_allah', async (req, res) => {
  const session = req.driver.session();
  try {
    const result = await session.run(`
      MATCH (name:NameOfAllah)
      RETURN name.arabic AS arabic, name.transliteration AS english
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

// Endpoint to list words from a specific concept
router.get('/list/:concept', async (req, res) => {
  const { concept } = req.params;
  const session = req.driver.session();
  try {
    const result = await session.run(`
      MATCH (concept:Concept {name: $concept})-[:HAS_WORD]->(item:Word)
      RETURN item.arabic AS arabic, item.english AS english
    `, { concept });

    const words = formatSimpleData(result.records);
    console.log(`Fetched words for concept ${concept}:`, words); // Add logging
    res.json(words);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Error fetching data');
  } finally {
    await session.close();
  }
});

// Endpoint to fetch data for a specific root and all its subnodes/related nodes
router.get('/root/:root', async (req, res) => {
  const { root } = req.params;
  const { script } = req.query;
  const session = req.driver.session();
  try {
    const result = await session.run(`
      MATCH (root:Root {${script}: $root})
      WITH root
      MATCH (root)-[r]->(relatedWord:Word)
      WHERE relatedWord.${script} IS NOT NULL
      RETURN root, collect(relatedWord) AS words
    `, { root, script });

    const data = formatData(result.records);
    console.log(`Fetched data for root ${root} with script ${script}:`, data); // Add logging
    res.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Error fetching data');
  } finally {
    await session.close();
  }
});

// Endpoint to fetch data for a specific word and its root
router.get('/word/:word', async (req, res) => {
  const { word } = req.params;
  const { script } = req.query;
  const session = req.driver.session();
  try {
    const result = await session.run(`
      MATCH (root:Root)-[r]->(word:Word {${script}: $word})
      WITH root
      MATCH (root)-[r2]->(relatedWord:Word)
      WHERE relatedWord.${script} IS NOT NULL
      RETURN root, collect(relatedWord) AS words
    `, { word, script });

    const data = formatData(result.records);
    console.log(`Fetched data for word ${word} with script ${script}:`, data); // Add logging
    res.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Error fetching data');
  } finally {
    await session.close();
  }
});

// Endpoint to fetch the root for a selected name of Allah
router.get('/name/:name', async (req, res) => {
  const { name } = req.params;
  const { script } = req.query;
  const session = req.driver.session();
  try {
    const field = script === 'english' ? 'transliteration' : 'arabic';
    const result = await session.run(`
      MATCH (name:NameOfAllah {${field}: $name})-[:HAS_ROOT]->(root:Root)
      WITH root
      MATCH (root)-[r]->(relatedWord:Word)
      WHERE relatedWord.${script} IS NOT NULL
      RETURN root, collect(relatedWord) AS words
    `, { name, script });

    const data = formatData(result.records);
    console.log(`Fetched data for name ${name} with script ${script}:`, data); // Add logging
    res.json(data);
  } catch (error) {
    console.error('Error fetching data for name:', error);
    res.status(500).send('Error fetching data for name');
  } finally {
    await session.close();
  }
});

// Endpoint to fetch words by form ID
router.get('/form/:formId', async (req, res) => {
  const { formId } = req.params;
  const { script } = req.query;
  const session = req.driver.session();
  try {
    console.log(`Received request for form ID ${formId} with script ${script}`);

    const result = await session.run(`
      MATCH (form:Form {form_id: toInteger($formId)})<-[:HAS_FORM]-(word:Word)
      WHERE word.${script} IS NOT NULL
      RETURN word.${script} AS scriptField, word.word_id AS wordId, word.arabic AS arabic, word.english AS english, word.form_id AS formId
    `, { formId, script });

    console.log(`Raw records for form ${formId} with script ${script}:`, result.records);

    const words = result.records.map(record => ({
      scriptField: record.get('scriptField'),
      wordId: convertIntegers(record.get('wordId')),
      arabic: record.get('arabic'),
      english: record.get('english'),
      formId: convertIntegers(record.get('formId'))
    }));

    console.log(`Formatted words for form ${formId} with script ${script}:`, words);
    res.json(words);
  } catch (error) {
    console.error('Error fetching words by form:', error);
    res.status(500).send('Error fetching words by form');
  } finally {
    await session.close();
  }
});

module.exports = router;
