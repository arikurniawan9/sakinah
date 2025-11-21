# Instalasi Dependensi untuk Export PDF

## Dependensi yang Diperlukan

Untuk fitur export PDF kategori berfungsi dengan baik, Anda perlu menginstall dependensi berikut:

```bash
npm install jspdf jspdf-autotable
```

atau

```bash
yarn add jspdf jspdf-autotable
```

atau

```bash
pnpm add jspdf jspdf-autotable
```

## Deskripsi

- `jspdf`: Library untuk membuat dan mengelola dokumen PDF di sisi klien
- `jspdf-autotable`: Plugin untuk jsPDF yang memungkinkan pembuatan tabel dalam PDF dengan mudah

## Catatan Teknis

- Kedua library ini hanya berfungsi di lingkungan browser (sisi klien)
- Oleh karena itu, implementasi menggunakan dynamic import untuk menghindari masalah SSR (Server Side Rendering)
- Fungsi `exportCategoryPDF` hanya akan berjalan ketika dijalankan di browser, bukan di server

## Fungsi yang Terpengaruh

- `utils/exportCategoryPDF.js`
- Tombol export PDF di halaman `/admin/kategori` dan `/kasir/kategori`

## Integrasi

Setelah instalasi, fungsi export PDF akan otomatis tersedia di toolbar halaman kategori masing-masing.