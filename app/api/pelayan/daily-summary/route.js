import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const attendantId = searchParams.get('attendantId');

  if (!attendantId) {
    return NextResponse.json({ message: 'Attendant ID is required' }, { status: 400 });
  }

  // Define start and end of today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    // Fetch transactions (Sales) for today by the attendant
    // In our schema, the model is called 'Sale'
    const transactions = await prisma.sale.findMany({
      where: {
        attendantId: attendantId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        status: 'PAID', // In our schema default status is PAID
      },
      include: {
        saleDetails: {
          include: {
            product: true,
          },
        },
      },
    });

    let todaySales = transactions.length;
    let todayItems = 0;
    let todayRevenue = 0;

    transactions.forEach(transaction => {
      if (transaction.saleDetails) {
        transaction.saleDetails.forEach(item => {
          todayItems += item.quantity || 0;
          todayRevenue += (item.quantity || 0) * (item.price || 0);
        });
      }
    });

    // Simple conversion logic for now
    const todayConversion = todaySales > 0 ? 100 : 0;

    return NextResponse.json({
      dailySummary: {
        todaySales,
        todayItems,
        todayRevenue,
        todayConversion,
      },
    });

  } catch (error) {
    console.error('Error fetching daily summary:', error);
    return NextResponse.json({ message: 'Failed to fetch daily summary', error: error.message }, { status: 500 });
  }
}
