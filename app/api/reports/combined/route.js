// app/api/reports/combined/route.js
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import initRedisClient from '@/lib/redis';

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

    // Generate cache key
    const cacheKey = `report_combined:${session.user.id}:${timeRange}:${reportType}`;
    let redisClient;
    try {
      redisClient = await initRedisClient();
    } catch (error) {
      console.warn('Redis not available, proceeding without caching:', error.message);
    }

    // Try to get cached data
    let cachedData = null;
    if (redisClient) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          cachedData = JSON.parse(cached);
          console.log('Cache hit for combined report');
          return new Response(JSON.stringify(cachedData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      } catch (error) {
        console.warn('Cache retrieval failed:', error.message);
      }
    }

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
      // Ambil data penjualan keseluruhan dengan optimasi
      const [salesData, dailySales, stores, totalProductsSold, topProducts] = await Promise.all([
        // Data penjualan per toko
        prisma.sale.groupBy({
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
        }),
        
        // Data penjualan harian
        prisma.sale.groupBy({
          by: ['date'],
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
        }),
        
        // Data toko
        prisma.store.findMany({
          where: {
            status: 'ACTIVE'
          },
          select: {
            id: true,
            name: true
          }
        }),
        
        // Total produk terjual
        prisma.saleDetail.aggregate({
          where: {
            sale: {
              date: {
                gte: startDate
              }
            }
          },
          _sum: {
            quantity: true
          }
        }),
        
        // Produk terlaris
        prisma.saleDetail.groupBy({
          by: ['productId'],
          where: {
            sale: {
              date: {
                gte: startDate
              }
            }
          },
          _sum: {
            quantity: true,
            subtotal: true
          },
          orderBy: {
            _sum: {
              quantity: 'desc'
            }
          },
          take: 5
        })
      ]);

      // Ambil nama produk untuk top products
      const topProductIds = topProducts.map(item => item.productId);
      const productDetails = await prisma.product.findMany({
        where: {
          id: {
            in: topProductIds
          }
        },
        select: {
          id: true,
          name: true
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

      // Gabungkan data produk
      const topProductsData = topProducts.map(item => {
        const product = productDetails.find(p => p.id === item.productId);
        return {
          productName: product ? product.name : 'Produk Tidak Dikenal',
          quantity: item._sum.quantity,
          revenue: item._sum.subtotal
        };
      });

      reportData = {
        globalStats: {
          totalRevenue: salesData.reduce((sum, sale) => sum + (sale._sum.total || 0), 0),
          totalSales: salesData.reduce((sum, sale) => sum + sale._count.id, 0),
          totalProductsSold: totalProductsSold._sum.quantity || 0,
          activeStores: stores.length
        },
        salesData: dailySales.map(day => ({
          date: day.date.toISOString().split('T')[0],
          sales: day._count.id,
          revenue: day._sum.total
        })),
        storePerformance: storeSalesData,
        topProducts: topProductsData
      };
    } else if (reportType === 'inventory') {
      // Data inventaris dengan optimasi
      const [totalProducts, lowStockProducts, outOfStockProducts, inventoryDataWithRelations] = await Promise.all([
        prisma.product.count(),
        prisma.product.count({
          where: {
            stock: { lte: 5 }
          }
        }),
        prisma.product.count({
          where: {
            stock: 0
          }
        }),
        prisma.product.findMany({
          select: {
            id: true,
            name: true,
            productCode: true,
            stock: true,
            store: {
              select: {
                name: true
              }
            },
            category: {
              select: {
                name: true
              }
            },
            supplier: {
              select: {
                name: true
              }
            },
            purchasePrice: true,
          },
          orderBy: {
            stock: 'asc' // Urutkan dari stok terendah
          },
          take: 10 // Ambil 10 produk terendah
        })
      ]);

      // Transformasi data untuk menghindari masalah jika relasi tidak ditemukan
      const inventoryData = inventoryDataWithRelations.map(item => ({
        id: item.id,
        name: item.name || 'Nama Produk Tidak Dikenal',
        productCode: item.productCode || 'Kode Produk Tidak Dikenal',
        stock: item.stock,
        storeName: item.store ? item.store.name : 'Toko Tidak Dikenal',
        categoryName: item.category ? item.category.name : 'Kategori Tidak Dikenal',
        supplierName: item.supplier ? item.supplier.name : 'Supplier Tidak Dikenal',
        purchasePrice: item.purchasePrice || 0,
      }));

      reportData = {
        globalStats: {
          totalProducts,
          lowStockProducts,
          outOfStockProducts,
          totalStores: await prisma.store.count()
        },
        inventoryData: inventoryData
      };
    } else if (reportType === 'financial') {
      // Data keuangan dengan optimasi
      const [salesTotal, expensesTotal, expensesByCategory, expenseCategories, purchasesTotal] = await Promise.all([
        prisma.sale.aggregate({
          where: {
            date: {
              gte: startDate
            }
          },
          _sum: {
            total: true
          }
        }),
        prisma.expense.aggregate({
          where: {
            date: {
              gte: startDate
            }
          },
          _sum: {
            amount: true
          }
        }),
        prisma.expense.groupBy({
          by: ['expenseCategoryId'],
          where: {
            date: {
              gte: startDate
            }
          },
          _sum: {
            amount: true
          }
        }),
        prisma.expenseCategory.findMany({
          where: {
            id: {
              in: expensesByCategory.map(item => item.expenseCategoryId)
            }
          },
          select: {
            id: true,
            name: true
          }
        }),
        prisma.purchase.aggregate({
          where: {
            purchaseDate: {
              gte: startDate
            }
          },
          _sum: {
            totalAmount: true
          }
        })
      ]);

      // Gabungkan data kategori pengeluaran
      const expensesByCategoryData = expensesByCategory.map(item => {
        const category = expenseCategories.find(cat => cat.id === item.expenseCategoryId);
        return {
          categoryName: category ? category.name : 'Kategori Tidak Dikenal',
          amount: item._sum.amount
        };
      });

      // Hitung laba kotor (total penjualan - total pembelian)
      const grossProfit = (salesTotal._sum.total || 0) - (purchasesTotal._sum.totalAmount || 0);

      reportData = {
        globalStats: {
          totalRevenue: salesTotal._sum.total || 0,
          totalExpenses: expensesTotal._sum.amount || 0,
          netProfit: (salesTotal._sum.total || 0) - (expensesTotal._sum.amount || 0),
          grossProfit: grossProfit,
          totalPurchases: purchasesTotal._sum.totalAmount || 0
        },
        financialData: {
          expensesByCategory: expensesByCategoryData
        }
      };
    }

    // Cache the response if Redis is available
    if (redisClient) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(reportData), { EX: 600 }); // Cache for 10 minutes
      } catch (error) {
        console.warn('Cache storage failed:', error.message);
      }
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