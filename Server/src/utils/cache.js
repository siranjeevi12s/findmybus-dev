/**
 * Dependency-free in-memory TTL cache.
 *
 * Single-instance store is adequate for the current deployment. Entries
 * expire automatically after `ttlMs`; stale entries are lazily evicted on
 * read plus a periodic sweep so the map cannot grow unbounded.
 */
function createTTLCache({ ttlMs }) {
  const map = new Map();

  const sweeper = setInterval(() => {
    const cutoff = Date.now() - ttlMs;
    for (const [key, entry] of map) {
      if (entry.ts < cutoff) map.delete(key);
    }
  }, ttlMs);
  sweeper.unref?.();

  return {
    get(key) {
      const entry = map.get(key);
      if (!entry) return undefined;
      if (Date.now() - entry.ts > ttlMs) {
        map.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set(key, value) {
      map.set(key, { value, ts: Date.now() });
    },
    delete(key) {
      map.delete(key);
    },
    size() {
      return map.size;
    },
  };
}

module.exports = { createTTLCache };
