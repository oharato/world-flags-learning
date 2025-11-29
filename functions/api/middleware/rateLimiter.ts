import type { Context, Next } from 'hono';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (will work across requests in the same worker)
// For production, consider using Cloudflare KV for distributed rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

/**
 * Rate limiting middleware for Hono
 * Limits requests by IP address
 */
export function rateLimiter(config: RateLimitConfig) {
  return async (c: Context, next: Next) => {
    // Get client IP from Cloudflare headers
    const ip =
      c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';

    const now = Date.now();
    const key = `ratelimit:${ip}`;

    let entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired one
      entry = {
        count: 1,
        resetTime: now + config.windowMs,
      };
      rateLimitStore.set(key, entry);
      return next();
    }

    if (entry.count >= config.maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      c.header('Retry-After', retryAfter.toString());
      return c.json(
        {
          error: 'リクエストが多すぎます。しばらく待ってから再度お試しください。',
          retryAfter,
        },
        429
      );
    }

    // Increment count
    entry.count++;
    rateLimitStore.set(key, entry);

    return next();
  };
}
