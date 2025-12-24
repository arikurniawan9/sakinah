// app/api/warehouse/stock/export/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import globalPrisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Get or create the central warehouse
    let centralWarehouse = await globalPrisma.warehouse.findFirst({
      where: { name: 'Gudang Pusat' }
    });

    if (!centralWarehouse) {
      // Create the central warehouse if it doesn't exist
      centralWarehouse = await globalPrisma.warehouse.create({
        data: {
          name: 'Gudang Pusat',
          description: 'Gudang pusat untuk distribusi ke toko-toko',
          status: 'ACTIVE'
        }
      });
    }

    // Get all warehouse products with related data
    const warehouseProducts = await globalPrisma.warehouseProduct.findMany({
      where: {
        warehouseId: centralWarehouse.id,
        product: {
          storeId: 's1' // Only include products from default store
        }
      },
      include: {
        Product: {
          include: {
            category: true,
            supplier: true,
            priceTiers: {
              orderBy: {
                minQty: 'asc'
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform data for export
    const exportData = warehouseProducts.map(wp => {
      // Get the lowest price tier for display
      const lowestTier = wp.Product.priceTiers?.sort((a, b) => a.minQty - b.minQty)[0];
      return {
        'Kode Produk': wp.Product.productCode,
        'Nama Produk': wp.Product.name,
        'Stok': wp.quantity,
        'Stok Terpesan': wp.reserved,
        'Kategori': wp.Product.category?.name || '',
        'Supplier': wp.Product.supplier?.name || '',
        'Deskripsi': wp.Product.description || '',
        'Harga Beli': wp.Product.purchasePrice || 0,
        'Harga Jual': lowestTier?.price || 0,
        'Tanggal Dibuat': new Date(wp.createdAt).toLocaleDateString('id-ID'),
        'Tanggal Diubah': new Date(wp.updatedAt).toLocaleDateString('id-ID')
      };
    });

    return NextResponse.json({
      data: exportData,
      message: 'Data stok gudang berhasil diambil untuk ekspor',
      count: exportData.length
    });
  } catch (error) {
    console.error('Error exporting warehouse stocks:', error);
    return NextResponse.json({ error: `Gagal mengekspor stok produk: ${error.message}` }, { status: 500 });
  }
}