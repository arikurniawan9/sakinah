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

    // Query untuk mendapatkan produk berdasarkan toko
    let whereClause = {
      storeId: storeId,
    };

    // Tambahkan filter tanggal jika disediakan
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      whereClause.createdAt = {
        lte: new Date(endDate),
      };
    }

    // Ambil produk berdasarkan toko dan filter tanggal
    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        supplier: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Hitung total nilai inventaris
    const totalInventoryValue = products.reduce((sum, product) => sum + (product.stock * product.purchasePrice), 0);
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.stock <= 5).length;

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
        <title>Laporan Inventaris - ${store.name}</title>
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
          .summary-cards {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
          }
          .summary-card {
            flex: 1;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            text-align: center;
          }
          .summary-card h3 {
            margin: 0;
            font-size: 14px;
            color: #555;
          }
          .summary-card p {
            margin: 5px 0 0 0;
            font-size: 18px;
            font-weight: bold;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px;
            font-size: 12px;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 6px 4px; 
            text-align: left; 
            word-wrap: break-word;
            max-width: 150px;
          }
          th { 
            background-color: #f2f2f2; 
            white-space: nowrap;
          }
          .footer { 
            margin-top: 30px; 
            text-align: center; 
            font-size: 10px; 
            color: #666; 
          }
          .low-stock {
            background-color: #fff3cd !important;
            color: #856404;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Laporan Inventaris</h1>
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

        <div class="summary-cards">
          <div class="summary-card">
            <h3>Total Produk</h3>
            <p>${totalProducts}</p>
          </div>
          <div class="summary-card">
            <h3>Stok Rendah</h3>
            <p>${lowStockProducts}</p>
          </div>
          <div class="summary-card">
            <h3>Nilai Inventaris</h3>
            <p>${formatCurrency(totalInventoryValue)}</p>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Kode Produk</th>
              <th>Nama Produk</th>
              <th>Kategori</th>
              <th>Supplier</th>
              <th>Stok</th>
              <th>Harga Beli</th>
              <th>Harga Jual</th>
              <th>Nilai Stok</th>
              <th>Dibuat</th>
            </tr>
          </thead>
          <tbody>
    `;

    products.forEach((product, index) => {
      const stockValue = product.stock * product.purchasePrice;
      const isLowStock = product.stock <= 5;
      
      htmlContent += `
        <tr ${isLowStock ? 'class="low-stock"' : ''}>
          <td>${index + 1}</td>
          <td>${product.productCode}</td>
          <td>${product.name}</td>
          <td>${product.category?.name || '-'}</td>
          <td>${product.supplier?.name || '-'}</td>
          <td>${product.stock}</td>
          <td>${formatCurrency(product.purchasePrice)}</td>
          <td>${formatCurrency(product.retailPrice)}</td>
          <td>${formatCurrency(stockValue)}</td>
          <td>${formatDate(product.createdAt)}</td>
        </tr>
      `;
    });

    htmlContent += `
          </tbody>
        </table>
        
        <div class="footer">
          <p>Laporan Inventaris - Dicetak oleh: ${session.user.name}</p>
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
    console.error('Error generating inventory report:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}