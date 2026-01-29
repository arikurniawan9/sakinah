// lib/rateLimit.js
import { Redis } from 'redis';

let redis;
const memoryStore = new Map();
const useRedis = !!process.env.REDIS_URL;

if (useRedis) {
  redis = new Redis(process.env.REDIS_URL);
}

export async function rateLimit({
  key,
  limit = 10,
  window = 60 * 1000, // 1 minute in milliseconds
}) {
  const now = Date.now();
  const requestKey = `rateLimit:${key}`;

  if (useRedis) {
    const windowStart = now - window;
    
    const pipeline = redis.multi();
    pipeline.zremrangebyscore(requestKey, 0, windowStart);
    pipeline.zcard(requestKey);
    pipeline.zadd(requestKey, now, `${now}`);
    pipeline.expire(requestKey, Math.ceil(window / 1000));
    
    const results = await pipeline.exec();
    // Assuming the pipeline returns results in an array of [error, value] tuples
    const requestCount = results[1] ? Number(results[1]) : 0;
    
    if (requestCount >= limit) {
      const oldestRequest = await redis.zrange(requestKey, 0, 0, 'WITHSCORES');
      if (oldestRequest.length > 0) {
        const oldestTimestamp = parseInt(oldestRequest[1], 10);
        const resetTime = new Date(oldestTimestamp + window);
        
        return {
          success: false,
          resetTime: resetTime,
        };
      }
    }
    
    return {
      success: true,
      remaining: limit - requestCount,
      resetTime: new Date(now + window),
    };
  } else {
    // Memory store logic
    const requests = memoryStore.get(requestKey) || [];
    const validRequests = requests.filter(timestamp => now - timestamp < window);
    
    if (validRequests.length >= limit) {
      const timeSinceFirstRequest = now - validRequests[0];
      const timeToWait = window - timeSinceFirstRequest;
      
      return {
        success: false,
        resetTime: new Date(now + timeToWait),
      };
    }
    
    validRequests.push(now);
    memoryStore.set(requestKey, validRequests);
    
    return {
      success: true,
      remaining: limit - validRequests.length,
      resetTime: new Date(now + window),
    };
  }
}

export async function resetRateLimit(key) {
  const requestKey = `rateLimit:${key}`;
  if (useRedis) {
    await redis.del(requestKey);
  } else {
    memoryStore.delete(requestKey);
  }
}

export async function closeRedis() {
  if (useRedis && redis) {
    await redis.quit();
  }
}