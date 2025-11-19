// app/api/stores/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import globalPrisma from '@/lib/prisma';
import { getTenantPrismaClient } from '@/utils/tenantUtils';
import { ROLES } from '@/lib/constants';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Hanya MANAGER yang bisa melihat semua toko
    if (session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const stores = await globalPrisma.store.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ stores });
  } catch (error) {
    console.error('Error fetching stores:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Hanya MANAGER yang bisa membuat toko
    if (session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, address, phone, email } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nama toko wajib diisi' }, { status: 400 });
    }

    // Buat toko baru
    const newStore = await globalPrisma.store.create({
      data: {
        name,
        description: description || null,
        address: address || null,
        phone: phone || null,
        email: email || null,
        status: 'ACTIVE',
      },
    });

    // Assign the creating manager as an ADMIN to the new store
    await globalPrisma.storeUser.create({
      data: {
        userId: session.user.id,
        storeId: newStore.id,
        role: ROLES.ADMIN, // Manager becomes admin of the new store
        assignedBy: session.user.id,
      },
    });

    // Create default settings for the new store
    await globalPrisma.setting.create({
      data: {
        storeId: newStore.id,
        shopName: newStore.name,
        address: newStore.address,
        phone: newStore.phone,
        // Other default settings can be added here
      },
    });
    

    return NextResponse.json({ 
      success: true, 
      store: newStore,
      message: 'Toko berhasil dibuat' 
    });
  } catch (error) {
    console.error('Error creating store:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}