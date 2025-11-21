const fs = require('fs');

// Fungsi untuk memperbaiki path import
function fixImportPath(filePath) {
  // Menentukan jumlah '../' berdasarkan lokasi file
  const pathParts = filePath.split('\\');
  const appIndex = pathParts.indexOf('app');
  
  if (appIndex === -1) {
    console.log(`Tidak bisa menentukan path untuk file: ${filePath}`);
    return;
  }
  
  // Hitung berapa banyak direktori dari 'app' ke file
  const depthFromApp = pathParts.length - appIndex - 1;
  let targetPath = '../../../components/UserThemeContext'; // Default untuk 2 direktori dari app
  
  // Sesuaikan berdasarkan kedalaman
  if (depthFromApp === 1) { // Contoh: app/admin/page.js
    targetPath = '../../components/UserThemeContext';
  } else if (depthFromApp === 2) { // Contoh: app/admin/kasir/page.js
    targetPath = '../../../components/UserThemeContext';
  } else if (depthFromApp === 3) { // Contoh: app/admin/kasir/transaksi/page.js
    targetPath = '../../../components/UserThemeContext';
  } else if (depthFromApp === 4) { // Contoh: app/admin/transaksi/pembelian/detail/[id]/page.js
    targetPath = '../../../../components/UserThemeContext';
  } else {
    // Untuk semua kasus lain, coba gunakan alias @
    targetPath = '@/components/UserThemeContext';
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Ganti semua kemungkinan import dengan path target
  content = content.replace(
    /import\s+{[^}]*useUserTheme[^}]*}\s+from\s+['"][^'"]*UserThemeContext['"];?/g,
    `import { useUserTheme } from '${targetPath}';`
  );
  
  fs.writeFileSync(filePath, content);
  console.log(`Perbaikan path untuk: ${filePath} -> ${targetPath}`);
}

const files = [
  'C:\\project\\toko-sakinah\\app\\admin\\produk\\page.js',
  'C:\\project\\toko-sakinah\\app\\admin\\profile\\page.js',
  'C:\\project\\toko-sakinah\\app\\admin\\supplier\\page.js',
  'C:\\project\\toko-sakinah\\app\\admin\\transaksi\\page.js',
  'C:\\project\\toko-sakinah\\app\\admin\\transaksi\\pembelian\\detail\\[id]\\page.js'
];

files.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    fixImportPath(filePath);
  } else {
    console.log(`File tidak ditemukan: ${filePath}`);
  }
});