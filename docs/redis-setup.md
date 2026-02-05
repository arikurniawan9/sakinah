# Panduan Setup Redis Cache

## Overview
Aplikasi Sakinah menggunakan Redis sebagai sistem caching untuk meningkatkan performa. Jika Redis tidak tersedia, sistem akan menggunakan mock Redis sebagai fallback.

## Konfigurasi Environment Variable

Untuk menggunakan Redis secara penuh, tambahkan variabel berikut ke file `.env.local`:

```env
REDIS_URL=redis://localhost:6379
```

## Instalasi Redis

### Di Local Development

#### Windows
1. Unduh Redis dari: https://github.com/redis-windows/redis-windows
2. Ekstrak dan jalankan `redis-server.exe`
3. Pastikan Redis berjalan di port 6379 (default)

#### Alternatif untuk Windows (menggunakan WSL)
1. Install WSL2
2. Install Redis di WSL: `sudo apt-get install redis-server`
3. Jalankan Redis: `sudo service redis-server start`

#### macOS
1. Install Homebrew jika belum: `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
2. Install Redis: `brew install redis`
3. Jalankan Redis: `brew services start redis`

#### Linux
1. Install Redis: `sudo apt-get install redis-server`
2. Jalankan Redis: `sudo systemctl start redis-server`
3. Enable auto-start: `sudo systemctl enable redis-server`

## Fallback System

Jika `REDIS_URL` tidak ditemukan:
- Sistem akan menggunakan mock Redis berbasis memory
- Data cache akan disimpan sementara di memory server
- Cache akan hilang saat server restart
- Tetap menyediakan fungsionalitas caching dasar

## Kelebihan Menggunakan Redis Asli

1. **Performa Lebih Baik**: Redis berjalan di dedicated process
2. **Persistence**: Data cache bisa bertahan saat restart server
3. **Scalability**: Bisa digunakan bersama multiple server instances
4. **Memory Management**: Lebih efisien dalam penggunaan memory

## Troubleshooting

### Jika muncul pesan "REDIS_URL not found in environment variables"
- Pastikan file `.env.local` sudah dibuat
- Pastikan variabel `REDIS_URL` sudah diisi dengan benar
- Restart development server setelah mengubah file environment

### Jika Redis tidak bisa terkoneksi
- Pastikan Redis server sedang berjalan
- Cek apakah port yang digunakan benar
- Pastikan tidak ada firewall yang memblokir koneksi

## Production Deployment

Untuk deployment ke production:
1. Gunakan Redis instance yang terpisah
2. Gunakan Redis Cloud Service (seperti AWS ElastiCache, Google Cloud Memorystore, atau Redis Labs)
3. Pastikan koneksi Redis diamankan dengan password jika diperlukan

Contoh konfigurasi production:
```
REDIS_URL=redis://:password@redis-host:port
```

## Monitoring

Sistem caching akan mencatat log saat:
- Menggunakan mock Redis (saat Redis tidak tersedia)
- Terjadi error pada koneksi Redis
- Melakukan operasi cache (get/set/del)