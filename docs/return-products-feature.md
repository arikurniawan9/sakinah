# Fitur Retur Produk

Fitur retur produk memungkinkan pelanggan untuk mengembalikan produk yang telah dibeli ke toko. Fitur ini mencakup manajemen retur, persetujuan, dan pembaruan stok otomatis.

## Arsitektur Fitur

### 1. Model Database
Model `ReturnProduct` telah ditambahkan ke schema Prisma untuk menyimpan data retur produk:
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

### 2. Endpoint API
Endpoint API yang tersedia:

#### GET /api/return-products
Mengambil daftar retur produk dengan kemampuan filter berdasarkan toko dan status.

Parameter query:
- `storeId`: Filter berdasarkan ID toko
- `status`: Filter berdasarkan status (PENDING, APPROVED, REJECTED)
- `page`: Halaman data (default: 1)
- `limit`: Jumlah data per halaman (default: 10)

#### POST /api/return-products
Membuat retur produk baru.

Body:
```json
{
  "storeId": "string",
  "transactionId": "string",
  "productId": "string",
  "attendantId": "string",
  "reason": "string",
  "category": "string"
}
```

#### GET /api/return-products/[id]
Mengambil detail retur produk berdasarkan ID.

#### PUT /api/return-products/[id]
Memperbarui status retur produk (menyetujui atau menolak).

Body:
```json
{
  "status": "APPROVED|REJECTED",
  "processedById": "string"
}
```

#### DELETE /api/return-products/[id]
Menghapus retur produk.

#### GET /api/return-products/stats
Mengambil statistik retur produk.

### 3. Komponen Frontend
- `/admin/retur-produk`: Halaman utama untuk manajemen retur produk
- `/admin/retur-produk/tambah`: Formulir untuk membuat retur produk baru
- `/admin/retur-produk/[id]`: Halaman detail retur produk

### 4. Integrasi Stok
- Saat retur disetujui, stok produk otomatis bertambah
- Fungsi `handleReturnStockUpdate()` menangani pembaruan stok
- Audit log dicatat untuk setiap perubahan stok

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

## Validasi
- Semua field wajib diisi saat membuat retur
- Validasi dilakukan untuk memastikan entitas terkait (toko, transaksi, produk, pelayan) ada
- Produk harus terdaftar dalam transaksi yang ditentukan

## Notifikasi
- Sistem otomatis membuat notifikasi saat retur baru dibuat
