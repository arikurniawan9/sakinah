import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES, WAREHOUSE_STORE_ID } from '@/lib/constants';
import { logProductUpdate } from '@/lib/auditLogger';

// Helper to get or create the master store
async function getMasterStore() {
    // First, try to find the store using the official constant
    let masterStore = await prisma.store.findUnique({
        where: { code: WAREHOUSE_STORE_ID },
    });

    // If not found, try to find the old 'WHS-MASTER' store
    if (!masterStore) {
        masterStore = await prisma.store.findUnique({
            where: { code: 'WHS-MASTER' },
        });

        // If found, update its code to the official one for consistency
        if (masterStore) {
            masterStore = await prisma.store.update({
                where: { id: masterStore.id },
                data: { code: WAREHOUSE_STORE_ID }
            });
        }
    }

    // If still not found (neither official nor old existed), create a new one
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

// PUT - Update a warehouse product
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || ![ROLES.WAREHOUSE, ROLES.MANAGER].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { name, productCode, categoryId, supplierId, stock, purchasePrice, description, retailPrice, silverPrice, goldPrice, platinumPrice } = body;

    if (!name || !productCode || !categoryId) {
      return NextResponse.json({ error: 'Nama, kode produk, dan kategori wajib diisi' }, { status: 400 });
    }

    const masterStore = await getMasterStore();
    if (!masterStore) {
        return NextResponse.json({ error: 'Master store could not be configured.' }, { status: 500 });
    }

    // Check if product exists and belongs to the master store
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    if (existingProduct.storeId !== masterStore.id) {
      return NextResponse.json({ error: 'Anda tidak memiliki akses ke produk ini' }, { status: 403 });
    }

    // Check if product code is already used by another product in the same store (excluding current product)
    const duplicateProduct = await prisma.product.findFirst({
      where: {
        productCode,
        storeId: masterStore.id,
        id: { not: id } // Exclude current product
      }
    });

    if (duplicateProduct) {
      return NextResponse.json({ error: 'Kode produk sudah digunakan oleh produk lain' }, { status: 400 });
    }

    // Update the product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        productCode,
        categoryId,
        supplierId: supplierId || null,
        stock: stock || 0,
        purchasePrice: purchasePrice || 0,
        retailPrice: retailPrice || 0,
        silverPrice: silverPrice || 0,
        goldPrice: goldPrice || 0,
        platinumPrice: platinumPrice || 0,
        description: description || null,
        updatedAt: new Date()
      },
      include: { category: true, supplier: true }
    });

    const requestHeaders = new Headers(request.headers);
    await logProductUpdate(
      session.user.id,
      existingProduct, // old data
      updatedProduct, // new data
      masterStore.id,
      requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || '127.0.0.1',
      requestHeaders.get('user-agent') || ''
    );

    return NextResponse.json({
      success: true,
      product: updatedProduct,
      message: 'Produk berhasil diperbarui'
    });
  } catch (error) {
    console.error('Error updating warehouse product:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}