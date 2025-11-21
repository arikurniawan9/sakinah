// app/api/reports/combined/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'MANAGER') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';
    const reportType = searchParams.get('type') || 'sales';

    // Tentukan rentang waktu berdasarkan timeRange
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '90d':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '365d':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    let reportData = {};

    if (reportType === 'sales') {
      // Ambil data penjualan keseluruhan
      const salesData = await prisma.sale.groupBy({
        by: ['storeId'],
        where: {
          date: {
            gte: startDate
          }
        },
        _sum: {
          total: true
        },
        _count: {
          id: true
        }
      });

      // Ambil data penjualan harian untuk grafik
      const dailySales = await prisma.sale.groupBy({
        by: ['date'],
        where: {
          date: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
          }
        },
        _sum: {
          total: true
        },
        _count: {
          id: true
        }
      });

      // Ambil toko untuk nama
      const stores = await prisma.store.findMany({
        where: {
          status: 'ACTIVE'
        }
      });

      // Gabungkan data
      const storeSalesData = salesData.map(sale => {
        const store = stores.find(s => s.id === sale.storeId);
        return {
          storeId: sale.storeId,
          storeName: store ? store.name : 'Toko Tidak Dikenal',
          totalSales: sale._count.id,
          totalRevenue: sale._sum.total
        };
      });

      reportData = {
        globalStats: {
          totalRevenue: salesData.reduce((sum, sale) => sum + (sale._sum.total || 0), 0),
          totalSales: salesData.reduce((sum, sale) => sum + sale._count.id, 0),
          activeStores: stores.length
        },
        salesData: dailySales.map(day => ({
          date: day.date.toISOString().split('T')[0],
          sales: day._count.id,
          revenue: day._sum.total
        })),
        storePerformance: storeSalesData
      };
    } else if (reportType === 'inventory') {
      // Data inventaris
      const totalProducts = await prisma.product.count();
      const lowStockProducts = await prisma.product.count({
        where: {
          stock: { lte: 5 }
        }
      });
      const outOfStockProducts = await prisma.product.count({
        where: {
          stock: 0
        }
      });

      reportData = {
        globalStats: {
          totalProducts,
          lowStockProducts,
          outOfStockProducts,
          totalStores: await prisma.store.count()
        },
        inventoryData: [] // Nanti bisa ditambahkan data detail inventaris
      };
    } else if (reportType === 'financial') {
      // Data keuangan
      const salesTotal = await prisma.sale.aggregate({
        where: {
          date: {
            gte: startDate
          }
        },
        _sum: {
          total: true
        }
      });

      const expensesTotal = await prisma.expense.aggregate({
        where: {
          date: {
            gte: startDate
          }
        },
        _sum: {
          amount: true
        }
      });

      reportData = {
        globalStats: {
          totalRevenue: salesTotal._sum.total || 0,
          totalExpenses: expensesTotal._sum.amount || 0,
          netProfit: (salesTotal._sum.total || 0) - (expensesTotal._sum.amount || 0)
        },
        financialData: [] // Nanti bisa ditambahkan data detail keuangan
      };
    }

    return new Response(JSON.stringify(reportData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching combined reports:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}