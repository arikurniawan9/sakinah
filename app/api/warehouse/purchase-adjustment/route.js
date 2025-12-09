// app/api/warehouse/purchase-adjustment/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { logWarehouseStockAdjustment } from '@/lib/auditLogger';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['WAREHOUSE', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, warehouseId, quantity, purchasePrice } = body;

    // Validasi input
    if (!productId || !warehouseId || typeof quantity !== 'number' || quantity <= 0) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }

    // Cek apakah warehouse product sudah ada
    const existingWarehouseProduct = await prisma.warehouseProduct.findFirst({
      where: {
        productId,
        warehouseId,
      },
    });

    if (existingWarehouseProduct) {
      // Update existing warehouse product
      const updatedWarehouseProduct = await prisma.warehouseProduct.update({
        where: {
          id: existingWarehouseProduct.id,
        },
        data: {
          quantity: existingWarehouseProduct.quantity + quantity,
          updatedAt: new Date(),
        },
      });

      // Jika purchasePrice disediakan, update harga beli produk
      if (purchasePrice !== undefined && purchasePrice > 0) {
        await prisma.product.update({
          where: {
            id: productId,
          },
          data: {
            purchasePrice,
            updatedAt: new Date(),
          },
        });
      }

      // Ambil data lengkap untuk response
      const warehouseProductWithDetails = await prisma.warehouseProduct.findUnique({
        where: {
          id: updatedWarehouseProduct.id,
        },
        include: {
          product: {
            include: {
              category: true,
            }
          },
        },
      });

      // Log aktivitas penyesuaian stok gudang
      const requestHeaders = new Headers(request.headers);
      const ipAddress = requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || '127.0.0.1';
      const userAgent = requestHeaders.get('user-agent') || '';

      await logWarehouseStockAdjustment(
        session.user.id,
        {
          id: updatedWarehouseProduct.id,
          warehouseId,
          productId,
          quantity: quantity,
          adjustmentType: 'PURCHASE_ADJUSTMENT',
          reason: 'Pembelian produk ke gudang',
          adjustedAt: new Date(),
          adjustedBy: session.user.id,
        },
        ipAddress,
        userAgent,
        warehouseProductWithDetails.product.storeId
      );

      return NextResponse.json({
        message: 'Stok gudang berhasil diperbarui',
        warehouseProduct: warehouseProductWithDetails
      });
    } else {
      // Buat warehouse product baru
      const newWarehouseProduct = await prisma.warehouseProduct.create({
        data: {
          productId,
          warehouseId,
          quantity,
          reserved: 0,
        },
      });

      // Jika purchasePrice disediakan, update harga beli produk
      if (purchasePrice !== undefined && purchasePrice > 0) {
        await prisma.product.update({
          where: {
            id: productId,
          },
          data: {
            purchasePrice,
            updatedAt: new Date(),
          },
        });
      }

      // Ambil data lengkap untuk response
      const warehouseProductWithDetails = await prisma.warehouseProduct.findUnique({
        where: {
          id: newWarehouseProduct.id,
        },
        include: {
          product: {
            include: {
              category: true,
            }
          },
        },
      });

      // Log aktivitas penyesuaian stok gudang
      const requestHeaders = new Headers(request.headers);
      const ipAddress = requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || '127.0.0.1';
      const userAgent = requestHeaders.get('user-agent') || '';

      await logWarehouseStockAdjustment(
        session.user.id,
        {
          id: newWarehouseProduct.id,
          warehouseId,
          productId,
          quantity: quantity,
          adjustmentType: 'PURCHASE_ADJUSTMENT',
          reason: 'Pembelian produk ke gudang',
          adjustedAt: new Date(),
          adjustedBy: session.user.id,
        },
        ipAddress,
        userAgent,
        warehouseProductWithDetails.product.storeId
      );

      return NextResponse.json({
        message: 'Produk gudang berhasil ditambahkan',
        warehouseProduct: warehouseProductWithDetails
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error adjusting warehouse stock from purchase:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}