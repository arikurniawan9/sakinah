# Penghapusan Fitur Ikon Kategori

## Ringkasan Perubahan
Fitur pilihan ikon pada komponen kategori telah dihapus dari aplikasi Toko Sakinah sesuai permintaan.

## File yang Diubah

### Backend (API)
- `app/api/kategori/route.js` - Menghapus referensi ikon dari skema Zod, fungsi POST, PUT, dan GET
- `app/api/kategori/import/route.js` - Menghapus referensi ikon dari skema dan proses import

### Frontend (Komponen)
- `components/kategori/CategoryModal.js` - Menghapus komponen IconPicker
- `components/kategori/KategoriDetailModal.js` - Menghapus tampilan ikon
- `components/kategori/CategoryCard.js` - Mengganti ikon dinamis dengan ikon default
- `components/kategori/ImportModal.js` - Menghapus referensi kolom ikon dari import
- `components/kategori/IconPicker.js` - File dihapus karena tidak digunakan lagi

### Database
- `prisma/schema.prisma` - Kolom `icon` dihapus dari model `Category`
- `prisma/migrations/20251121145000_remove_icon_from_category/migration.sql` - File migrasi database

## Efek Perubahan
1. Formulir tambah/edit kategori tidak lagi menampilkan pilihan ikon
2. Detail kategori tidak lagi menampilkan informasi ikon
3. Tampilan kartu kategori menggunakan ikon default (Package)
4. Proses import kategori tidak lagi memproses kolom ikon
5. Struktur database Category tidak lagi memiliki kolom icon

## Migrasi Database
Untuk menerapkan perubahan struktur database:
```bash
npx prisma migrate dev --name remove-icon-from-category
```

## Catatan
Perubahan ini tidak mempengaruhi fungsionalitas utama kategori, hanya menghapus fitur pilihan ikon. Semua data kategori lainnya tetap terjaga.