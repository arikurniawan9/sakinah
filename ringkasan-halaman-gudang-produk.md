# Ringkasan Halaman Gudang Produk

## Gambaran Umum
Halaman gudang produk (`/warehouse/products`) adalah bagian penting dari sistem Toko Sakinah yang digunakan oleh role WAREHOUSE untuk mengelola master data produk gudang. Halaman ini menyediakan fungsionalitas lengkap untuk CRUD (Create, Read, Update, Delete) produk gudang serta fitur tambahan seperti import/export data.

## Fungsionalitas Utama

### 1. Tabel Produk Gudang
- Menampilkan daftar semua produk yang disimpan di gudang master
- Kolom yang ditampilkan: Kode Produk, Nama Produk, Stok, Harga Beli, Harga Umum, Harga Silver/Gold/Platinum, Kategori, Supplier
- Fitur pagination untuk menavigasi data dalam jumlah besar
- Fitur pencarian untuk menemukan produk tertentu
- Fitur filter untuk mengelola data

### 2. CRUD Produk
- **Create**: Menambahkan produk baru ke gudang master
- **Read**: Menampilkan daftar produk dengan pagination dan pencarian
- **Update**: Mengedit informasi produk yang sudah ada
- **Delete**: Menghapus produk dari gudang master (dengan konfirmasi)

### 3. Import/Export Data
- **Import**: Mendukung import produk dari file Excel (.xlsx, .xls) atau CSV (.csv)
- **Export**: Mengekspor data produk dalam format Excel, CSV, atau PDF
- **Template**: Tersedia template untuk import produk gudang

### 4. Manajemen Massal
- Pemilihan baris ganda untuk operasi massal
- Hapus produk secara massal
- Seleksi semua/none

### 5. Manajemen Kategori dan Supplier
- Integrasi dengan sistem kategori dan supplier gudang
- Form untuk memilih kategori dan supplier saat membuat/edit produk

## Arsitektur dan Teknologi

### Frontend
- **Framework**: Next.js 14 dengan App Router
- **State Management**: React hooks dan custom hooks
- **Komponen UI**: DataTable, Modal, ConfirmationModal, Tooltip
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

### Backend API
- **Endpoint**: `/api/warehouse/products`
- **Method**: GET (daftar), POST (buat), PUT (update), DELETE (hapus)
- **Validasi**: Server-side validation dan sanitasi input
- **Keamanan**: Otentikasi dan otorisasi berdasarkan role

### Database
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Struktur**: Produk disimpan di store virtual dengan ID khusus (`WAREHOUSE_MASTER_STORE`)

## Custom Hooks yang Digunakan
- `useWarehouseProductTable`: Mengelola state tabel produk gudang
- `useWarehouseProductForm`: Mengelola form produk gudang (create/edit)
- `useTableSelection`: Mengelola pemilihan baris ganda
- `useCachedCategories`: Mengelola data kategori (cached)
- `useCachedSuppliers`: Mengelola data supplier (cached)

## Fitur-fitur Canggih
- **Caching**: Menggunakan Redis (dengan fallback ke memory cache)
- **Audit Logging**: Semua perubahan dicatat di audit log
- **Validasi Input**: Validasi terhadap SQL injection dan XSS
- **Debouncing**: Pencarian real-time dengan debouncing
- **Notifikasi**: Menggunakan react-toastify untuk feedback pengguna

## Sistem Keamanan
- **Role-based Access Control**: Hanya role WAREHOUSE yang dapat mengakses
- **Validasi Session**: Menggunakan NextAuth.js untuk otentikasi
- **Validasi Store**: Produk hanya dapat diakses oleh pengguna dengan akses ke store terkait
- **Sanitasi Input**: Perlindungan terhadap XSS dan injeksi SQL

## Workflow Operasional
1. **Pengguna dengan role WAREHOUSE** login ke sistem
2. Navigasi ke `/warehouse/products`
3. Dapat melihat daftar produk gudang
4. Dapat melakukan pencarian/filter
5. Dapat menambahkan produk baru atau mengedit produk yang ada
6. Dapat menghapus produk (dengan konfirmasi)
7. Dapat melakukan import/export data produk

## Manfaat Bisnis
- **Efisiensi**: Memungkinkan manajemen produk gudang secara terpusat
- **Akurasi**: Mengurangi kesalahan input data melalui sistem import/export
- **Skalabilitas**: Mendukung pengelolaan ribuan produk dengan pagination
- **Integrasi**: Terintegrasi dengan sistem kategori dan supplier gudang
- **Pelaporan**: Menyediakan data produk untuk laporan dan analitik

## Kesimpulan
Halaman gudang produk adalah komponen kritis dalam sistem Toko Sakinah yang memungkinkan manajemen produk secara terpusat dan efisien. Dengan fitur-fitur canggih seperti import/export, manajemen massal, dan sistem keamanan yang kuat, halaman ini memberikan solusi komprehensif untuk manajemen inventaris gudang dalam sistem multi-tenant.