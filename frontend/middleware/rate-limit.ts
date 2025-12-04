interface RateLimitOptions {
  interval: number; // Time frame in milliseconds
  uniqueTokenPerInterval: number; // Max users per interval
}

export function rateLimit(options: RateLimitOptions) {
  const tokenCache = new Map<string, { count: number; lastReset: number }>();

  return {
    check: async (limit: number, token: string) => {
      const now = Date.now();
      
      // Get or create token data
      const tokenData = tokenCache.get(token) || { count: 0, lastReset: now };
      
      // Reset counter if interval has passed
      if (now - tokenData.lastReset > options.interval) {
        tokenData.count = 0;
        tokenData.lastReset = now;
      }

      // Check rate limit
      if (tokenData.count >= limit) {
        throw new Error('Rate limit exceeded');
      }

      // Increment counter
      tokenData.count++;
      tokenCache.set(token, tokenData);

      // Clean up old entries (optional, prevents memory leaks)
      if (tokenCache.size > options.uniqueTokenPerInterval) {
        const now = Date.now();
        for (const [key, value] of tokenCache.entries()) {
          if (now - value.lastReset > options.interval) {
            tokenCache.delete(key);
          }
        }
      }
    },
  };
}

// Store rate limit data in memory (consider using Redis in production)
const memoryStore = new Map<string, { count: number; resetTime: number }>();

export const rateLimitStore = {
  increment: (key: string, windowMs: number) => {
    const now = Date.now();
    const resetTime = now + windowMs;

    if (!memoryStore.has(key)) {
      memoryStore.set(key, { count: 1, resetTime });
      return { count: 1, resetTime };
    }

    const entry = memoryStore.get(key)!;
    
    if (now > entry.resetTime) {
      // Reset counter if window has passed
      const newEntry = { count: 1, resetTime };
      memoryStore.set(key, newEntry);
      return newEntry;
    }

    // Increment counter
    entry.count++;
    return { count: entry.count, resetTime: entry.resetTime };
  },
  
  get: (key: string) => {
    return memoryStore.get(key);
  },
  
  delete: (key: string) => {
    memoryStore.delete(key);
  },
  
  // Clean up old entries to prevent memory leaks
  cleanup: (windowMs: number) => {
    const now = Date.now();
    for (const [key, entry] of memoryStore.entries()) {
      if (now > entry.resetTime + windowMs) {
        memoryStore.delete(key);
      }
    }
  },
};

// Periodically clean up old entries
setInterval(() => {
  rateLimitStore.cleanup(60 * 1000); // Clean up entries older than 1 minute
}, 30 * 1000); // Run every 30 seconds
