import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/authOptions';
import { PrismaClient } from '@prisma/client';

// Tell Next.js this route is dynamic and should not be statically generated
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only allow cashier and admin access
    if (session.user.role !== 'CASHIER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 10;
    const page = parseInt(searchParams.get('page')) || 1;
    const date = searchParams.get('date'); // Optional date filter
    const search = searchParams.get('search'); // Optional search term

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build where clause
    let whereClause = {
      cashierId: session.user.id, // Only transactions by this cashier
      storeId: session.user.storeId, // Also filter by store ID to maintain multi-tenant isolation
    };

    // Add date filter if provided
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      whereClause.date = {
        gte: startDate,
        lte: endDate
      };
    }

    // Add search filter if provided (searches by invoice number)
    if (search) {
      whereClause.invoiceNumber = {
        contains: search,
      };
    }

    // Fetch sales transactions for this cashier with related data
    const [sales, totalCount] = await Promise.all([
      prisma.sale.findMany({
        where: whereClause,
        include: {
          cashier: true,
          attendant: true,
          member: true,
          saleDetails: {
            include: {
              product: true,
            }
          }
        },
        orderBy: {
          date: 'desc',
        },
        skip: offset,
        take: limit,
      }),
      prisma.sale.count({ where: whereClause })
    ]);

    // Transform data to match frontend requirements
    const transformedSales = sales.map(sale => ({
      id: sale.id,
      invoiceNumber: sale.invoiceNumber,
      // Cashier Info
      cashierName: sale.cashier?.name || 'Unknown',
      cashierCode: sale.cashier?.code || sale.cashier?.employeeNumber || sale.cashier?.id?.substring(0, 5) || '-',
      // Attendant Info
      attendantName: sale.attendant?.name || null,
      attendantCode: sale.attendant?.code || sale.attendant?.employeeNumber || sale.attendant?.id?.substring(0, 5) || '-',
      attendantId: sale.attendant?.id || null,
      // Customer Info
      customerName: sale.member?.name || '-',
      customerCode: sale.member?.code || sale.member?.id?.substring(0, 5) || '-',
      date: sale.date,
      totalAmount: sale.total,
      discount: sale.discount || 0,
      additionalDiscount: sale.additionalDiscount || 0,
      tax: sale.tax || 0,
      payment: sale.payment || 0,
      change: sale.change || 0,
      status: sale.status || 'completed',
      paymentMethod: sale.paymentMethod || 'CASH',
      items: sale.saleDetails.map(detail => ({
        productId: detail.productId || detail.product?.id,
        productName: detail.product?.name || 'Unknown Product',
        quantity: detail.quantity,
        price: detail.price,
        subtotal: detail.subtotal,
      })),
    }));

    return NextResponse.json({
      sales: transformedSales,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      }
    });
  } catch (error) {
    console.error('Error fetching cashier sales:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}