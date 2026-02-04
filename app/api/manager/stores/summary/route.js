// app/api/manager/stores/summary/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Hitung statistik di semua toko
    const [
      totalStores,
      totalMembers,
      totalProducts,
      todaySales,
    ] = await prisma.$transaction([
      prisma.store.count(),
      prisma.member.count(),
      prisma.product.count(),
      prisma.sale.aggregate({
        where: {
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
        _sum: {
          total: true,
        },
      }),
    ]);

    return NextResponse.json({
      totalStores,
      totalMembers,
      totalProducts,
      todaySales: todaySales._sum.total || 0,
    });
  } catch (error) {
    console.error('Error fetching manager dashboard summary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}