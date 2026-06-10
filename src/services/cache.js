console.log("hello world");

const Redis = require("ioredis");

class CacheService {
  constructor({ redisUrl, ttlSeconds }) {
    this.ttlSeconds = ttlSeconds;
    this.memoryStore = new Map();
    this.redis = null;
    this.useRedis = false;

    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 1,
          lazyConnect: true,
          connectTimeout: 3000,
        });
        this.redis.on("error", (err) => {
          console.warn("Redis error, falling back to in-memory cache:", err.message);
          this.useRedis = false;
        });
        this.redis.on("connect", () => {
          this.useRedis = true;
          console.log("Connected to Redis cache");
        });
        this.redis.connect().catch(() => {
          console.warn("Redis unavailable, using in-memory cache");
        });
      } catch {
        console.warn("Redis init failed, using in-memory cache");
      }
    }
  }

  async get(key) {
    if (this.useRedis && this.redis) {
      try {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
      } catch {
        this.useRedis = false;
      }
    }

    const entry = this.memoryStore.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.memoryStore.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key, value) {
    if (this.useRedis && this.redis) {
      try {
        await this.redis.setex(key, this.ttlSeconds, JSON.stringify(value));
        return;
      } catch {
        this.useRedis = false;
      }
    }

    this.memoryStore.set(key, {
      value,
      expiresAt: Date.now() + this.ttlSeconds * 1000,
    });

    if (this.memoryStore.size > 1000) {
      const oldest = this.memoryStore.keys().next().value;
      this.memoryStore.delete(oldest);
    }
  }

  async close() {
    if (this.redis) {
      await this.redis.quit().catch(() => {});
    }
  }
}

module.exports = { CacheService };
