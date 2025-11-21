# Fitur Template Import dan Konfirmasi Duplikat Kategori

## Ringkasan Perubahan
Menambahkan template Excel untuk import data kategori dan fitur konfirmasi ketika ditemukan data duplikat dengan notifikasi "data sudah ada mau di timpah ?"

## File yang Ditambahkan
- `utils/categoryImportTemplate.js` - Fungsi untuk menghasilkan template Excel import kategori
- `components/kategori/DuplicateCategoryConfirmationModal.js` - Modal konfirmasi untuk data kategori duplikat
- `app/api/kategori/check-duplicates/route.js` - API endpoint untuk memeriksa data duplikat

## File yang Dimodifikasi
- `components/kategori/ImportModal.js` - Menambahkan tombol download template dan logika konfirmasi duplikat

## Fitur Utama
1. **Template Excel Import** - Tombol untuk mengunduh template Excel dengan format yang benar
2. **Pemeriksaan Duplikat** - API untuk memeriksa apakah kategori yang akan diimport sudah ada
3. **Modal Konfirmasi** - Tampilan modal saat ditemukan kategori duplikat untuk konfirmasi overwrite
4. **UX yang Lebih Baik** - Antarmuka yang lebih jelas dan mudah digunakan

## Implementasi
- Menambahkan tombol "Unduh Template" di modal import
- Template berisi contoh data dan struktur kolom yang benar
- Sebelum import, sistem memeriksa apakah nama kategori sudah ada
- Jika ditemukan duplikat, sistem menampilkan modal konfirmasi
- User bisa memilih untuk melanjutkan (overwrite) atau membatalkan import

## API Endpoints
- `POST /api/kategori/check-duplicates` - Memeriksa nama kategori yang duplikat di toko user saat ini

## Teknologi
- Next.js App Router
- React Hooks
- Prisma ORM
- XLSX Library
- Tailwind CSS

## Catatan
- Template Excel berisi contoh data untuk memudahkan pengguna
- Fitur hanya tersedia untuk user dengan role ADMIN
- Konfirmasi duplikat hanya mengecek kategori dalam toko yang sama