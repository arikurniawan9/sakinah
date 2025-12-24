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

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session || ![ROLES.WAREHOUSE, ROLES.MANAGER].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const masterStore = await getMasterStore();
    if (!masterStore) {
        return NextResponse.json({ error: 'Master store could not be configured.' }, { status: 500 });
    }

    const products = await prisma.product.findMany({
      where: {
        storeId: masterStore.id
      },
      include: {
        category: true,
        supplier: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format data for export
    const exportData = products.map(product => ({
      'ID Produk': product.id,
      'Kode Produk': product.productCode,
      'Nama Produk': product.name,
      'Stok': product.stock,
      'Harga Beli': product.purchasePrice,
      'Harga Umum': product.retailPrice,
      'Harga Silver': product.silverPrice,
      'Harga Gold': product.goldPrice,
      'Harga Platinum': product.platinumPrice,
      'Kategori': product.category?.name || 'N/A',
      'Supplier': product.supplier?.name || 'N/A',
      'Deskripsi': product.description || '',
      'Dibuat Pada': product.createdAt.toISOString(),
      'Diperbarui Pada': product.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      data: exportData
    });
  } catch (error) {
    console.error('Error exporting warehouse products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
