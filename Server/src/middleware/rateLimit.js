/**
 * Dependency-free sliding-window rate limiter for the mobile auth endpoints.
 * In-memory per-process storage — adequate for a single-instance prototype
 * deployment. Swap for a Redis-backed limiter if the API is scaled out.
 */
function createRateLimiter({ windowMs, max, keyFn }) {
  const hits = new Map();

  // Periodically purge the window map so it cannot grow unbounded.
  const sweeper = setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [key, times] of hits) {
      const fresh = times.filter((t) => t > cutoff);
      if (fresh.length === 0) hits.delete(key);
      else hits.set(key, fresh);
    }
  }, windowMs);
  sweeper.unref?.();

  return function rateLimit(req, res, next) {
    const key = keyFn(req);
    const now = Date.now();
    const cutoff = now - windowMs;
    const times = (hits.get(key) ?? []).filter((t) => t > cutoff);

    if (times.length >= max) {
      hits.set(key, times);
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please slow down and try again shortly.',
        data: null,
        error: null,
      });
    }

    times.push(now);
    hits.set(key, times);
    next();
  };
}

module.exports = { createRateLimiter };
