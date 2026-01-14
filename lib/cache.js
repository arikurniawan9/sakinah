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
  // Hapus cache produk untuk toko tertentu
  // Dalam implementasi Redis asli, kita akan menggunakan pattern matching
  // Dalam mock, kita tidak bisa melakukan pattern matching, jadi kita hanya log
  console.log(`Cache invalidation requested for store: ${storeId}.`);

  // Jika menggunakan Redis asli, kita akan melakukan ini:
  // const client = await getClient();
  // const keys = await client.keys(`products:${storeId}:*`);
  // if (keys.length > 0) {
  //   await client.del(keys);
  // }

  // Dalam mock Redis, kita tidak bisa menggunakan keys(), jadi hanya log
  return Promise.resolve();
}