export const dynamic = 'force-dynamic';
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

    // Only WAREHOUSE or MANAGER roles can access this API
    if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search');

    // Get the central warehouse (assuming there's one central warehouse)
    const centralWarehouse = await globalPrisma.warehouse.findFirst({
      where: { name: 'Gudang Pusat' }
    });

    if (!centralWarehouse) {
      // If no central warehouse exists, return empty results
      return NextResponse.json({
        warehouseProducts: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          total: 0,
          startIndex: 0,
          endIndex: 0
        }
      });
    }

    // Build where clause for search
    let whereClause = {
      warehouseId: centralWarehouse.id
    };

    if (search) {
      whereClause = {
        ...whereClause,
        product: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { productCode: { contains: search, mode: 'insensitive' } }
          ]
        }
      };
    }

    // Get total count for pagination
    const totalCount = await globalPrisma.warehouseProduct.count({
      where: whereClause
    });

    // Get warehouse products with product details
    const warehouseProducts = await globalPrisma.warehouseProduct.findMany({
      where: whereClause,
      include: {
        product: {
          include: {
            category: true,
            supplier: true
          }
        },
        warehouse: true
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate pagination values
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit + 1;
    const endIndex = Math.min(page * limit, totalCount);

    return NextResponse.json({
      warehouseProducts,
      pagination: {
        currentPage: page,
        totalPages,
        total: totalCount,
        startIndex,
        endIndex
      }
    });
  } catch (error) {
    console.error('Error fetching warehouse stocks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only WAREHOUSE or MANAGER roles can access this API
    if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Extract ID from URL
    const { id } = params;

    // Get the central warehouse
    const centralWarehouse = await globalPrisma.warehouse.findFirst({
      where: { name: 'Gudang Pusat' }
    });

    if (!centralWarehouse) {
      return NextResponse.json({ error: 'Gudang pusat tidak ditemukan' }, { status: 404 });
    }

    // Delete the warehouse product
    const deletedWarehouseProduct = await globalPrisma.warehouseProduct.delete({
      where: {
        id,
        warehouseId: centralWarehouse.id // Ensure it belongs to the central warehouse
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Stok gudang berhasil dihapus',
      warehouseProduct: deletedWarehouseProduct
    });
  } catch (error) {
    console.error('Error deleting warehouse stock:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Stok gudang tidak ditemukan' }, { status: 404 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}