// Ad-hoc Neo4j query runner for this experiment.
// Usage: node db_query.js "MATCH (a:Ayah) RETURN count(a) AS n"
// Reads creds from ../../.env (NEO4J_URI / NEO4J_USERNAME / NEO4J_PASSWORD).
require('/Users/omaribrahim/dev/mindroots/node_modules/dotenv').config({
  path: '/Users/omaribrahim/dev/mindroots/.env',
});
const neo4j = require('/Users/omaribrahim/dev/mindroots/node_modules/neo4j-driver');

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

(async () => {
  const session = driver.session();
  try {
    const res = await session.run(process.argv[2]);
    console.log(JSON.stringify(res.records.map((r) => r.toObject()), (k, v) =>
      v && typeof v === 'object' && v.low !== undefined && v.high !== undefined
        ? neo4j.int(v.low, v.high).toNumber()
        : v, 2));
  } catch (e) {
    console.error('ERR:', e.message);
  } finally {
    await session.close();
    await driver.close();
  }
})();
