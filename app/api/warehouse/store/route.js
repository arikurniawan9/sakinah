export const dynamic = 'force-dynamic';
// app/api/warehouse/store/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES, WAREHOUSE_STORE_ID } from '@/lib/constants';

// GET /api/warehouse/store - Get the warehouse store
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only WAREHOUSE and MANAGER roles can access warehouse store info
    if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the warehouse store
    let warehouseStore = await prisma.store.findFirst({
      where: { code: WAREHOUSE_STORE_ID },
    });

    if (!warehouseStore) {
      // Create the warehouse store if it doesn't exist
      warehouseStore = await prisma.store.create({
        data: {
          name: 'Warehouse Master Store',
          code: WAREHOUSE_STORE_ID,
          description: 'Master store for warehouse operations',
        }
      });
    }

    return NextResponse.json({ store: warehouseStore });
  } catch (error) {
    console.error('Error fetching warehouse store:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouse store' },
      { status: 500 }
    );
  }
}