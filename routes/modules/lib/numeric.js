const neo4j = require('neo4j-driver');

const toNum = v => {
  if (v == null) return 0;
  if (neo4j.isInt(v)) return v.toNumber();
  if (typeof v === 'object' && 'low' in v) return neo4j.int(v.low, v.high).toNumber();
  return Number(v);
};

module.exports = { toNum };
