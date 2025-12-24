export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import globalPrisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

// PUT - Update a warehouse supplier
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only WAREHOUSE or MANAGER roles can access this API
    if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

    const { id } = params;
    const body = await request.json();
    const { name, contactPerson, address, phone, email } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'Nama supplier wajib diisi' }, { status: 400 });
    }

    // Check if the supplier exists and belongs to the user's store
    const existingSupplier = await globalPrisma.supplier.findFirst({
      where: {
        id: id,
        storeId: warehouseStoreId
      }
    });

    if (!existingSupplier) {
      return NextResponse.json({ error: 'Supplier tidak ditemukan atau tidak memiliki akses' }, { status: 404 });
    }

    // Update the supplier in the database
    const updatedSupplier = await globalPrisma.supplier.update({
      where: {
        id: id
      },
      data: {
        name,
        contactPerson: contactPerson || null,
        address: address || null,
        phone: phone || null,
        email: email || null,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ supplier: updatedSupplier });
  } catch (error) {
    console.error('Error updating supplier for warehouse:', error);

    // Check if this is a Prisma-specific error
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Supplier tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a warehouse supplier
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only WAREHOUSE or MANAGER roles can access this API
    if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

    const { id } = params;

    // Check if the supplier exists and belongs to the user's store
    const existingSupplier = await globalPrisma.supplier.findFirst({
      where: {
        id: id,
        storeId: warehouseStoreId
      }
    });

    if (!existingSupplier) {
      return NextResponse.json({ error: 'Supplier tidak ditemukan atau tidak memiliki akses' }, { status: 404 });
    }

    // Delete the supplier from the database
    await globalPrisma.supplier.delete({
      where: {
        id: id
      }
    });

    return NextResponse.json({
      message: 'Supplier berhasil dihapus dari gudang',
      deletedId: id
    });
  } catch (error) {
    console.error('Error deleting supplier for warehouse:', error);

    // Check if this is a Prisma-specific error
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Supplier tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}