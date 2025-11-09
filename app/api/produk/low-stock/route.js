// app/api/produk/low-stock/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request) {
  const session = await getSession();
  if (!session || !['ADMIN', 'CASHIER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const threshold = parseInt(searchParams.get('threshold')) || 10; // Default to 10 if not provided

    const lowStockProducts = await prisma.product.findMany({
      where: {
        stock: {
          lt: threshold, // Less than the specified threshold
        },
      },
      select: {
        id: true,
        name: true,
        productCode: true,
        stock: true,
      },
      orderBy: {
        stock: 'asc', // Order by lowest stock first
      },
    });

    return NextResponse.json({ lowStockProducts });
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch low stock products' },
      { status: 500 }
    );
  }
}
