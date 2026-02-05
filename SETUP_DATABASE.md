# Setup Database Lokal untuk Sakinah

## Masalah
Anda mengalami error saat menjalankan aplikasi karena konfigurasi database Prisma tidak valid.

## Solusi: Gunakan Database Lokal

### Langkah 1: Instalasi Docker
1. Unduh dan instal Docker Desktop dari https://www.docker.com/products/docker-desktop
2. Jalankan Docker Desktop

### Langkah 2: Jalankan PostgreSQL Lokal
Buka terminal/command prompt di direktori proyek dan jalankan:
```
docker-compose up -d
```

### Langkah 3: Ganti Konfigurasi Database
Ubah file `.env` menjadi:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/toko_sakinah_db?schema=public"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="Ql5v5qFILcOuJ36jAXZz5fe5ejHVvT/H86OCpq+TzG8="
```

### Langkah 4: Generate dan Migrate Database
Jalankan perintah berikut:
```
npx prisma generate
npx prisma db push
```

### Langkah 5: Jalankan Aplikasi
```
npm run dev
```

## Catatan Tambahan
- Jika Anda ingin menggunakan database produksi, Anda perlu mengkonfigurasi koneksi database Supabase yang benar
- Pastikan untuk tidak menyimpan credential database di kode yang di-commit ke repositori