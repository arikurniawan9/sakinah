// app/api/manager/stores/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';
import { logActivity } from '@/lib/auditTrail';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.MANAGER) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const sortKey = url.searchParams.get('sortKey') || 'createdAt';
    const sortDirection = url.searchParams.get('sortDirection') || 'desc';

    // Validasi input
    if (page < 1 || limit < 1 || limit > 100) {
      return new Response(JSON.stringify({ error: 'Parameter halaman atau batas tidak valid' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Bangun where clause
    const whereClause = {};
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (status) {
      whereClause.status = status;
    }

    // Bangun order clause
    const orderBy = {};
    if (['name', 'code', 'status', 'createdAt', 'updatedAt'].includes(sortKey)) {
      orderBy[sortKey] = sortDirection.toLowerCase() === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.createdAt = 'desc'; // default
    }

    const [stores, total] = await Promise.all([
      prisma.store.findMany({
        where: whereClause,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          // Tambahkan jumlah pengguna terkait dengan toko ini
          _count: {
            select: {
              storeUsers: {
                where: {
                  status: 'ACTIVE'
                }
              }
            }
          }
        }
      }),
      prisma.store.count({ where: whereClause })
    ]);

    // Tambahkan jumlah pengguna ke setiap toko
    const storesWithUserCount = stores.map(store => ({
      ...store,
      userCount: store._count.storeUsers
    }));

    return new Response(JSON.stringify({ 
      stores: storesWithUserCount, 
      total,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching stores:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.MANAGER) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await request.json();

    // Validasi input
    if (!data.name || !data.code) {
      return new Response(JSON.stringify({ error: 'Nama dan kode toko wajib diisi' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validasi unik kode toko
    const existingStore = await prisma.store.findUnique({
      where: { code: data.code }
    });

    if (existingStore) {
      return new Response(JSON.stringify({ error: 'Kode toko sudah digunakan' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
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

    return new Response(JSON.stringify(newStore), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating store:', error);
    
    if (error.code === 'P2002') {
      // Unique constraint violation
      return new Response(JSON.stringify({ error: 'Kode toko sudah digunakan' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.MANAGER) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const storeId = url.pathname.split('/').pop(); // Ambil ID dari path

    // Validasi ID
    if (!storeId) {
      return new Response(JSON.stringify({ error: 'ID toko tidak valid' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await request.json();

    // Ambil data toko sebelum update
    const existingStore = await prisma.store.findUnique({
      where: { id: storeId }
    });

    if (!existingStore) {
      return new Response(JSON.stringify({ error: 'Toko tidak ditemukan' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
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

    return new Response(JSON.stringify(updatedStore), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating store:', error);
    
    if (error.code === 'P2002') {
      // Unique constraint violation
      return new Response(JSON.stringify({ error: 'Kode toko sudah digunakan' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.MANAGER) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const storeId = url.pathname.split('/').pop(); // Ambil ID dari path

    // Validasi ID
    if (!storeId) {
      return new Response(JSON.stringify({ error: 'ID toko tidak valid' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Ambil data toko sebelum dihapus
    const storeToDelete = await prisma.store.findUnique({
      where: { id: storeId }
    });

    if (!storeToDelete) {
      return new Response(JSON.stringify({ error: 'Toko tidak ditemukan' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
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

    return new Response(JSON.stringify({ 
      message: 'Toko berhasil dinonaktifkan',
      store: updatedStore 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting store:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}