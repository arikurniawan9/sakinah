import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

// GET - Get a specific warehouse product
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const product = await prisma.product.findFirst({
      where: {
        id: params.id,
        storeId: 'WAREHOUSE_MASTER_STORE' // Ensure it's a warehouse product
      },
      include: {
        category: true,
        supplier: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
            username: true,
          }
        }
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Produk tidak ditemukan atau bukan produk gudang' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error fetching warehouse product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update a warehouse product
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, productCode, categoryId, supplierId, stock, purchasePrice } = body;

    // Check if product exists and belongs to warehouse
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: params.id,
        storeId: 'WAREHOUSE_MASTER_STORE'
      }
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Produk tidak ditemukan atau bukan produk gudang' }, { status: 404 });
    }

    // Check if product code is being changed and already exists for other product
    if (productCode && productCode !== existingProduct.productCode) {
      const duplicateProduct = await prisma.product.findFirst({
        where: {
          productCode,
          storeId: 'WAREHOUSE_MASTER_STORE',
          id: { not: params.id } // Exclude current product
        }
      });

      if (duplicateProduct) {
        return NextResponse.json({ error: 'Kode produk sudah digunakan' }, { status: 400 });
      }
    }

    // Update the product
    const updatedProduct = await prisma.product.update({
      where: {
        id: params.id
      },
      data: {
        name,
        productCode,
        categoryId,
        supplierId,
        stock,
        purchasePrice,
        updatedBy: session.user.id
      },
      include: {
        category: true,
        supplier: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
            username: true,
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      product: updatedProduct,
      message: 'Produk berhasil diperbarui'
    });
  } catch (error) {
    console.error('Error updating warehouse product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a warehouse product
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if product exists and belongs to warehouse
    const product = await prisma.product.findFirst({
      where: {
        id: params.id,
        storeId: 'WAREHOUSE_MASTER_STORE'
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Produk tidak ditemukan atau bukan produk gudang' }, { status: 404 });
    }

    // Delete the product
    await prisma.product.delete({
      where: {
        id: params.id
      }
    });

    // Also delete related warehouse product record if it exists
    try {
      await prisma.warehouseProduct.deleteMany({
        where: {
          productId: params.id
        }
      });
    } catch (e) {
      // If warehouse product doesn't exist, continue with the operation
      console.log('No warehouse product found to delete, continuing...');
    }

    return NextResponse.json({
      success: true,
      message: 'Produk berhasil dihapus dari gudang'
    });
  } catch (error) {
    console.error('Error deleting warehouse product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}