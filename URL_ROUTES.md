# URL Routes Documentation - Sistem Multi-Tenant Sakinah

## Public Routes
- `GET /login` - Halaman login sistem
- `GET /unauthorized` - Halaman akses ditolak
- `GET /admin` - Dashboard admin toko
- `GET /kasir` - Dashboard kasir toko
- `GET /pelayan` - Dashboard pelayan toko
- `GET /register-manager` - Halaman pendaftaran akun MANAGER pertama (jika belum ada)

## Protected Routes (memerlukan otentikasi)

### Dashboard dan Role-based Pages
- `GET /manager` - Dashboard untuk MANAGER (mengelola semua toko, mengelola gudang, memantau distribusi ke semua toko)
- `GET /warehouse` - Dashboard untuk WAREHOUSE (fokus operasional gudang: pembelian, distribusi ke toko, melihat stok gudang)
- `GET /admin` - Dashboard untuk ADMIN (mengelola toko tertentu)
- `GET /kasir` - Dashboard untuk CASHIER (kasir toko)
- `GET /pelayan` - Dashboard untuk ATTENDANT (pelayan toko)

### Manager Routes (hanya untuk role MANAGER)
- `GET /manager/create-store` - Form pembuatan toko baru
- `GET /manager/stores/[id]` - Detail toko (belum dibuat)
- `GET /manager/edit-store/[id]` - Form edit toko (belum dibuat)
- `GET /manager/monitor-all` - Monitor semua toko, gudang, dan aliran produk (belum dibuat)

### Warehouse Routes (hanya untuk role WAREHOUSE)
- `GET /warehouse/purchase` - Pembuatan pembelian produk (belum dibuat)
- `GET /warehouse/distribution` - Distribusi produk ke toko (sudah dibuat, dengan pilihan pelayan berdasarkan nama atau kode)
- `GET /warehouse/stock` - Melihat stok gudang (belum dibuat)
- `GET /warehouse/history` - Riwayat distribusi (belum dibuat)

### Admin Routes (untuk role ADMIN)
- `GET /admin/users` - Manajemen user per toko

## API Routes

### Authentication API
- `POST /api/auth/update-store` - Update session dengan toko yang dipilih

### Manager Registration API
- `GET /api/check-manager` - Cek apakah akun MANAGER sudah ada
- `POST /api/register-manager` - Buat akun MANAGER pertama

### User Management API
- `GET /api/users` - Dapatkan semua user (hanya MANAGER dan ADMIN)
- `GET /api/users/[userId]/stores` - Dapatkan toko yang bisa diakses oleh user tertentu

### Store Management API (hanya MANAGER)
- `GET /api/stores` - Dapatkan semua toko
- `POST /api/stores` - Buat toko baru
- `GET /api/stores/[storeId]/users` - Dapatkan user yang diassign ke toko tertentu
- `POST /api/stores/users` - Assign user ke toko
- `DELETE /api/stores/users/[storeUserId]` - Remove user dari toko

### Products API (dengan RBAC)
- `GET /api/products` - Dapatkan produk (tergantung role dan akses toko)
- `POST /api/products` - Buat produk baru (tergantung role dan akses toko)

### Warehouse API (hanya untuk role WAREHOUSE dan MANAGER)
- `GET /api/warehouse/users` - Dapatkan user untuk warehouse (default: CASHIER dan ATTENDANT; query: role=untuk filter role spesifik)
- `POST /api/warehouse/users` - Buat user baru untuk warehouse
- `PUT /api/warehouse/users/[id]` - Update user warehouse
- `DELETE /api/warehouse/users` - Nonaktifkan user dari warehouse
- `GET /api/warehouse/stores` - Dapatkan toko untuk warehouse
- `POST /api/warehouse/distribution` - Buat distribusi produk ke toko
- `GET /api/warehouse/distribution` - Dapatkan data distribusi
- `PUT /api/warehouse/distribution/[id]` - Update status distribusi
- `DELETE /api/warehouse/distribution/[id]` - Hapus distribusi

## Role Access Levels

### MANAGER
- Akses: Semua toko, gudang pusat, dan fungsi sistem
- Fungsi: Mengelola toko, mengelola gudang, memantau distribusi produk ke semua toko
- Routes: `/manager`, `/api/stores`, `/api/users`, dll

### WAREHOUSE
- Akses: Fungsi gudang pusat
- Fungsi: Pembuatan pembelian, distribusi produk ke toko, melihat stok gudang, riwayat distribusi
- Routes: `/warehouse`, `/api/warehouse/*` (akan datang)

### ADMIN (per toko)
- Akses: Toko yang diassign + manajemen user toko
- Routes: `/admin`, `/admin/users`, API routes terkait toko

### CASHIER (per toko)
- Akses: Fungsi kasir di toko yang diassign
- Routes: `/kasir`, API transaksi

### ATTENDANT (per toko)
- Akses: Fungsi pelayan di toko yang diassign
- Routes: `/pelayan`, API terkait

## Middleware Protection

File `middleware-multi-tenant.js` menangani:
- Otentikasi pengguna
- Validasi role
- Validasi akses ke toko
- Redirect otomatis berdasarkan role