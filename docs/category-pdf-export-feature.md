# Fitur Export PDF Kategori dengan Kop Laporan

## Ringkasan Perubahan
Menambahkan fitur export PDF untuk data kategori dengan kop laporan yang menampilkan nama dan alamat toko.

## File yang Ditambahkan
- `app/api/kategori/export-pdf/route.js` - API endpoint untuk mendapatkan data untuk export PDF
- `utils/exportCategoryPDF.js` - Fungsi untuk membuat PDF dengan jsPDF

## File yang Dimodifikasi
- `app/api/kategori/route.js` - Memperbaiki logika export untuk menghilangkan kolom ikon
- `app/admin/kategori/page.js` - Menambahkan fungsi export PDF dan tombolnya
- `components/datatables/DataTable.js` - (harus ditambahkan: tombol export PDF)

## Fitur Utama
1. **Export PDF Kategori** - Kemampuan untuk membuat laporan PDF dari data kategori
2. **Kop Laporan** - Informasi toko (nama, alamat, telepon) ditampilkan di bagian atas laporan
3. **Format Tabel** - Tabel dengan kolom: No, Nama Kategori, Deskripsi, Tanggal Dibuat
4. **Tema Responsif** - Mendukung mode gelap/terang untuk tampilan PDF

## Implementasi
- API endpoint `/api/kategori/export-pdf` untuk mendapatkan data termasuk informasi toko
- Fungsi `exportCategoryPDF` menggunakan jsPDF dan plugin autotable
- Tombol export PDF ditambahkan di toolbar halaman kategori admin
- PDF mencakup nama toko, alamat, dan informasi kontak di kop laporan

## Kolom dalam PDF
- No
- Nama Kategori
- Deskripsi
- Tanggal Dibuat

## Teknologi
- jsPDF
- jsPDF-AutoTable plugin
- Next.js API Routes
- React Hooks

## Catatan
- PDF hanya bisa diexport oleh user dengan role ADMIN
- Export PDF menyesuaikan tema gelap/terang yang aktif
- File PDF disimpan dengan nama format: "Laporan_Kategori_[tanggal].pdf"