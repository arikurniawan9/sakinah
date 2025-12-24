export const dynamic = 'force-dynamic';
// app/api/warehouse/all-suppliers/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || ![ROLES.WAREHOUSE, ROLES.MANAGER].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 10;
    const page = parseInt(searchParams.get('page')) || 1;
    const search = searchParams.get('search') || '';

    // Validasi parameter
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'Parameter pagination tidak valid' }, { status: 400 });
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build query conditions
    const whereCondition = {}; // Empty condition to get all suppliers from all stores

    if (search) {
        whereCondition.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { address: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } }
        ];
    }

    // Ambil data dan hitung total dalam satu operasi
    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where: whereCondition,
        skip: offset,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          store: true, // Include store information
          products: {
            select: {
              id: true
            }
          }
        }
      }),
      prisma.supplier.count({
        where: whereCondition
      })
    ]);

    // Transform data to include store name and product count
    const suppliersWithStoreAndProductCount = suppliers.map(supplier => ({
      ...supplier,
      storeName: supplier.store?.name || 'N/A',
      productCount: supplier.products.length
    }));

    const totalPages = Math.ceil(total / limit);

    const result = {
      suppliers: suppliersWithStoreAndProductCount,
      pagination: {
        page: page,
        limit: limit,
        total: total,
        totalPages: totalPages,
        hasMore: page < totalPages
      }
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching all suppliers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}