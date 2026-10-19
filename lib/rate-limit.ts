import { ApiError } from './api';

// Simple sliding-window limiter kept in process memory.
// NOTE: on serverless each instance has its own counter, so this is a
// best-effort guard against abuse, not a strict global quota.
const hits = new Map<string, number[]>();

export function enforceRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);

  if (recent.length >= limit) {
    throw new ApiError(429, 'Too many requests. Please try again later.');
  }

  recent.push(now);
  hits.set(key, recent);

  // Opportunistic cleanup so the map cannot grow without bound
  if (hits.size > 5000) {
    hits.forEach((times, k) => {
      if (times.every((t) => now - t >= windowMs)) hits.delete(k);
    });
  }
}
