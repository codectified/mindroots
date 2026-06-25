// Export all Quran ayahs (corpus_id:2) as JSONL for embedding.
// Each Ayah node carries no text — we reconstruct it from its CorpusItems,
// ordered by word_position, concatenating `full_arabic` (diacritized).
//
// Output: ayahs.jsonl  — one record per line:
//   { "ayah_key": "1:1", "surah_id": 1, "ayah_id": 1, "n_words": 4, "text": "..." }
// Ordered canonically by (surah_id, ayah_id).

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

const num = (v) =>
  v && typeof v === 'object' && v.low !== undefined
    ? neo4j.int(v.low, v.high).toNumber()
    : v;

const QUERY = `
MATCH (a:Ayah {corpus_id:2})-[:HAS_ITEM]->(c:CorpusItem)
WITH a, c ORDER BY c.word_position
WITH a, collect(c.full_arabic) AS words
RETURN a.surah_id AS surah_id, a.ayah_id AS ayah_id, a.ayah_key AS ayah_key,
       words
ORDER BY a.surah_id, a.ayah_id
`;

(async () => {
  const session = driver.session();
  const outPath = path.join(__dirname, 'ayahs.jsonl');
  const stream = fs.createWriteStream(outPath);
  let count = 0;
  try {
    const res = await session.run(QUERY);
    for (const rec of res.records) {
      const words = rec.get('words').filter((w) => w != null);
      const text = words.join(' ').trim();
      const row = {
        ayah_key: rec.get('ayah_key'),
        surah_id: num(rec.get('surah_id')),
        ayah_id: num(rec.get('ayah_id')),
        n_words: words.length,
        text,
      };
      stream.write(JSON.stringify(row) + '\n');
      count++;
    }
  } catch (e) {
    console.error('ERR:', e.message);
    process.exitCode = 1;
  } finally {
    stream.end();
    await session.close();
    await driver.close();
  }
  console.log(`Wrote ${count} ayahs -> ${outPath}`);
})();
