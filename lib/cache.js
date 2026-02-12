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
  if (!storeId) return;
  
  const client = await getClient();
  try {
    // Jika menggunakan Redis asli (bukan mock)
    if (typeof client.keys === 'function') {
      const pattern = `products:${storeId}:*`;
      const keys = await client.keys(pattern);
      
      if (keys.length > 0) {
        await client.del(keys);
        console.log(`Successfully invalidated ${keys.length} product cache keys for store: ${storeId}`);
      }
    } else {
      // Untuk implementasi Mock (Map)
      // Karena kita tidak bisa melakukan pattern matching pada Map dengan mudah melalui interface ini,
      // kita serahkan revalidasi ke client-side SWR atau tunggu expire di server side
      console.log(`Mock cache invalidation log for store: ${storeId}`);
    }
  } catch (error) {
    console.error(`Error invalidating product cache for store ${storeId}:`, error);
  }
}