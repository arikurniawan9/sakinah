// lib/cache.js
import initRedisClient from './redis';

async function getClient() {
  try {
    const client = await initRedisClient();
    return client;
  } catch (error) {
    console.error('Failed to initialize Redis client:', error);
    // Return a mock client if Redis fails to initialize
    return {
      get: async () => null,
      set: async () => {},
      del: async () => {},
    };
  }
}

export async function getFromCache(key) {
  const client = await getClient();
  try {
    return await client.get(key);
  } catch (error) {
    console.error(`Error getting from cache for key ${key}:`, error);
    return null;
  }
}

export async function setToCache(key, value, ttl = 300) { // Default 5 menit
  const client = await getClient();
  try {
    await client.set(key, value, { EX: ttl });
  } catch (error) {
    console.error(`Error setting cache for key ${key}:`, error);
  }
}

export async function deleteFromCache(key) {
  const client = await getClient();
  try {
    await client.del(key);
  } catch (error) {
    console.error(`Error deleting from cache for key ${key}:`, error);
  }
}

export function generateCacheKey(prefix, params) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  return `${prefix}?${sortedParams}`;
}

export async function invalidateProductCache(storeId) {
  // This is a placeholder. A real implementation would be more robust.
  // For now, this function does not do anything to avoid deleting wrong keys.
  // A proper implementation might involve storing all keys for a storeId in a Redis SET
  // and then deleting them.
  console.log(`Cache invalidation requested for store: ${storeId}. (Currently a placeholder)`);
  return Promise.resolve();
}