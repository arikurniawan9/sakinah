import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

// GET: Get pending warehouse distributions for the store
export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has storeId
  if (!session.user.storeId) {
    return NextResponse.json({ error: 'User is not associated with a store' }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Get pending warehouse distributions for this store
    const [distributions, totalCount] = await Promise.all([
      prisma.warehouseDistribution.findMany({
        where: {
          storeId: session.user.storeId,
          status: 'PENDING_ACCEPTANCE',
        },
        include: {
          product: {
            include: {
              category: true,
              supplier: true,
            }
          },
          distributedByUser: {
            select: {
              name: true,
              username: true,
            }
          },
          warehouse: {
            select: {
              name: true,
            }
          },
          store: {
            select: {
              name: true,
            }
          },
        },
        orderBy: {
          distributedAt: 'desc',
        },
        skip: offset,
        take: limit,
      }),
      prisma.warehouseDistribution.count({
        where: {
          storeId: session.user.storeId,
          status: 'PENDING_ACCEPTANCE',
        }
      })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      distributions,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        total: totalCount,
        itemsPerPage: limit,
        startIndex: offset + 1,
        endIndex: Math.min(offset + limit, totalCount)
      }
    });
  } catch (error) {
    console.error('Error fetching pending warehouse distributions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}