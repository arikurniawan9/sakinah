// utils/categoryImportTemplate.js
import * as XLSX from 'xlsx';

// Fungsi untuk menghasilkan template Excel untuk import kategori
export const generateCategoryImportTemplate = () => {
  // Data contoh untuk template
  const templateData = [
    {
      'Nama Kategori': 'Pakaian Pria',
      'Deskripsi': 'Koleksi pakaian untuk pria dewasa',
    },
    {
      'Nama Kategori': 'Pakaian Wanita',
      'Deskripsi': 'Koleksi pakaian untuk wanita dewasa',
    },
    {
      'Nama Kategori': 'Aksesori',
      'Deskripsi': 'Aneka aksesori pelengkap',
    }
  ];

  // Membuat worksheet
  const ws = XLSX.utils.json_to_sheet(templateData);
  
  // Mengatur lebar kolom
  ws['!cols'] = [
    { wch: 20 }, // Lebar kolom Nama Kategori
    { wch: 40 }, // Lebar kolom Deskripsi
  ];

  // Membuat workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Kategori');

  // Menyimpan file
  XLSX.writeFile(wb, 'template_import_kategori.xlsx');
};

export default generateCategoryImportTemplate;