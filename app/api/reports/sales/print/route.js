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
        <title>Laporan Penjualan - ${store.name}</title>
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
          .sale-details-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 5px;
            font-size: 10px;
          }
          .sale-details-table th, .sale-details-table td {
            border: 1px solid #eee;
            padding: 4px;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Laporan Penjualan</h1>
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
              <th>Pembayaran</th>
              <th>Kembalian</th>
              <th>Detail Penjualan</th>
            </tr>
          </thead>
          <tbody>
    `;

    sales.forEach((sale, index) => {
      // Buat tabel untuk detail penjualan
      let detailsHtml = '<table class="sale-details-table"><thead><tr><th>Produk</th><th>Jumlah</th><th>Harga</th><th>Subtotal</th></tr></thead><tbody>';
      sale.saleDetails.forEach(detail => {
        detailsHtml += `
          <tr>
            <td>${detail.product.name}</td>
            <td>${detail.quantity}</td>
            <td>${formatCurrency(detail.price)}</td>
            <td>${formatCurrency(detail.subtotal)}</td>
          </tr>
        `;
      });
      detailsHtml += '</tbody></table>';

      htmlContent += `
        <tr>
          <td>${index + 1}</td>
          <td>${sale.invoiceNumber}</td>
          <td>${formatDate(sale.date)}</td>
          <td>${sale.cashier?.name || '-'}</td>
          <td>${sale.attendant?.name || '-'}</td>
          <td>${sale.member?.name || '-'}</td>
          <td>${formatCurrency(sale.total)}</td>
          <td>${formatCurrency(sale.payment)}</td>
          <td>${formatCurrency(sale.change)}</td>
          <td>${detailsHtml}</td>
        </tr>
      `;
    });

    htmlContent += `
          </tbody>
        </table>
        
        <div class="footer">
          <p>Laporan Penjualan - Dicetak oleh: ${session.user.name}</p>
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
    console.error('Error generating sales report:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}