export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import globalPrisma from '@/lib/prisma';
import { ROLES, WAREHOUSE_STORE_ID } from '@/lib/constants';

// Helper to get or create the master store
async function getMasterStore() {
    // First, try to find the store using the official constant
    let masterStore = await globalPrisma.store.findUnique({
        where: { code: WAREHOUSE_STORE_ID },
    });

    // If not found, try to find the old 'WHS-MASTER' store
    if (!masterStore) {
        masterStore = await globalPrisma.store.findUnique({
            where: { code: 'WHS-MASTER' },
        });

        // If found, update its code to the official one for consistency
        if (masterStore) {
            masterStore = await globalPrisma.store.update({
                where: { id: masterStore.id },
                data: { code: WAREHOUSE_STORE_ID }
            });
        }
    }
    
    // If still not found, create a new one
    if (!masterStore) {
        masterStore = await globalPrisma.store.create({
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

// DELETE - Delete multiple warehouse suppliers
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || ![ROLES.WAREHOUSE, ROLES.MANAGER].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const masterStore = await getMasterStore();
    if (!masterStore) {
        return NextResponse.json({ error: 'Master store could not be configured.' }, { status: 500 });
    }
    const masterStoreId = masterStore.id;

    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ID supplier tidak valid' }, { status: 400 });
    }

    // Check if the suppliers exist and belong to the master store
    const existingSuppliers = await globalPrisma.supplier.findMany({
      where: {
        id: { in: ids },
        storeId: masterStoreId
      }
    });

    if (existingSuppliers.length !== ids.length) {
      return NextResponse.json({
        error: 'Beberapa supplier tidak ditemukan atau tidak memiliki akses'
      }, { status: 404 });
    }

    // Delete the suppliers from the database
    await globalPrisma.supplier.deleteMany({
      where: {
        id: { in: ids },
        storeId: masterStoreId
      }
    });

    return NextResponse.json({
      message: `${ids.length} supplier berhasil dihapus dari gudang`,
      deletedCount: ids.length
    });
  } catch (error) {
    console.error('Error deleting suppliers for warehouse:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}