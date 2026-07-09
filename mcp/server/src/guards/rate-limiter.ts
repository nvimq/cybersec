// In-memory sliding window rate limiter.
// Resets on server restart — acceptable for MVP.
// Production: replace with Redis-backed limiter (e.g., via ioredis).

export interface RateLimiterConfig {
  maxRequests: number;
  windowMs: number;
}

const DEFAULT_CONFIG: RateLimiterConfig = {
  maxRequests: 100,
  windowMs: 60_000,
};

interface WindowEntry {
  timestamps: number[];
}

const windows = new Map<string, WindowEntry>();

export function setRateLimiterConfig(config: Partial<RateLimiterConfig>): void {
  if (config.maxRequests !== undefined) DEFAULT_CONFIG.maxRequests = config.maxRequests;
  if (config.windowMs !== undefined) DEFAULT_CONFIG.windowMs = config.windowMs;
}

export function checkRateLimit(clientId: string = "default"): { allowed: boolean; remaining: number; resetAfterMs: number } {
  const now = Date.now();
  let entry = windows.get(clientId);

  if (!entry) {
    entry = { timestamps: [] };
    windows.set(clientId, entry);
  }

  entry.timestamps = entry.timestamps.filter((ts) => now - ts < DEFAULT_CONFIG.windowMs);

  if (entry.timestamps.length >= DEFAULT_CONFIG.maxRequests) {
    const oldest = entry.timestamps[0] ?? now;
    const resetAfterMs = DEFAULT_CONFIG.windowMs - (now - oldest);
    return { allowed: false, remaining: 0, resetAfterMs: Math.max(resetAfterMs, 1000) };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: DEFAULT_CONFIG.maxRequests - entry.timestamps.length,
    resetAfterMs: 0,
  };
}

export function resetRateLimiter(): void {
  windows.clear();
}
