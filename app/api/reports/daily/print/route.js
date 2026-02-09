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

    // Query untuk mendapatkan penjualan berdasarkan toko dan rentang tanggal
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

    // Ambil penjualan berdasarkan toko dan filter tanggal
    const sales = await prisma.sale.findMany({
      where: whereClause,
      include: {
        cashier: true,
        attendant: true,
        member: true,
        saleDetails: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Hitung total penjualan
    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalTransactions = sales.length;
    const totalItemsSold = sales.reduce((sum, sale) => {
      return sum + sale.saleDetails.reduce((detailSum, detail) => detailSum + detail.quantity, 0);
    }, 0);

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
        <title>Laporan Harian - ${store.name}</title>
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
          @media print {
            body { -webkit-print-color-adjust: exact; color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Laporan Harian</h1>
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
            <h3>Total Transaksi</h3>
            <p>${totalTransactions}</p>
          </div>
          <div class="summary-card">
            <h3>Total Item Terjual</h3>
            <p>${totalItemsSold}</p>
          </div>
          <div class="summary-card">
            <h3>Total Penjualan</h3>
            <p>${formatCurrency(totalSales)}</p>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>No Invoice</th>
              <th>Tanggal</th>
              <th>Kasir</th>
              <th>Pelayan</th>
              <th>Member</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
    `;

    sales.forEach((sale, index) => {
      htmlContent += `
        <tr>
          <td>${index + 1}</td>
          <td>${sale.invoiceNumber}</td>
          <td>${formatDate(sale.date)}</td>
          <td>${sale.cashier?.name || '-'}</td>
          <td>${sale.attendant?.name || '-'}</td>
          <td>${sale.member?.name || '-'}</td>
          <td>${formatCurrency(sale.total)}</td>
          <td>${sale.status}</td>
        </tr>
      `;
    });

    htmlContent += `
          </tbody>
        </table>
        
        <div class="footer">
          <p>Laporan Harian - Dicetak oleh: ${session.user.name}</p>
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
    console.error('Error generating daily report:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}