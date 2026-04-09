const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  retryStrategy: () => null, // don't retry — fail fast and fallback to DB
});

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', () => {}); // silent — app works without Redis

module.exports = redis;
