// utils/exportCategoryPDF.js

// Fungsi untuk menghasilkan laporan kategori (fallback HTML untuk dicetak)
export const exportCategoryPDF = async (darkMode = false) => {
  try {
    // Ambil data dari API
    const response = await fetch('/api/kategori/export-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Gagal mengambil data untuk laporan');
    }

    const { shopInfo, categories, exportDate } = await response.json();

    // Buat konten HTML untuk laporan
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Kategori - ${shopInfo.name || 'Toko'}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; ${darkMode ? 'background-color: #1f2937; color: white;' : ''}}
          .header { text-align: center; margin-bottom: 20px; }
          .shop-info { margin-bottom: 15px; }
          .category-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .category-table th, .category-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .category-table th { background-color: ${darkMode ? '#4b5563' : '#e5e7eb'}; color: ${darkMode ? 'white' : 'black'}; }
          .footer { margin-top: 20px; text-align: right; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Laporan Kategori</h1>
          <h2>${shopInfo.name || 'Nama Toko'}</h2>
        </div>
        <div class="shop-info">
          <p><strong>Alamat:</strong> ${shopInfo.address || '-'}</p>
          <p><strong>Telepon:</strong> ${shopInfo.phone || '-'}</p>
          <p><strong>Tanggal Cetak:</strong> ${exportDate}</p>
        </div>
        <table class="category-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Kategori</th>
              <th>Deskripsi</th>
              <th>Tanggal Dibuat</th>
            </tr>
          </thead>
          <tbody>
    `;

    if (categories && categories.length > 0) {
      categories.forEach((cat, index) => {
        htmlContent += `
          <tr>
            <td>${cat.no}</td>
            <td>${cat.name}</td>
            <td>${cat.description}</td>
            <td>${cat.createdAt}</td>
          </tr>
        `;
      });
    } else {
      htmlContent += `
        <tr>
          <td colspan="4" style="text-align: center;">Tidak ada data kategori untuk ditampilkan</td>
        </tr>
      `;
    }

    htmlContent += `
          </tbody>
        </table>
        <div class="footer">
          Dicetak pada ${new Date().toLocaleString('id-ID')}
        </div>
        <script>
          window.print();
          window.onafterprint = function() {
            window.close();
          };
        </script>
      </body>
      </html>
    `;

    // Buka jendela baru dengan konten HTML
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } catch (error) {
    console.error('Error saat membuat laporan:', error);
    throw error;
  }
};

export default exportCategoryPDF;