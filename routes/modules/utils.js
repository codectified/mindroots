const neo4j = require('neo4j-driver');

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
    sem: record.get('sem'),
    qrootfreq: record.get('qrootfreq'),
    quran_frequency: record.get('quran_frequency')
  }));
};

// Parse a query-string number and keep it within [min, max]; fall back to def.
// Every user-supplied limit/count goes through this, so no request can ask the
// database for an unbounded amount of work.
const clampInt = (value, def, max, min = 1) => {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return def;
  return Math.min(Math.max(n, min), max);
};

module.exports = {
  clampInt,
  convertIntegers,
  formatSimpleData
};