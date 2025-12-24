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

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || ![ROLES.WAREHOUSE, ROLES.MANAGER].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const masterStore = await getMasterStore();
    if (!masterStore) {
        return NextResponse.json({ error: 'Master store could not be configured.' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const exportParam = searchParams.get('export');

    if (exportParam === 'true') {
      const suppliers = await globalPrisma.supplier.findMany({
        where: { storeId: masterStore.id },
        orderBy: { name: 'asc' },
      });

      const suppliersWithProductCount = suppliers && Array.isArray(suppliers) ? await Promise.all(
        suppliers.map(async (supplier) => {
          const productCount = await globalPrisma.product.count({
            where: { supplierId: supplier.id, storeId: masterStore.id }
          });
          return { ...supplier, productCount };
        })
      ) : [];

      return NextResponse.json({ suppliers: suppliersWithProductCount });
    } else {
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const search = searchParams.get('search') || '';
      const offset = (page - 1) * limit;

      let whereClause = { storeId: masterStore.id };

      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { contactPerson: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      const suppliers = await globalPrisma.supplier.findMany({
        where: whereClause,
        orderBy: { name: 'asc' },
        skip: offset,
        take: limit,
      });

      const totalCount = await globalPrisma.supplier.count({ where: whereClause });

      const suppliersWithProductCount = suppliers && Array.isArray(suppliers) ? await Promise.all(
        suppliers.map(async (supplier) => {
          const productCount = await globalPrisma.product.count({
            where: { supplierId: supplier.id, storeId: masterStore.id }
          });
          return { ...supplier, productCount };
        })
      ) : [];

      return NextResponse.json({
        suppliers: suppliersWithProductCount,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          total: totalCount,
          limit: limit
        }
      });
    }
  } catch (error) {
    console.error('Error fetching suppliers for warehouse:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || ![ROLES.WAREHOUSE, ROLES.MANAGER].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const masterStore = await getMasterStore();
    if (!masterStore) {
        return NextResponse.json({ error: 'Master store could not be configured.' }, { status: 500 });
    }

    const body = await request.json();
    const { code, name, contactPerson, address, phone, email } = body;

    if (!code || !name) {
      return NextResponse.json({ error: 'Kode dan nama supplier wajib diisi' }, { status: 400 });
    }

    const existingSupplier = await globalPrisma.supplier.findUnique({
      where: { code_storeId: { code, storeId: masterStore.id } }
    });

    if (existingSupplier) {
      return NextResponse.json({ error: 'Supplier dengan kode yang sama sudah ada' }, { status: 400 });
    }

    const newSupplier = await globalPrisma.supplier.create({
      data: {
        code,
        name,
        contactPerson: contactPerson || null,
        address: address || null,
        phone: phone || null,
        email: email || null,
        storeId: masterStore.id
      }
    });

    return NextResponse.json({ supplier: newSupplier }, { status: 201 });
  } catch (error) {
    console.error('Error creating supplier for warehouse:', error);

    if (error.code === 'P2003' || error.code === 'P2025') {
      return NextResponse.json({ error: 'Store tidak ditemukan' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
