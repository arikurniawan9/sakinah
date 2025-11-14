// app/api/supplier/[id]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

// GET: Fetch a specific supplier by ID
export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'CASHIER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supplier = await prisma.supplier.findUnique({
      where: {
        id: params.id
      },
      include: {
        products: {
          select: {
            id: true
          }
        }
      }
    });

    // Add product count to supplier data
    const supplierWithProductCount = supplier ? {
      ...supplier,
      productCount: supplier.products.length
    } : null;

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ supplier: supplierWithProductCount });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}

// PUT: Update a specific supplier by ID
export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();

    // Validation
    if (!data.name || !data.phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    const updatedSupplier = await prisma.supplier.update({
      where: {
        id: params.id
      },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Supplier berhasil diperbarui',
      supplier: updatedSupplier
    });
  } catch (error) {
    console.error('Error updating supplier:', error);

    // Check for different types of Prisma errors
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Supplier tidak ditemukan' }, { status: 404 });
    } else if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Nama supplier sudah digunakan' }, { status: 400 });
    }

    // Return a proper JSON error for any other types of errors
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}

// DELETE: Delete a specific supplier by ID
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if supplier has associated products
    const productsWithSupplier = await prisma.product.count({
      where: {
        supplierId: params.id
      }
    });

    if (productsWithSupplier > 0) {
      return NextResponse.json({ 
        error: 'Tidak dapat menghapus supplier karena masih terdapat produk yang terkait' 
      }, { status: 400 });
    }

    // Delete the supplier
    await prisma.supplier.delete({
      where: {
        id: params.id
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Supplier berhasil dihapus' 
    });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Supplier tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}