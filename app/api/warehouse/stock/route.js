import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import globalPrisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only WAREHOUSE or MANAGER roles can access warehouse stock
    if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const warehouseProducts = await globalPrisma.warehouseProduct.findMany({
      include: {
        product: {
          select: {
            name: true,
            productCode: true,
            // Add any other product details you need
          },
        },
      },
      orderBy: {
        product: {
          name: 'asc',
        },
      },
    });

    return NextResponse.json({ warehouseProducts });
  } catch (error) {
    console.error('Error fetching warehouse products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
