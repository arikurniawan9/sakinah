// app/api/manager/stores/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';
import { logActivity } from '@/lib/auditTrail'; // Re-add this import

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const sortKey = searchParams.get('sortKey') || 'createdAt';
    const sortDirection = searchParams.get('sortDirection') || 'desc';
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * limit;

    const whereClause = {
      ...(status && { status: status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [stores, total] = await prisma.$transaction([
      prisma.store.findMany({
        where: whereClause,
        orderBy: {
          [sortKey]: sortDirection,
        },
        skip: skip,
        take: limit,
      }),
      prisma.store.count({
        where: whereClause,
      }),
    ]);

    return NextResponse.json({
      stores,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching stores:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });      
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Validasi input
    if (!data.name || !data.code) {
      return NextResponse.json({ error: 'Nama dan kode toko wajib diisi' }, { 
        status: 400,
      });
    }

    // Validasi unik kode toko
    const existingStore = await prisma.store.findUnique({
      where: { code: data.code }
    });

    if (existingStore) {
      return NextResponse.json({ error: 'Kode toko sudah digunakan' }, {      
        status: 400,
      });
    }

    // Buat toko baru
    const newStore = await prisma.store.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description || null,
        address: data.address || null,
        phone: data.phone || null,
        email: data.email || null,
        status: data.status || 'ACTIVE'
      }
    });

    // Catat aktivitas
    await logActivity(
      session.user.id,
      'CREATE',
      'STORE',
      newStore.id,
      `Toko "${newStore.name}" dibuat`,
      null,
      { ...newStore }
    );

    return NextResponse.json(newStore, {
      status: 201,
    });
  } catch (error) {
    console.error('Error creating store:', error);

    if (error.code === 'P2002') {
      // Unique constraint violation
      return NextResponse.json({ error: 'Kode toko sudah digunakan' }, {      
        status: 400,
      });
    }

    return NextResponse.json({ error: 'Internal Server Error' }, {
      status: 500,
    });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const storeId = url.pathname.split('/').pop(); // Ambil ID dari path

    // Validasi ID
    if (!storeId) {
      return NextResponse.json({ error: 'ID toko tidak valid' }, {
        status: 400,
      });
    }

    const data = await request.json();

    // Ambil data toko sebelum update
    const existingStore = await prisma.store.findUnique({
      where: { id: storeId }
    });

    if (!existingStore) {
      return NextResponse.json({ error: 'Toko tidak ditemukan' }, {
        status: 404,
      });
    }

    // Update toko
    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: {
        name: data.name,
        description: data.description,
        address: data.address,
        phone: data.phone,
        email: data.email,
        status: data.status
      }
    });

    // Catat aktivitas
    await logActivity(
      session.user.id,
      'UPDATE',
      'STORE',
      updatedStore.id,
      `Data toko "${updatedStore.name}" diperbarui`,
      { ...existingStore },
      { ...updatedStore }
    );

    return NextResponse.json(updatedStore, {
      status: 200,
    });
  } catch (error) {
    console.error('Error updating store:', error);

    if (error.code === 'P2002') {
      // Unique constraint violation
      return NextResponse.json({ error: 'Kode toko sudah digunakan' }, {      
        status: 400,
      });
    }

    return NextResponse.json({ error: 'Internal Server Error' }, {
      status: 500,
    });
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const storeId = url.pathname.split('/').pop(); // Ambil ID dari path

    // Validasi ID
    if (!storeId) {
      return NextResponse.json({ error: 'ID toko tidak valid' }, {
        status: 400,
      });
    }

    // Ambil data toko sebelum dihapus
    const storeToDelete = await prisma.store.findUnique({
      where: { id: storeId }
    });

    if (!storeToDelete) {
      return NextResponse.json({ error: 'Toko tidak ditemukan' }, {
        status: 404,
      });
    }

    // Update status menjadi INACTIVE alih-alih menghapus
    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: { status: 'INACTIVE' }
    });

    // Catat aktivitas
    await logActivity(
      session.user.id,
      'DELETE',
      'STORE',
      updatedStore.id,
      `Toko "${updatedStore.name}" dinonaktifkan`,
      { ...storeToDelete },
      { ...updatedStore }
    );

    return NextResponse.json({
      message: 'Toko berhasil dinonaktifkan',
      store: updatedStore
    }, {
      status: 200,
    });
  } catch (error) {
    console.error('Error deleting store:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, {
      status: 500,
    });
  }
}
