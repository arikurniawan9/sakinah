import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== ROLES.MANAGER && session.user.role !== ROLES.ADMIN)) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!storeId) {
      return new Response(
        JSON.stringify({ error: 'Store ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Ambil informasi toko
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return new Response(
        JSON.stringify({ error: 'Store not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Query untuk mendapatkan data berdasarkan toko dan rentang tanggal
    let whereClause = {
      storeId: storeId,
    };

    // Tambahkan filter tanggal jika disediakan
    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      whereClause.date = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      whereClause.date = {
        lte: new Date(endDate),
      };
    }

    // Ambil data-data yang diperlukan untuk ringkasan
    const sales = await prisma.sale.findMany({
      where: whereClause,
      include: {
        saleDetails: true,
      },
    });

    const products = await prisma.product.findMany({
      where: { storeId: storeId },
    });

    const expenses = await prisma.expense.findMany({
      where: whereClause,
    });

    // Hitung statistik
    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalTransactions = sales.length;
    const totalItemsSold = sales.reduce((sum, sale) => {
      return sum + sale.saleDetails.reduce((detailSum, detail) => detailSum + detail.quantity, 0);
    }, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalProducts = products.length;
    const totalInventoryValue = products.reduce((sum, product) => sum + (product.stock * product.purchasePrice), 0);

    // Format data untuk ditampilkan dalam HTML
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(amount);
    };

    // Buat HTML untuk laporan
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Ringkasan Laporan - ${store.name}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 1cm;
          }
          body { 
            font-family: Arial, sans-serif; 
            margin: 0;
            padding: 1cm;
            box-sizing: border-box;
          }
          .header { text-align: center; margin-bottom: 20px; }
          .store-info { margin-bottom: 20px; }
          .summary-section {
            margin-bottom: 30px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }
          .summary-card {
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 8px;
            text-align: center;
            background-color: #f9f9f9;
          }
          .summary-card h3 {
            margin: 0;
            font-size: 14px;
            color: #555;
          }
          .summary-card p {
            margin: 10px 0 0 0;
            font-size: 24px;
            font-weight: bold;
            color: #333;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            margin: 20px 0 10px 0;
            padding-bottom: 5px;
            border-bottom: 2px solid #333;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 10px;
            font-size: 12px;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 8px 6px; 
            text-align: left; 
          }
          th { 
            background-color: #f2f2f2; 
          }
          .footer { 
            margin-top: 30px; 
            text-align: center; 
            font-size: 10px; 
            color: #666; 
          }
          @media print {
            body { -webkit-print-color-adjust: exact; color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Ringkasan Laporan</h1>
          <div class="store-info">
            <h2>${store.name}</h2>
            <p>${store.address || ''}</p>
            <p>Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <h3>Total Penjualan</h3>
            <p>${formatCurrency(totalSales)}</p>
          </div>
          <div class="summary-card">
            <h3>Total Transaksi</h3>
            <p>${totalTransactions}</p>
          </div>
          <div class="summary-card">
            <h3>Total Item Terjual</h3>
            <p>${totalItemsSold}</p>
          </div>
          <div class="summary-card">
            <h3>Total Pengeluaran</h3>
            <p>${formatCurrency(totalExpenses)}</p>
          </div>
          <div class="summary-card">
            <h3>Total Produk</h3>
            <p>${totalProducts}</p>
          </div>
          <div class="summary-card">
            <h3>Nilai Inventaris</h3>
            <p>${formatCurrency(totalInventoryValue)}</p>
          </div>
        </div>

        <div class="summary-section">
          <div class="section-title">Daftar Penjualan Terbaru</div>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>No Invoice</th>
                <th>Tanggal</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
    `;

    // Tambahkan data penjualan terbaru
    sales.slice(0, 10).forEach((sale, index) => {
      htmlContent += `
        <tr>
          <td>${index + 1}</td>
          <td>${sale.invoiceNumber}</td>
          <td>${formatDate(sale.date)}</td>
          <td>${formatCurrency(sale.total)}</td>
          <td>${sale.status}</td>
        </tr>
      `;
    });

    if (sales.length === 0) {
      htmlContent += `
        <tr>
          <td colspan="5" style="text-align: center;">Tidak ada data penjualan</td>
        </tr>
      `;
    }

    htmlContent += `
            </tbody>
          </table>
        </div>

        <div class="summary-section">
          <div class="section-title">Produk dengan Stok Rendah</div>
          <table>
            <thead>
              <tr>
                <th>Nama Produk</th>
                <th>Kode Produk</th>
                <th>Stok</th>
                <th>Kategori</th>
              </tr>
            </thead>
            <tbody>
    `;

    // Tambahkan produk dengan stok rendah
    const lowStockProducts = products.filter(p => p.stock <= 5).slice(0, 10);
    if (lowStockProducts.length > 0) {
      lowStockProducts.forEach(product => {
        htmlContent += `
          <tr>
            <td>${product.name}</td>
            <td>${product.productCode}</td>
            <td>${product.stock}</td>
            <td>${product.category?.name || '-'}</td>
          </tr>
        `;
      });
    } else {
      htmlContent += `
        <tr>
          <td colspan="4" style="text-align: center;">Tidak ada produk dengan stok rendah</td>
        </tr>
      `;
    }

    htmlContent += `
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          <p>Ringkasan Laporan - Dicetak oleh: ${session.user.name}</p>
        </div>
      </body>
      </html>
    `;

    return new Response(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error generating summary report:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}