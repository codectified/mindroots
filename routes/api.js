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
  const { script } = req.query;
  const session = req.driver.session();
  try {
    const result = await session.run(`
      MATCH (name:NameOfAllah {name_id: toInteger($nameId)})-[:HAS_WORD]->(word:Word)
      OPTIONAL MATCH (word)-[:HAS_FORM]->(form:Form)
      OPTIONAL MATCH (word)<-[:HAS_WORD]-(root:Root)
      RETURN name, collect(DISTINCT word) as words, collect(DISTINCT form) as forms, collect(DISTINCT root) as roots
    `, { nameId });

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
