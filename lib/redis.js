import { Redis } from 'redis';

let redisClient;

// Fungsi untuk membuat koneksi Redis
async function createRedisClient() {
  if (!process.env.REDIS_URL) {
    console.warn('REDIS_URL not found in environment variables. Using mock Redis functionality.');
    // Jika tidak ada Redis, buat fungsi mock untuk menyimulasikan caching
    // Gunakan Map untuk cache yang lebih efisien dan aman
    const mockCache = new Map();

    return {
      get: async (key) => {
        // Simpan data sementara di memory (hanya untuk development/testing)
        if (typeof window !== 'undefined') {
          // Di client side, tidak ada caching
          return null;
        }

        // Cek apakah entry ada dan belum kadaluarsa
        const entry = mockCache.get(key);
        if (entry) {
          const now = Date.now();
          if (now < entry.expiry) {
            return entry.value;
          } else {
            // Hapus entry yang sudah kadaluarsa
            mockCache.delete(key);
          }
        }
        return null;
      },
      set: async (key, value, options = {}) => {
        if (typeof window !== 'undefined') {
          // Di client side, tidak ada caching
          return;
        }

        // Di server side, kita simpan di memory sementara
        const ttl = options.EX || 3600; // Default 1 jam jika tidak diset
        const expiry = Date.now() + (ttl * 1000); // Convert to milliseconds

        mockCache.set(key, {
          value: value,
          expiry: expiry
        });
      },
      del: async (key) => {
        if (typeof window !== 'undefined') {
          return;
        }
        mockCache.delete(key);
      },
      connect: async () => {
        console.log('Mock Redis client connected');
      },
      quit: async () => {
        console.log('Mock Redis client disconnected');
      },
      on: () => {}, // Mock event listener
      flushAll: async () => {
        if (typeof window !== 'undefined') {
          return;
        }
        mockCache.clear();
      }
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