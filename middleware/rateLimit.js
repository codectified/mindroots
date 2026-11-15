// In-memory fixed-window rate limiter (no dependency: the deploy copies
// package.json but doesn't run npm install on the box).
//
// Keys on req.ip, which is the visitor's real address only because server.js
// sets `trust proxy` for nginx on loopback. Counts reset when the backend
// restarts, which is fine for a backstop: nginx's limit_req is the first line.
//
//   perIp     max requests per IP per window
//   global    optional max requests from everyone together per window, so
//             rotating IPs can't make unbounded writes
const rateLimit = ({ name, windowMs, perIp, global = null }) => {
  const hits = new Map(); // ip -> { count, resetAt }
  let globalCount = 0;
  let globalResetAt = Date.now() + windowMs;

  // Drop expired entries so the map can't grow forever.
  setInterval(() => {
    const now = Date.now();
    for (const [ip, h] of hits) if (h.resetAt <= now) hits.delete(ip);
  }, windowMs).unref();

  return (req, res, next) => {
    const now = Date.now();
    const ip = req.ip || 'unknown';

    if (globalResetAt <= now) { globalCount = 0; globalResetAt = now + windowMs; }

    // A loopback address means nginx didn't pass the visitor's address on, so
    // every visitor would share one per-IP bucket. Apply only the global cap
    // then, and say so once in the log.
    if (LOOPBACK.has(ip)) {
      if (!warned) { warned = true; console.warn(`[rateLimit:${name}] client IP is ${ip}: nginx isn't sending X-Forwarded-For, so per-IP limits are off`); }
      if (global !== null && globalCount >= global) return tooMany(res, name, ip, globalResetAt - now);
      globalCount += 1;
      return next();
    }

    let h = hits.get(ip);
    if (!h || h.resetAt <= now) { h = { count: 0, resetAt: now + windowMs }; hits.set(ip, h); }

    if (h.count >= perIp || (global !== null && globalCount >= global)) {
      return tooMany(res, name, ip, (h.count >= perIp ? h.resetAt : globalResetAt) - now);
    }
    h.count += 1;
    globalCount += 1;
    next();
  };
};

const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
let warned = false;
const tooMany = (res, name, ip, ms) => {
  res.set('Retry-After', String(Math.ceil(ms / 1000)));
  console.log(`[rateLimit:${name}] 429 for IP ${ip}`);
  return res.status(429).json({ error: 'Too many requests. Please try again later.' });
};

module.exports = { rateLimit };
