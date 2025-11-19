import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import globalPrisma from '@/lib/prisma';
import { ROLES, WAREHOUSE_STORE_ID } from '@/lib/constants';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only WAREHOUSE or MANAGER roles can create warehouse purchases
    if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { supplierId, purchaseDate, items } = body;

    if (!supplierId || !purchaseDate || !items || items.length === 0) {
      return NextResponse.json({ error: 'Data pembelian tidak lengkap' }, { status: 400 });
    }

    // Ensure the WAREHOUSE_STORE_ID exists. In a real app, you'd ensure this is a valid store.
    const warehouseStore = await globalPrisma.store.findUnique({
        where: { id: WAREHOUSE_STORE_ID }
    });

    if (!warehouseStore) {
        return NextResponse.json({ error: 'Warehouse store ID is not configured or does not exist' }, { status: 500 });
    }

    const newPurchase = await globalPrisma.$transaction(async (prisma) => {
      // 1. Create the Purchase record, linking to the designated warehouse store
      const purchase = await prisma.purchase.create({
        data: {
          storeId: WAREHOUSE_STORE_ID,
          supplierId,
          userId: session.user.id, // User who made the purchase (WAREHOUSE or MANAGER)
          purchaseDate: new Date(purchaseDate),
          totalAmount: items.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0),
          status: 'COMPLETED', // Or 'PENDING' based on workflow
          items: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              purchasePrice: item.purchasePrice,
              subtotal: item.quantity * item.purchasePrice,
              storeId: WAREHOUSE_STORE_ID, // PurchaseItem also needs storeId
            })),
          },
        },
      });

      // 2. Update or create WarehouseProduct entries
      for (const item of items) {
        await prisma.warehouseProduct.upsert({
          where: {
            productId_warehouseId: {
              productId: item.productId,
              warehouseId: warehouseStore.id, // Assuming the warehouse has one ID
            },
          },
          update: {
            quantity: {
              increment: item.quantity,
            },
          },
          create: {
            productId: item.productId,
            warehouseId: warehouseStore.id,
            quantity: item.quantity,
          },
        });
      }

      return purchase;
    });


    return NextResponse.json({
      success: true,
      purchase: newPurchase,
      message: 'Pembelian gudang berhasil disimpan dan stok diperbarui',
    });
  } catch (error) {
    console.error('Error creating warehouse purchase:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
