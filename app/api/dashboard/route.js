// app/api/dashboard/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');

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


    // --- Stats Overview (Not date-dependent) ---
    const totalProducts = await prisma.product.count();
    const totalMembers = await prisma.member.count();
    const activeEmployees = await prisma.user.count({
      where: { role: { in: ['CASHIER', 'ATTENDANT'] } },
    });

    // --- Range-based Stats ---
    const salesInRange = await prisma.sale.findMany({
        where: {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        },
        include: {
            saleDetails: {
                include: {
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


    // --- Recent Activity Log (Last 5 transactions, not date-dependent) ---
    const recentTransactions = await prisma.sale.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { cashier: { select: { name: true } } }, // CORRECTED: from 'user' to 'cashier'
    });

    // --- Best Selling Products ---
    const topProductsQuery = await prisma.saleDetail.groupBy({
      by: ['productId'],
      where: {
        sale: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
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
    });

    const productIds = topProductsQuery.map(p => p.productId);
    const productDetails = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      select: {
        id: true,
        name: true,
        productCode: true,
      },
    });

    const bestSellingProducts = topProductsQuery.map(topProduct => {
      const detail = productDetails.find(p => p.id === topProduct.productId);
      return {
        ...detail,
        quantitySold: topProduct._sum.quantity,
      };
    }).sort((a, b) => b.quantitySold - a.quantitySold);


    return NextResponse.json({
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
      bestSellingProducts,
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' }, 
      { status: 500 }
    );
  }
}
