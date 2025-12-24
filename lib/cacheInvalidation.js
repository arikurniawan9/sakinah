import { deleteFromCache, generateCacheKey } from '@/lib/cache';

// Fungsi untuk menghapus cache terkait stores
export async function invalidateStoresCache() {
  // Kita hapus cache dengan pattern tertentu
  // Dalam implementasi Redis sebenarnya, kita bisa menggunakan pattern matching
  // Untuk saat ini, kita hapus cache spesifik yang mungkin terpengaruh
  
  // Kita tidak bisa menggunakan pattern matching di mock Redis,
  // jadi kita hapus cache-cache yang umum digunakan untuk stores
  console.log('Invalidating stores cache...');
  
  // Hapus cache dashboard manager
  await deleteFromCache(`manager-dashboard-summary-*`);
  
  // Dalam implementasi nyata dengan Redis, kita bisa gunakan:
  // const keys = await redis.keys('stores:*');
  // if (keys.length > 0) {
  //   await redis.del(...keys);
  // }
}

// Fungsi untuk menghapus cache dashboard manager
export async function invalidateManagerDashboardCache(userId) {
  const cacheKey = `manager-dashboard-summary-${userId}`;
  await deleteFromCache(cacheKey);
  console.log(`Invalidated dashboard cache for user: ${userId}`);
}

// Fungsi untuk menghapus cache berdasarkan pattern (jika Redis mendukung)
export async function invalidateCacheByPattern(pattern) {
  // Dalam implementasi nyata, ini akan menghapus semua cache yang cocok dengan pattern
  console.log(`Invalidating cache by pattern: ${pattern}`);
}