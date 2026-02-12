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

    // --- Optimized Queries with Parallel Execution ---
    
    // We run all independent queries in parallel to significantly reduce response time
    const [
      totalProducts, 
      totalMembers, 
      activeEmployees, 
      salesInRange, 
      recentTransactions, 
      bestSellingProductsRaw,
      pendingDistributions
    ] = await Promise.all([
      // 1. Total Products
      storeId
        ? prisma.product.count({ where: { storeId } })
        : prisma.product.count(),
      
      // 2. Total Members
      storeId
        ? prisma.member.count({ where: { storeId } })
        : prisma.member.count(),
      
      // 3. Active Employees
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
          }),
      
      // 4. Sales in range (for chart and totals)
      prisma.sale.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          ...(storeId && { storeId }),
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
      }),

      // 5. Recent transactions
      prisma.sale.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: {
          ...(storeId && { storeId }),
        },
        select: {
          id: true,
          invoiceNumber: true,
          total: true,
          date: true,
          createdAt: true, // Crucial for frontend date rendering
          cashier: {
            select: {
              name: true
            }
          }
        }
      }),

      // 6. Best selling products raw
      prisma.saleDetail.groupBy({
        by: ['productId'],
        where: {
          sale: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
            ...(storeId && { storeId }),
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
      }),

      // 7. Pending distributions count (if applicable)
      storeId ? prisma.warehouseDistribution.count({
        where: {
          storeId,
          status: 'PENDING_ACCEPTANCE',
        },
      }) : Promise.resolve(0)
    ]);

    // Calculate totals from salesInRange
    const totalSalesInRange = salesInRange.reduce((sum, sale) => sum + sale.total, 0);
    const totalTransactionsInRange = salesInRange.length;

    // Calculate Total Profit
    const totalProfitInRange = salesInRange.reduce((totalProfit, sale) => {
      const totalCostForSale = sale.saleDetails.reduce((costSum, detail) => {
        const purchasePrice = detail.product?.purchasePrice || 0;
        return costSum + (purchasePrice * detail.quantity);
      }, 0);
      const profitForSale = sale.total - totalCostForSale;
      return totalProfit + profitForSale;
    }, 0);

    // Filter out products with zero quantity sold and get details
    const bestSellingProductsFiltered = bestSellingProductsRaw.filter(item => item._sum.quantity > 0);
    const productIds = bestSellingProductsFiltered.map(p => p.productId);
    
    let enhancedBestSellingProducts = [];
    if (productIds.length > 0) {
      const productDetails = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          ...(storeId && { storeId }),
        },
        select: {
          id: true,
          name: true,
          productCode: true,
        },
      });

      enhancedBestSellingProducts = bestSellingProductsFiltered.map(topProduct => {
        const detail = productDetails.find(p => p.id === topProduct.productId);
        return detail ? {
          ...detail,
          quantitySold: topProduct._sum.quantity,
        } : null;
      }).filter(Boolean);
    }

    // Calculation for chart data
    const salesByDay = {};
    salesInRange.forEach(sale => {
      const date = sale.createdAt.toISOString().split('T')[0];

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
      totalSalesInRange,
      totalTransactionsInRange,
      totalProfitInRange,
      recentTransactions,
      bestSellingProducts: enhancedBestSellingProducts,
      salesData,
      pendingDistributions, // Include pending distributions count
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