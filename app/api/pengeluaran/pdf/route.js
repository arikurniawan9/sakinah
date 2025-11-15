// app/api/pengeluaran/pdf/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

// Helper function to format currency in Indonesian format
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

// Helper function to format date in Indonesian format
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || '';

    // Build where condition for filtering
    const whereCondition = {
      AND: [
        // Search condition
        search ? {
          OR: [
            { description: { contains: search, mode: 'insensitive' } },
            { category: { name: { contains: search, mode: 'insensitive' } } },
            { user: { name: { contains: search, mode: 'insensitive' } } },
          ]
        } : {},
        
        // Date range condition
        startDate && endDate ? {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        } : startDate ? {
          date: { gte: new Date(startDate) }
        } : endDate ? {
          date: { lte: new Date(endDate) }
        } : {},
        
        // Category filter
        categoryId ? {
          expenseCategoryId: categoryId
        } : {}
      ]
    };

    // Get all expenses with related data
    const expenses = await prisma.expense.findMany({
      where: whereCondition,
      include: {
        category: {
          select: {
            name: true
          }
        },
        user: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Generate HTML content for PDF
    const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Laporan Pengeluaran</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 40px;
      background-color: white;
      color: #333;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #3c8dbc;
      padding-bottom: 20px;
    }
    .header h1 {
      font-size: 28px;
      margin-bottom: 8px;
      color: #333;
    }
    .header .subtitle {
      font-size: 16px;
      color: #666;
      margin-bottom: 5px;
    }
    .period {
      font-size: 14px;
      color: #888;
      margin-bottom: 15px;
    }
    .summary-box {
      background-color: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      border: 1px solid #dee2e6;
      padding: 12px 15px;
      text-align: left;
    }
    th {
      background-color: #e9ecef;
      font-weight: bold;
      color: #495057;
      text-align: center;
    }
    .text-center {
      text-align: center;
    }
    .text-right {
      text-align: right;
    }
    .amount-cell {
      font-weight: 600;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 12px;
      color: #6c757d;
    }
    .total-row {
      background-color: #e9ecef;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>LAPORAN PENGELUARAN</h1>
    <div class="subtitle">Toko SAKINAH</div>
    <div class="period">Periode: ${startDate && endDate
      ? `${formatDate(startDate)} - ${formatDate(endDate)}`
      : startDate
        ? `Mulai dari: ${formatDate(startDate)}`
        : endDate
          ? `Sampai dengan: ${formatDate(endDate)}`
          : 'Semua Tanggal'}
    </div>
  </div>

  <div class="summary-box">
    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
      <span>Total Pengeluaran:</span>
      <span>${expenses.length} item</span>
    </div>
    <div style="display: flex; justify-content: space-between; border-top: 1px solid #adb5bd; padding-top: 8px; margin-top: 8px; font-weight: bold;">
      <span>Total Jumlah:</span>
      <span>${formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0))}</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th class="text-center">No</th>
        <th>Nama Kategori</th>
        <th>Deskripsi</th>
        <th class="text-center">Tanggal</th>
        <th class="text-right">Jumlah</th>
        <th>Dibuat Oleh</th>
      </tr>
    </thead>
    <tbody>
      ${expenses.map((expense, index) => `
        <tr>
          <td class="text-center">${index + 1}</td>
          <td>${expense.category?.name || 'N/A'}</td>
          <td>${expense.description || 'N/A'}</td>
          <td class="text-center">${formatDate(expense.date)}</td>
          <td class="text-right amount-cell">${formatCurrency(expense.amount)}</td>
          <td>${expense.user?.name || 'N/A'}</td>
        </tr>
      `).join('')}
      <tr class="total-row">
        <td colspan="4" class="text-right"><strong>TOTAL KESELURUHAN</strong></td>
        <td class="text-right"><strong>${formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0))}</strong></td>
        <td></td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <p>Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
    <p>Laporan Pengeluaran - Toko SAKINAH</p>
  </div>
</body>
</html>
    `;

    // Return HTML as attachment for PDF conversion
    // In a real implementation, you would use a library like puppeteer to convert to PDF
    // For now, we return the HTML which can be converted to PDF by the frontend or another service

    return new Response(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="laporan_pengeluaran_${new Date().toISOString().slice(0, 10)}.html"`,
      },
    });

  } catch (error) {
    console.error('Error generating expense report:', error);
    return NextResponse.json(
      { error: 'Gagal membuat laporan pengeluaran: ' + error.message },
      { status: 500 }
    );
  }
}