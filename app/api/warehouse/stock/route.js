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

    // Get or create the central warehouse
    let centralWarehouse = await globalPrisma.warehouse.findFirst({
      where: { name: 'Gudang Pusat' }
    });

    if (!centralWarehouse) {
      // Create the central warehouse if it doesn't exist
      centralWarehouse = await globalPrisma.warehouse.create({
        data: {
          name: 'Gudang Pusat',
          description: 'Gudang pusat untuk distribusi ke toko-toko',
          status: 'ACTIVE'
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
        Product: {
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
        Product: {
          include: {
            category: true,
            supplier: true,
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
    const awaitedParams = await params;
    const { id } = awaitedParams;

    // Get the central warehouse
    // Get or create the central warehouse
    let centralWarehouse = await globalPrisma.warehouse.findFirst({
      where: { name: 'Gudang Pusat' }
    });

    if (!centralWarehouse) {
      // Create the central warehouse if it doesn't exist
      centralWarehouse = await globalPrisma.warehouse.create({
        data: {
          name: 'Gudang Pusat',
          description: 'Gudang pusat untuk distribusi ke toko-toko',
          status: 'ACTIVE'
        }
      });
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