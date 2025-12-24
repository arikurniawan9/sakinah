# Dokumentasi Perubahan Sistem Harga dan Multi-Tenant

## Ringkasan
Sistem harga aplikasi Toko SAKINAH telah diubah dari sistem harga tier-based dengan diskon persentase menjadi sistem harga tetap berdasarkan level membership. Selain itu, sistem aplikasi telah dikembangkan menjadi sistem multi-tenant dengan role gudang.

## Perubahan Utama

### 1. Struktur Database
- **Model Product**:
  - Menghapus field: `priceTiers` (relasi ke PriceTier)
  - Menambahkan field baru: `retailPrice`, `silverPrice`, `goldPrice`, `platinumPrice`
  - Harga-harga ini menyimpan harga tetap untuk masing-masing level membership

- **Model Member**:
  - Menghapus field: `discount` (tidak lagi menggunakan diskon persentase)
  - Field `membershipType` tetap digunakan untuk menentukan level harga

- **Model SaleDetail**:
  - Struktur tetap sama, field `price` sekarang menyimpan harga yang digunakan saat transaksi sesuai dengan level membership

- **Model Baru**:
  - `Store`: Untuk mengelola toko multi-tenant
  - `StoreUser`: Untuk menghubungkan pengguna dengan toko tertentu
  - `Warehouse`: Untuk mengelola gudang pusat
  - `WarehouseProduct`: Untuk mengelola produk di gudang
  - `WarehouseDistribution`: Untuk mengelola distribusi barang dari gudang ke toko

### 2. Sistem Harga Baru
- **Harga Eceran** (RETAIL): Harga untuk pelanggan umum
- **Harga Silver** (SILVER): Harga untuk member Silver
- **Harga Gold** (GOLD): Harga untuk member Gold
- **Harga Platinum** (PLATINUM): Harga untuk member Platinum/partai

### 3. Sistem Multi-Tenant dan Role Baru
- **Role MANAGER**: Role global yang dapat mengakses semua toko
- **Role WAREHOUSE**: Role untuk mengelola gudang pusat dan distribusi ke toko-toko
- **Role ADMIN, CASHIER, ATTENDANT**: Role per-toko yang hanya dapat mengakses toko tertentu

### 4. Perubahan Fungsi dan Logika

#### API
- `/api/transaksi/calculate/route.js`: Menghitung harga berdasarkan level membership
- `/api/produk/route.js`: CRUD produk dengan 4 level harga
- `/api/produk/import/route.js`: Mendukung impor produk dengan 4 level harga

#### Utilitas
- `utils/productUtils.js`: Fungsi `getSellingPriceByMemberType()` untuk mendapatkan harga berdasarkan level membership
- `lib/hooks/kasir/useTransactionCart.js`: Logika perhitungan transaksi disesuaikan

#### Komponen UI
- `components/produk/ProductModal.js`: Form input produk dengan 4 field harga
- `components/produk/ProductDetailModal.js`: Menampilkan 4 level harga
- `app/kasir/transaksi/page.js`: Menggunakan harga berdasarkan member saat ini

### 5. Flow Transaksi Baru
1. Kasir memilih member (menentukan level harga)
2. Sistem otomatis menggunakan harga sesuai level membership
3. Perhitungan total berdasarkan harga tetap (bukan diskon dari harga dasar)

### 6. Migration Script
File: `harga_member_migrasi.sql` - Berisi perintah SQL untuk mengubah struktur database
File: `add_multi_tenant_features.sql` - Berisi perintah SQL untuk menambahkan fitur multi-tenant dan gudang

## Testing yang Diperlukan

### Fungsi CRUD Produk
- [ ] Tambah produk dengan 4 level harga
- [ ] Update produk dengan 4 level harga
- [ ] Tampilan detail produk menunjukkan 4 level harga
- [ ] Impor produk dari CSV/XLSX mendukung 4 level harga

### Fungsi Transaksi
- [ ] Transaksi pelanggan umum (harga eceran)
- [ ] Transaksi member Silver (harga Silver)
- [ ] Transaksi member Gold (harga Gold)
- [ ] Transaksi member Platinum (harga Platinum)
- [ ] Perhitungan total benar sesuai harga yang digunakan
- [ ] Struk menunjukkan harga yang benar

### Fungsi Multi-Tenant
- [ ] Manager dapat mengakses semua toko
- [ ] Pengguna per-toko hanya dapat mengakses toko yang ditentukan
- [ ] Distribusi barang dari gudang ke toko berfungsi dengan benar
- [ ] Sistem autentikasi membedakan antara role global dan per-toko

### Validasi
- [ ] Tidak ada penggunaan field lama (priceTiers, discount dalam Member)
- [ ] Semua komponen tampilan sudah disesuaikan
- [ ] Semua API endpoint berfungsi dengan sistem baru
- [ ] Sistem multi-tenant berfungsi sesuai ekspektasi