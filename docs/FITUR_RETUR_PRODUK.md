# Fitur Retur Produk

Fitur retur produk adalah sistem yang memungkinkan administrator untuk mengelola dan memproses permintaan retur produk dari pelanggan. Fitur ini dirancang untuk membantu dalam mengidentifikasi masalah operasional dan meningkatkan kualitas layanan pelayan.

## Komponen Utama

### 1. Manajemen Retur Produk (`/admin/retur-produk`)
- Tampilan daftar semua permintaan retur produk
- Filter dan pencarian berdasarkan berbagai kriteria
- Statistik ringkasan retur produk
- Tautan ke halaman detail retur

### 2. Formulir Tambah Retur (`/admin/retur-produk/tambah`)
- Formulir untuk membuat permintaan retur produk baru
- Input untuk informasi transaksi, produk, pelanggan, dan pelayan
- Pemilihan kategori retur (kesalahan pelayan, produk cacat, dll.)

### 3. Detail Retur (`/admin/retur-produk/[id]`)
- Tampilan informasi lengkap tentang permintaan retur
- Informasi produk, pelanggan, dan pelayan terkait
- Opsi untuk menyetujui atau menolak retur
- Riwayat status retur

### 4. Laporan Retur Produk (`/admin/laporan/retur-produk`)
- Ringkasan statistik retur produk
- Grafik distribusi berdasarkan kategori
- Tren bulanan jumlah retur
- Analisis kinerja pelayan berdasarkan retur

### 5. Notifikasi Retur (`/admin/notifikasi-retur`)
- Daftar permintaan retur yang menunggu persetujuan
- Filter berdasarkan status dan prioritas
- Tautan cepat untuk meninjau dan menindaklanjuti retur

### 6. Pengaturan Kebijakan Retur (`/admin/pengaturan/retur`)
- Konfigurasi parameter retur produk
- Pengaturan periode retur, biaya restok, dll.
- Pengaturan notifikasi

## Kategori Retur Produk

1. **Kesalahan Pelayan** (`ERROR_BY_ATTENDANT`): Retur karena kesalahan yang dilakukan oleh pelayan saat melayani pelanggan
2. **Produk Cacat** (`PRODUCT_DEFECT`): Retur karena produk yang diterima cacat atau rusak
3. **Salah Pilih** (`WRONG_SELECTION`): Retur karena pelanggan salah memilih produk
4. **Lainnya** (`OTHERS`): Kategori umum untuk retur dengan alasan lain

## Dampak terhadap Kinerja Pelayan

Sistem ini dirancang untuk membedakan antara retur yang disebabkan oleh kesalahan pelayan dan faktor lain. Hanya retur dengan kategori "Kesalahan Pelayan" yang akan mempengaruhi penilaian kinerja pelayan.

## Integrasi dengan Sistem Lain

- Terintegrasi dengan sistem transaksi untuk menghubungkan retur dengan transaksi asli
- Terintegrasi dengan sistem pengguna untuk mengidentifikasi pelayan yang bersangkutan
- Terintegrasi dengan sistem notifikasi untuk memberi tahu administrator tentang retur baru

## Panduan Penggunaan

1. Administrator dapat mengakses fitur retur produk melalui menu "Retur Produk" di sidebar admin
2. Untuk membuat retur baru, klik tombol "Tambah Retur Baru"
3. Untuk meninjau retur yang masuk, gunakan halaman daftar retur
4. Gunakan laporan retur untuk analisis tren dan kinerja
5. Atur kebijakan retur melalui halaman pengaturan

## Catatan Teknis

- Model database: `ReturnProduct` (terdefinisi di `prisma/schema.prisma`)
- File migrasi: `20260131120000_add_return_product_table/migration.sql`
- Semua komponen menggunakan sistem tema gelap/cerah yang konsisten
- Menggunakan komponen UI yang sudah ada di sistem