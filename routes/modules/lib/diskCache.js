const fs = require('fs');

// Persistent disk cache. Survives server restarts. One JSON file per module.
const makeDiskCache = (filePath, ttlMs) => {
  let cache = {};
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    cache = JSON.parse(raw);
    const now = Date.now();
    Object.keys(cache).forEach(k => { if (now - cache[k].ts > ttlMs) delete cache[k]; });
    console.log(`[diskCache] loaded ${Object.keys(cache).length} entries from ${filePath}`);
  } catch (_) {
    // no cache file yet — start fresh
  }

  const save = () => {
    try { fs.writeFileSync(filePath, JSON.stringify(cache)); } catch (_) {}
  };

  const cached = async (key, fn) => {
    const hit = cache[key];
    if (hit && Date.now() - hit.ts < ttlMs) return hit.data;
    const data = await fn();
    cache[key] = { data, ts: Date.now() };
    save();
    return data;
  };

  return { cached };
};

module.exports = { makeDiskCache };
