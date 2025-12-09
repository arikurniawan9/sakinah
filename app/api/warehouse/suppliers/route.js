export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import globalPrisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only WAREHOUSE or MANAGER roles can access this API
    if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch suppliers for the user's store only
    const suppliers = await globalPrisma.supplier.findMany({
      where: {
        storeId: session.user.storeId
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ suppliers });
  } catch (error) {
    console.error('Error fetching suppliers for warehouse:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only WAREHOUSE or MANAGER roles can access this API
    if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { code, name, contactPerson, address, phone, email } = body;

    // Validate required fields
    if (!code || !name) {
      return NextResponse.json({ error: 'Kode dan nama supplier wajib diisi' }, { status: 400 });
    }

    // Check if a supplier with the same code already exists in the store
    const existingSupplier = await globalPrisma.supplier.findFirst({
      where: {
        code: code,
        storeId: session.user.storeId
      }
    });

    if (existingSupplier) {
      return NextResponse.json({ error: 'Supplier dengan kode yang sama sudah ada' }, { status: 400 });
    }

    // Create the new supplier in the database
    const newSupplier = await globalPrisma.supplier.create({
      data: {
        code,
        name,
        contactPerson: contactPerson || null,
        address: address || null,
        phone: phone || null,
        email: email || null,
        storeId: session.user.storeId
      }
    });

    return NextResponse.json({ supplier: newSupplier }, { status: 201 });
  } catch (error) {
    console.error('Error creating supplier for warehouse:', error);

    // Check if this is a Prisma-specific error
    if (error.code === 'P2003' || error.code === 'P2025') {
      return NextResponse.json({ error: 'Store tidak ditemukan' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
