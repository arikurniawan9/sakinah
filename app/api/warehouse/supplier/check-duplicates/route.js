// app/api/warehouse/supplier/check-duplicates/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import globalPrisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let data;
    try {
      data = await request.json();
    } catch (parseError) {
      // Jika parsing JSON gagal, kembalikan array kosong
      console.warn('JSON parsing failed for check-duplicates:', parseError.message);
      return NextResponse.json({ duplicates: [] });
    }

    // Validasi bahwa data adalah array
    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ duplicates: [] });
    }

    // Get or create the central warehouse store (s1) for warehouse suppliers
    let warehouseStore = await globalPrisma.store.findFirst({
      where: { id: 's1' }
    });

    if (!warehouseStore) {
      // Create the warehouse store if it doesn't exist
      warehouseStore = await globalPrisma.store.create({
        data: {
          id: 's1',
          code: 'WH001',
          name: 'Gudang Pusat',
          description: 'Store untuk gudang pusat',
          status: 'ACTIVE'
        }
      });
    }

    const warehouseStoreId = warehouseStore.id;

    // Ekstrak semua kode dari data yang akan diimpor
    const codesToCheck = data
      .filter(item => item && typeof item === 'object' && item.code) // Pastikan item valid
      .map(item => item.code)
      .filter(code => code); // Filter kode yang tidak kosong

    if (codesToCheck.length === 0) {
      return NextResponse.json({ duplicates: [] });
    }

    // Cari supplier yang sudah ada dengan kode yang sama di toko ini
    const existingSuppliers = await globalPrisma.supplier.findMany({
      where: {
        code: { in: codesToCheck },
        storeId: warehouseStoreId
      },
      select: {
        code: true,
        name: true,
        contactPerson: true,
        phone: true,
        email: true,
        address: true
      }
    });

    return NextResponse.json({
      duplicates: existingSuppliers
    });
  } catch (error) {
    console.error('Error checking duplicate suppliers for warehouse:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}