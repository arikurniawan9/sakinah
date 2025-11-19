import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import globalPrisma from '@/lib/prisma';
import { getTenantPrismaClient } from '@/utils/tenantUtils';
import { ROLES, WAREHOUSE_STORE_ID } from '@/lib/constants';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only WAREHOUSE or MANAGER roles can create warehouse distributions
    if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { storeId, distributionDate, items, distributedBy, status: distributionStatus } = body;

    if (!storeId || !distributionDate || !items || items.length === 0) {
      return NextResponse.json({ error: 'Data distribusi tidak lengkap' }, { status: 400 });
    }

    // Ensure the target store exists
    const targetStore = await globalPrisma.store.findUnique({
      where: { id: storeId }
    });

    if (!targetStore) {
      return NextResponse.json({ error: 'Toko tujuan tidak ditemukan' }, { status: 404 });
    }

    // Use a transaction to ensure atomicity
    const newDistribution = await globalPrisma.$transaction(async (prisma) => {
      let totalAmount = 0;

      // First, check stock and calculate total amount
      for (const item of items) {
        const warehouseProduct = await prisma.warehouseProduct.findUnique({
          where: {
            productId_warehouseId: {
              productId: item.productId,
              warehouseId: WAREHOUSE_STORE_ID, // Assuming central warehouse has a fixed ID or lookup
            },
          },
        });

        if (!warehouseProduct || warehouseProduct.quantity < item.quantity) {
          throw new Error(`Stok produk ${item.productId} tidak mencukupi di gudang`);
        }

        const product = await prisma.product.findUnique({
          where: { id: item.productId }
        });
        if (!product) {
          throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan`);
        }
        totalAmount += item.quantity * product.purchasePrice; // Use product's purchase price as unit price for distribution
      }

      // Create WarehouseDistribution record
      const distribution = await prisma.warehouseDistribution.create({
        data: {
          warehouseId: WAREHOUSE_STORE_ID, // Central warehouse
          storeId,
          distributedBy,
          distributedAt: new Date(distributionDate),
          status: distributionStatus || 'DELIVERED',
          notes: body.notes || null,
          totalAmount,
          // Items details are stored within the distribution record if needed, or handled separately
          // For now, assume items are just for stock update
        },
      });

      // Update WarehouseProduct quantities and target store's Product stock
      for (const item of items) {
        // Decrement warehouse stock
        await prisma.warehouseProduct.update({
          where: {
            productId_warehouseId: {
              productId: item.productId,
              warehouseId: WAREHOUSE_STORE_ID,
            },
          },
          data: {
            quantity: {
              decrement: item.quantity,
            },
            reserved: { // Decrement reserved if this was from a reservation
                decrement: item.quantity, // Assuming distributed items were previously reserved
            }
          },
        });

        // Update or create product stock in target store
        const tenantPrisma = getTenantPrismaClient(storeId);
        await tenantPrisma.product.upsert({
          where: {
            // Need a unique constraint on productCode and storeId for upsert to work reliably
            // Assuming productCode is unique per store.
            productCode_storeId: { // This assumes such a unique constraint exists in schema.prisma for Product
                productCode: (await prisma.product.findUnique({ where: { id: item.productId } })).productCode,
                storeId: storeId,
            }
          },
          update: {
            stock: {
              increment: item.quantity,
            },
          },
          create: {
            id: item.productId, // Keep same ID as warehouse product
            storeId: storeId,
            categoryId: (await prisma.product.findUnique({ where: { id: item.productId } })).categoryId,
            name: (await prisma.product.findUnique({ where: { id: item.productId } })).name,
            productCode: (await prisma.product.findUnique({ where: { id: item.productId } })).productCode,
            stock: item.quantity,
            purchasePrice: (await prisma.product.findUnique({ where: { id: item.productId } })).purchasePrice,
            supplierId: (await prisma.product.findUnique({ where: { id: item.productId } })).supplierId,
            // image, description can be copied as well
          },
        });
      }

      return distribution;
    });

    return NextResponse.json({
      success: true,
      distribution: newDistribution,
      message: 'Distribusi produk berhasil disimpan dan stok diperbarui',
    });
  } catch (error) {
    console.error('Error creating warehouse distribution:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
