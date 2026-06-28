// Export root -> ayah membership for the Quran corpus (no embeddings here).
// Output: roots.jsonl, one record per root:
//   { root, translit, occurrences, n_ayahs, ayah_keys:[...distinct...],
//     glosses:[[gloss,count],...top5] }

require('/Users/omaribrahim/dev/mindroots/node_modules/dotenv').config({
  path: '/Users/omaribrahim/dev/mindroots/.env',
});
const neo4j = require('/Users/omaribrahim/dev/mindroots/node_modules/neo4j-driver');
const fs = require('fs');
const path = require('path');

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

(async () => {
  const session = driver.session();
  try {
    // root -> all ayah_keys (one entry per token occurrence)
    const r1 = await session.run(`
      MATCH (a:Ayah {corpus_id:2})-[:HAS_ITEM]->(c:CorpusItem)
      WHERE c.root IS NOT NULL AND c.root <> ''
      RETURN c.root AS root, collect(a.ayah_key) AS ayah_keys
    `);
    // root -> word glosses
    const r2 = await session.run(`
      MATCH (c:CorpusItem {corpus_id:2})-[:HAS_WORD]->(w:Word)
      WHERE c.root IS NOT NULL AND c.root <> ''
        AND w.english IS NOT NULL AND w.english <> ''
      RETURN c.root AS root, w.english AS gloss, count(*) AS f
    `);
    // root string (dashes stripped) -> transliteration
    const r3 = await session.run(`
      MATCH (r:Root) WHERE r.n_root IS NOT NULL
      RETURN r.n_root AS n_root, r.english AS translit
    `);

    const translit = {};
    for (const rec of r3.records) {
      const key = (rec.get('n_root') || '').replace(/-/g, '');
      translit[key] = rec.get('translit');
    }

    const glossMap = {};
    for (const rec of r2.records) {
      const root = rec.get('root');
      const g = rec.get('gloss');
      const f = rec.get('f').toNumber ? rec.get('f').toNumber() : rec.get('f');
      (glossMap[root] = glossMap[root] || {});
      glossMap[root][g] = (glossMap[root][g] || 0) + f;
    }

    const out = fs.createWriteStream(path.join(__dirname, 'roots.jsonl'));
    let n = 0;
    for (const rec of r1.records) {
      const root = rec.get('root');
      const keys = rec.get('ayah_keys');
      const distinct = [...new Set(keys)].sort();
      const glosses = Object.entries(glossMap[root] || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      out.write(JSON.stringify({
        root,
        translit: translit[root] || '',
        occurrences: keys.length,
        n_ayahs: distinct.length,
        ayah_keys: distinct,
        glosses,
      }) + '\n');
      n++;
    }
    out.end();
    console.log(`Wrote ${n} roots -> roots.jsonl`);
  } catch (e) {
    console.error('ERR:', e.message);
    process.exitCode = 1;
  } finally {
    await session.close();
    await driver.close();
  }
})();
