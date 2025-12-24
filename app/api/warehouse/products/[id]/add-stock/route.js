// app/api/warehouse/products/[id]/add-stock/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES, WAREHOUSE_STORE_ID } from '@/lib/constants';

// Helper to get or create the master store
async function getMasterStore() {
    let masterStore = await prisma.store.findUnique({
        where: { code: WAREHOUSE_STORE_ID },
    });

    if (!masterStore) {
        masterStore = await prisma.store.findUnique({
            where: { code: 'WHS-MASTER' },
        });

        if (masterStore) {
            masterStore = await prisma.store.update({
                where: { id: masterStore.id },
                data: { code: WAREHOUSE_STORE_ID }
            });
        }
    }

    if (!masterStore) {
        masterStore = await prisma.store.create({
            data: {
                code: WAREHOUSE_STORE_ID,
                name: 'Gudang Master',
                description: 'Store virtual untuk menampung master produk gudang',
                status: 'SYSTEM'
            }
        });
    }
    return masterStore;
}

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session || ![ROLES.WAREHOUSE, ROLES.MANAGER].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const productId = params.id;
  const { quantity } = await request.json();

  if (!productId) {
    return NextResponse.json({ error: 'ID Produk tidak ditemukan' }, { status: 400 });
  }
  if (typeof quantity !== 'number' || quantity <= 0) {
    return NextResponse.json({ error: 'Jumlah stok harus angka positif' }, { status: 400 });
  }

  try {
    const masterStore = await getMasterStore();
    if (!masterStore) {
        return NextResponse.json({ error: 'Master store could not be configured.' }, { status: 500 });
    }

    const centralWarehouse = await prisma.warehouse.findFirst({
      where: { name: 'Gudang Pusat' }
    });

    if (!centralWarehouse) {
      return NextResponse.json({ error: 'Gudang Pusat tidak ditemukan' }, { status: 404 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId, storeId: masterStore.id }
    });

    if (!product) {
      return NextResponse.json({ error: 'Produk tidak ditemukan di gudang master' }, { status: 404 });
    }

    // Use a transaction to update both product and warehouseProduct stock
    await prisma.$transaction(async (tx) => {
      // Update stock in the main Product table
      await tx.product.update({
        where: { id: productId },
        data: {
          stock: { increment: quantity },
          updatedAt: new Date()
        }
      });

      // Update stock in the WarehouseProduct table
      await tx.warehouseProduct.upsert({
        where: {
          productId_warehouseId: {
            productId: productId,
            warehouseId: centralWarehouse.id
          }
        },
        update: {
          quantity: { increment: quantity },
          updatedAt: new Date()
        },
        create: {
          productId: productId,
          warehouseId: centralWarehouse.id,
          quantity: quantity,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    });

    return NextResponse.json({ message: 'Stok produk berhasil ditambahkan', productId, quantity });
  } catch (error) {
    console.error('Error adding stock to warehouse product:', error);
    return NextResponse.json({ error: 'Gagal menambahkan stok: ' + error.message }, { status: 500 });
  }
}
