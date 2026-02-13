# Fitur Retur Produk

Fitur retur produk memungkinkan pelanggan untuk mengembalikan produk yang telah dibeli ke toko. Fitur ini mencakup manajemen retur, persetujuan, dan pembaruan stok otomatis.

## Status Implementasi

Fitur ini telah diimplementasikan secara lengkap tetapi menggunakan sistem fallback karena masalah koneksi database:

- ✅ Struktur database (model ReturnProduct) sudah ada di schema Prisma
- ✅ Endpoint API untuk manajemen retur produk sudah dibuat
- ✅ Komponen frontend untuk manajemen retur di halaman admin sudah dibuat
- ✅ Integrasi dengan sistem inventory toko sudah diimplementasikan
- ⚠️ Sistem saat ini menggunakan data mock karena masalah akses database
- ✅ Sistem fallback otomatis beralih ke data mock jika database tidak dapat diakses

## Cara Kerja

### Endpoint API

#### GET `/api/return-products`
- Mengambil daftar retur produk
- Jika database dapat diakses: mengambil data dari database
- Jika database tidak dapat diakses: menggunakan data mock
- Parameter query opsional: `storeId`, `status`, `page`, `limit`

#### POST `/api/return-products`
- Membuat retur produk baru
- Jika database dapat diakses: menyimpan ke database
- Jika database tidak dapat diakses: menyimpan ke data mock

#### GET `/api/return-products/[id]`
- Mengambil detail retur produk berdasarkan ID
- Menggunakan sistem fallback yang sama

#### PUT `/api/return-products/[id]`
- Memperbarui status retur produk (menyetujui atau menolak)
- Jika disetujui: stok produk otomatis bertambah
- Menggunakan sistem fallback yang sama

### Komponen Frontend

- `/admin/retur-produk`: Halaman utama untuk manajemen retur produk
- `/admin/retur-produk/tambah`: Formulir untuk membuat retur produk baru
- `/admin/retur-produk/[id]`: Halaman detail retur produk
- `/admin/debug-return-api`: Halaman untuk debugging API

## Solusi untuk Masalah Database

Untuk mengaktifkan akses database penuh, Anda perlu:

1. Pastikan koneksi database sudah benar di file `.env`
2. Jalankan migrasi Prisma:
   ```bash
   npx prisma migrate dev
   ```
3. Generate ulang client Prisma:
   ```bash
   npx prisma generate
   ```

Catatan: Di lingkungan Windows, mungkin ada masalah hak akses saat menjalankan perintah Prisma. Pastikan Anda menjalankan perintah dari terminal dengan hak administrator.

## Struktur Data

Model `ReturnProduct` memiliki field-field berikut:
- `id`: ID unik untuk setiap retur
- `storeId`: ID toko tempat retur dilakukan
- `transactionId`: ID transaksi asli
- `productId`: ID produk yang diretur
- `attendantId`: ID pelayan yang menangani retur
- `reason`: Alasan retur
- `category`: Kategori retur (kesalahan pelayan, cacat produk, salah pilih, lainnya)
- `returnDate`: Tanggal retur
- `status`: Status retur (PENDING, APPROVED, REJECTED)
- `createdAt` dan `updatedAt`: Timestamp

## Penggunaan

### Membuat Retur Produk Baru
1. Akses halaman `/admin/retur-produk/tambah`
2. Isi formulir dengan informasi yang diperlukan
3. Submit formulir untuk membuat permintaan retur

### Menyetujui/Menolak Retur
1. Akses halaman detail retur di `/admin/retur-produk/[id]`
2. Klik tombol "Setujui Retur" atau "Tolak Retur"
3. Konfirmasi tindakan Anda

### Melihat Statistik
Statistik retur produk tersedia di halaman utama `/admin/retur-produk`.

## Error Handling

Sistem ini dirancang untuk tetap berfungsi meskipun database tidak dapat diakses:
- Otomatis beralih ke data mock
- Menyediakan pesan error yang informatif
- Menyimpan informasi sumber data (database atau mock) di response API

## File-file Penting

- `app/api/return-products/route.js` - Endpoint API utama
- `app/api/return-products/[id]/route.js` - Endpoint detail dan update
- `app/admin/retur-produk/page.js` - Halaman utama retur produk
- `app/admin/retur-produk/[id]/page.js` - Halaman detail retur produk
- `app/admin/retur-produk/Form.js` - Formulir retur produk
- `utils/return-stock-handler.js` - Fungsi untuk manajemen stok
- `utils/mock-return-data.js` - Data mock untuk fallback
- `components/Sidebar.js` - Menu navigasi (termasuk link ke fitur retur)