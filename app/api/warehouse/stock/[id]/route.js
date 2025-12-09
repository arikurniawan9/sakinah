// app/api/warehouse/stock/[id]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

// GET - Get a single warehouse product
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['WAREHOUSE', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const warehouseProduct = await prisma.warehouseProduct.findUnique({
      where: {
        id: params.id,
      },
      include: {
        product: {
          include: {
            category: true,
          }
        },
      },
    });

    if (!warehouseProduct) {
      return NextResponse.json({ error: 'Warehouse product not found' }, { status: 404 });
    }

    return NextResponse.json({ warehouseProduct });
  } catch (error) {
    console.error('Error fetching warehouse product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update warehouse product
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['WAREHOUSE', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { quantity, reserved, addQuantity } = body; // addQuantity for adding to existing stock

    // Dapatkan data warehouse product yang lama untuk mendapatkan jumlah saat ini
    const existingWarehouseProduct = await prisma.warehouseProduct.findUnique({
      where: { id: params.id },
    });

    if (!existingWarehouseProduct) {
      return NextResponse.json({ error: 'Warehouse product not found' }, { status: 404 });
    }

    // Tentukan jumlah stok baru berdasarkan mode
    let newQuantity = existingWarehouseProduct.quantity;
    if (typeof addQuantity === 'number' && addQuantity !== 0) {
      // Mode menambahkan ke stok yang ada
      newQuantity = existingWarehouseProduct.quantity + addQuantity;
      // Pastikan jumlah baru tidak negatif
      if (newQuantity < 0) {
        return NextResponse.json({ error: 'Quantity cannot be negative after addition' }, { status: 400 });
      }
    } else if (typeof quantity === 'number' && quantity >= 0) {
      // Mode penggantian jumlah stok (mode lama)
      newQuantity = quantity;
    } else if (typeof reserved === 'number' && reserved >= 0) {
      // Jika hanya reserved yang diupdate, biarkan quantity tetap
      newQuantity = existingWarehouseProduct.quantity;
    }

    // Validasi jumlah reserved tidak melebihi jumlah stok
    const newReserved = reserved !== undefined ? reserved : existingWarehouseProduct.reserved;
    if (newReserved > newQuantity) {
      return NextResponse.json({ error: 'Reserved quantity cannot exceed available quantity' }, { status: 400 });
    }

    // Update warehouse product
    await prisma.warehouseProduct.update({
      where: {
        id: params.id,
      },
      data: {
        quantity: newQuantity,
        reserved: newReserved,
        updatedAt: new Date(),
      },
    });

    // Ambil data terbaru untuk response
    const warehouseProductWithDetails = await prisma.warehouseProduct.findUnique({
      where: {
        id: params.id,
      },
      include: {
        product: {
          include: {
            category: true,
          }
        },
      },
    });

    return NextResponse.json({
      message: 'Warehouse product updated successfully',
      warehouseProduct: warehouseProductWithDetails
    });
  } catch (error) {
    console.error('Error updating warehouse product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete warehouse product
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['WAREHOUSE', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use findUniqueOrThrow to check if the record exists before deletion
    const warehouseProduct = await prisma.warehouseProduct.findUnique({
      where: { id: params.id },
    });

    if (!warehouseProduct) {
      return NextResponse.json({ error: 'Warehouse product not found' }, { status: 404 });
    }

    // Attempt to delete the warehouse product
    const deletedProduct = await prisma.warehouseProduct.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({
      message: 'Warehouse product deleted successfully',
      warehouseProduct: deletedProduct
    });
  } catch (error) {
    // Specifically handle the case where the record doesn't exist
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Warehouse product not found or already deleted' }, { status: 404 });
    }

    console.error('Error deleting warehouse product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}