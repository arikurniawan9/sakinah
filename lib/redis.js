import { Redis } from 'redis';

let redisClient;

// Fungsi untuk membuat koneksi Redis
async function createRedisClient() {
  if (!process.env.REDIS_URL) {
    console.warn('REDIS_URL not found in environment variables. Using mock Redis functionality.');
    // Jika tidak ada Redis, buat fungsi mock untuk menyimulasikan caching
    return {
      get: async (key) => {
        // Simpan data sementara di memory (hanya untuk development/testing)
        if (typeof window !== 'undefined') {
          // Di client side, tidak ada caching
          return null;
        }
        // Di server side, kita gunakan memory sementara
        const mockCache = global._mockRedisCache || (global._mockRedisCache = {});
        return mockCache[key] || null;
      },
      set: async (key, value, options = {}) => {
        if (typeof window !== 'undefined') {
          // Di client side, tidak ada caching
          return;
        }
        // Di server side, kita simpan di memory sementara
        const mockCache = global._mockRedisCache || (global._mockRedisCache = {});
        const ttl = options.EX || 3600; // Default 1 jam jika tidak diset
        mockCache[key] = value;
        
        // Hapus data setelah TTL
        setTimeout(() => {
          delete mockCache[key];
        }, ttl * 1000);
      },
      del: async (key) => {
        if (typeof window !== 'undefined') {
          return;
        }
        const mockCache = global._mockRedisCache || (global._mockRedisCache = {});
        delete mockCache[key];
      },
      connect: async () => {
        console.log('Mock Redis client connected');
      },
      quit: async () => {
        console.log('Mock Redis client disconnected');
      },
      on: () => {}, // Mock event listener
    };
  }

  const client = new Redis(process.env.REDIS_URL, {
    retry_strategy: (times) => {
      // Coba koneksi ulang setiap 10 detik, maksimal 3 kali
      if (times <= 3) {
        return 10000;
      }
      // Setelah 3 kali gagal, hentikan retry
      return undefined;
    },
  });

  client.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  await client.connect();
  return client;
}

// Inisialisasi Redis client
async function initRedisClient() {
  if (!redisClient) {
    redisClient = await createRedisClient();
  }
  return redisClient;
}

export default initRedisClient;