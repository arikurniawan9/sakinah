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

    // Only WAREHOUSE or MANAGER roles can access warehouse stats
    if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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

    // Fetch total unique products in warehouse using group by approach
    const uniqueProductsResult = await globalPrisma.warehouseProduct.groupBy({
      by: ['productId'],
      where: {
        warehouseId: centralWarehouse.id,
      },
      _count: {
        productId: true
      }
    });
    const totalUniqueProductsInWarehouse = uniqueProductsResult.length;

    // Fetch total quantity of all products in warehouse
    const totalQuantityInWarehouse = await globalPrisma.warehouseProduct.aggregate({
        where: {
          warehouseId: centralWarehouse.id,
        },
        _sum: {
            quantity: true,
        },
    });

    // Fetch total stores that have received distributions
    const distributionStores = await globalPrisma.warehouseDistribution.findMany({
        where: {
          warehouseId: centralWarehouse.id, // Only from the central warehouse
        },
        select: {
            storeId: true
        },
        distinct: ['storeId'] // Gunakan distinct di sini
    });
    const totalStoresLinked = distributionStores.length;

    // Fetch pending distributions
    const pendingDistributions = await globalPrisma.warehouseDistribution.count({
        where: {
          warehouseId: centralWarehouse.id, // Only from the central warehouse
          status: {
                notIn: ['DELIVERED', 'CANCELLED'],
            },
        },
    });

    // Fetch low stock items in warehouse
    const lowStockItems = await globalPrisma.warehouseProduct.count({
        where: {
          warehouseId: centralWarehouse.id, // Only in the central warehouse
          quantity: {
                lte: 10, // Define low stock threshold as <= 10
            },
        },
    });

    // Fetch total distributed quantity
    const totalDistributedResult = await globalPrisma.warehouseDistribution.aggregate({
        _sum: {
            quantity: true,
        },
        where: {
          warehouseId: centralWarehouse.id, // Only from the central warehouse
          status: 'DELIVERED', // Only count successfully delivered items
        },
    });
    const totalDistributed = totalDistributedResult._sum.quantity || 0;

    return NextResponse.json({
      totalUniqueProductsInWarehouse: totalUniqueProductsInWarehouse || 0,
      totalQuantityInWarehouse: totalQuantityInWarehouse._sum.quantity || 0,
      totalStoresLinked: totalStoresLinked || 0,
      pendingDistributions: pendingDistributions || 0,
      lowStockItems: lowStockItems || 0,
      totalDistributed: totalDistributed || 0,
    });
  } catch (error) {
    console.error('Error fetching warehouse stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
