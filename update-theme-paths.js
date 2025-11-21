const fs = require('fs');
const path = require('path');

// Fungsi untuk memperbarui file
function updateFile(filePath, newImportPath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Ganti import
  content = content.replace(
    /import\s+{[^}]*useUserTheme[^}]*}\s+from\s+['"][^'"]*UserThemeContext['"];?/g,
    `import { useUserTheme } from '${newImportPath}';`
  );
  
  // Tulis kembali file
  fs.writeFileSync(filePath, content);
  console.log(`File diperbarui: ${filePath}`);
}

// Daftar file dan path yang sesuai
const filesToUpdate = [
  {
    path: 'C:\\project\\toko-sakinah\\app\\admin\\laporan\\cetak-pengeluaran\\page.js',
    importPath: '../../../components/UserThemeContext'
  },
  {
    path: 'C:\\project\\toko-sakinah\\app\\admin\\laporan\\labarugi\\page.js',
    importPath: '../../../components/UserThemeContext'
  },
  {
    path: 'C:\\project\\toko-sakinah\\app\\admin\\laporan\\page.js',
    importPath: '../../../components/UserThemeContext'
  },
  {
    path: 'C:\\project\\toko-sakinah\\app\\admin\\laporan\\piutang\\page.js',
    importPath: '../../../components/UserThemeContext'
  },
  {
    path: 'C:\\project\\toko-sakinah\\app\\admin\\member\\[id]\\page.js',
    importPath: '../../../../components/UserThemeContext'
  }
];

// Jalankan untuk semua file
filesToUpdate.forEach(fileInfo => {
  if (fs.existsSync(fileInfo.path)) {
    updateFile(fileInfo.path, fileInfo.importPath);
  } else {
    console.log(`File tidak ditemukan: ${fileInfo.path}`);
  }
});