// app/api/dashboard/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import initRedisClient from '@/lib/redis';

export async function GET(request) {
  const session = await getSession();
  if (!session || !['ADMIN', 'CASHIER', 'ATTENDANT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // For non-global roles, check if user has store access
  if (!session.user.isGlobalRole && !session.user.storeId) {
    return NextResponse.json({ error: 'User does not have access to any store' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');

  // --- Caching Implementation ---
  let redisClient;
  try {
    redisClient = await initRedisClient();
  } catch (error) {
    console.warn('Redis not available, proceeding without caching:', error.message);
  }

  // Generate cache key based on user and date range
  const storeId = session.user.isGlobalRole ? null : session.user.storeId;
  const cacheKey = `dashboard_data:${session.user.id}:${storeId || 'global'}:${startDateParam || 'default'}:${endDateParam || 'default'}`;

  // Try to get cached data
  let cachedData = null;
  if (redisClient) {
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        cachedData = JSON.parse(cached);
        console.log('Cache hit for dashboard data');
        return NextResponse.json(cachedData);
      }
    } catch (error) {
      console.warn('Cache retrieval failed:', error.message);
    }
  }

  try {
    // --- Define Date Range ---
    let endDate = new Date();
    if (endDateParam) {
        endDate = new Date(endDateParam);
    }
    endDate.setHours(23, 59, 59, 999); // End of the selected day

    let startDate = new Date();
    if (startDateParam) {
        startDate = new Date(startDateParam);
    } else {
        startDate.setDate(startDate.getDate() - 6); // Default to last 7 days
    }
    startDate.setHours(0, 0, 0, 0); // Start of the selected day

    // --- Optimized Queries with Select ---
    
    // Combined query for static stats to reduce database round trips
    const [totalProducts, totalMembers, activeEmployees] = await Promise.all([
      storeId
        ? prisma.product.count({ where: { storeId } })
        : prisma.product.count(),
      storeId
        ? prisma.member.count({ where: { storeId } })
        : prisma.member.count(),
      storeId
        ? prisma.storeUser.count({
            where: {
              storeId,
              role: { in: ['CASHIER', 'ATTENDANT'] },
              status: 'AKTIF'
            }
          })
        : prisma.user.count({
            where: { role: { in: ['CASHIER', 'ATTENDANT'] } }
          })
    ]);

    // Optimized query for sales data with selective inclusion
    const salesInRange = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        ...(storeId && { storeId }), // Filter by storeId if it exists (non-global roles)
      },
      select: {
        total: true,
        createdAt: true,
        saleDetails: {
          select: {
            quantity: true,
            product: {
              select: {
                purchasePrice: true,
              },
            },
          },
        },
      },
    });

    const totalSalesInRange = salesInRange.reduce((sum, sale) => sum + sale.total, 0);
    const totalTransactionsInRange = salesInRange.length;

    // Calculate Total Profit
    const totalProfitInRange = salesInRange.reduce((totalProfit, sale) => {
      const totalCostForSale = sale.saleDetails.reduce((costSum, detail) => {
        // Ensure product and purchasePrice exist to avoid errors
        const purchasePrice = detail.product?.purchasePrice || 0;
        return costSum + (purchasePrice * detail.quantity);
      }, 0);
      const profitForSale = sale.total - totalCostForSale;
      return totalProfit + profitForSale;
    }, 0);

    // Optimized query for recent transactions with selective inclusion
    const recentTransactions = await prisma.sale.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      where: {
        ...(storeId && { storeId }), // Filter by storeId if it exists (non-global roles)
      },
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        date: true,
        cashier: {
          select: {
            name: true
          }
        }
      }
    });

    // Optimized query for best selling products using a single groupBy with join
    const bestSellingProducts = await prisma.saleDetail.groupBy({
      by: ['productId'],
      where: {
        sale: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          ...(storeId && { storeId }), // Filter by storeId if it exists (non-global roles)
        },
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
      having: {
        _sum: {
          quantity: {
            gt: 0
          }
        }
      }
    });

    // Get product details in a single query
    const productIds = bestSellingProducts.map(p => p.productId);
    const productDetails = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        ...(storeId && { storeId }), // Filter by storeId if it exists (non-global roles)
      },
      select: {
        id: true,
        name: true,
        productCode: true,
      },
    });

    // Combine the data
    const enhancedBestSellingProducts = bestSellingProducts.map(topProduct => {
      const detail = productDetails.find(p => p.id === topProduct.productId);
      return detail ? {
        ...detail,
        quantitySold: topProduct._sum.quantity,
      } : null;
    }).filter(Boolean); // Remove any null values

    // Optimized calculation for chart data
    const salesByDay = {};
    salesInRange.forEach(sale => {
      const date = sale.createdAt.toISOString().split('T')[0]; // Format as YYYY-MM-DD

      const profitForSale = sale.total - sale.saleDetails.reduce((costSum, detail) => {
        const purchasePrice = detail.product?.purchasePrice || 0;
        return costSum + (purchasePrice * detail.quantity);
      }, 0);

      if (!salesByDay[date]) {
        salesByDay[date] = { date, totalSales: 0, totalProfit: 0 };
      }

      salesByDay[date].totalSales += sale.total;
      salesByDay[date].totalProfit += profitForSale;
    });

    const salesData = Object.values(salesByDay).sort((a, b) => new Date(a.date) - new Date(b.date));

    const responseData = {
      totalProducts,
      totalMembers,
      activeEmployees,
      // New range-based stats
      totalSalesInRange,
      totalTransactionsInRange,
      totalProfitInRange,
      // Recent activity
      recentTransactions,
      // Best selling products
      bestSellingProducts: enhancedBestSellingProducts,
      // Data for chart
      salesData,
    };

    // Cache the response if Redis is available
    if (redisClient) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(responseData), { EX: 300 }); // Cache for 5 minutes
      } catch (error) {
        console.warn('Cache storage failed:', error.message);
      }
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}