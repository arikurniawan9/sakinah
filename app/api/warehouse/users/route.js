// app/api/warehouse/users/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES, WAREHOUSE_STORE_ID } from '@/lib/constants';
import bcrypt from 'bcryptjs';
import { logActivity } from '@/lib/auditTrail';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.WAREHOUSE) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    const search = url.searchParams.get('search') || '';
    const role = url.searchParams.get('role') || '';

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
        { username: { contains: search, mode: 'insensitive' } },
        { employeeNumber: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Default roles if no specific role is requested
    let rolesToFetch = [ROLES.ATTENDANT, ROLES.WAREHOUSE, ROLES.CASHIER];

    // If a specific role is provided in the query, override the default
    if (role) {
      // Jika role spesifik diminta, hanya ambil role tersebut
      rolesToFetch = [role];
    }

    whereClause.role = {
      in: rolesToFetch
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
          status: true,
          employeeNumber: true,
          createdAt: true,
          updatedAt: true
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where: whereClause })
    ]);

    return new Response(JSON.stringify({ 
      users, 
      total,
      page,
      totalPages: Math.ceil(total / limit)
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.WAREHOUSE) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await request.json();

    // Validasi input
    if (!data.name || !data.username || !data.password) {
      return new Response(JSON.stringify({ error: 'Nama, username, dan password wajib diisi' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validasi role - hanya boleh membuat role tertentu
    if (!['ATTENDANT', 'WAREHOUSE', 'CASHIER'].includes(data.role)) {
      return new Response(JSON.stringify({ error: 'Role tidak valid untuk pengguna gudang' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Untuk user yang dibuat di warehouse, pastikan mereka disimpan dengan role WAREHOUSE
    // Tapi kita tetap izinkan role ATTENDANT dan CASHIER untuk keperluan spesifik
    // Jika role adalah ATTENDANT atau CASHIER, kita tetap simpan dengan role tersebut
    // Tapi jika role adalah WAREHOUSE, kita simpan dengan role WAREHOUSE

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Tentukan storeId berdasarkan role
    let storeIdToUse = null;

    // Untuk role ATTENDANT dan CASHIER, kita tetap perlu storeId
    if (data.role === 'ATTENDANT' || data.role === 'CASHIER') {
      // Kita bisa menggunakan store default untuk role ini
      const defaultStore = await prisma.store.findFirst({
        where: { code: 'GM001' } // Gunakan kode warehouse store
      });

      if (!defaultStore) {
        // Jika tidak ada default store, buat satu
        const newStore = await prisma.store.create({
          data: {
            name: 'Warehouse Master Store',
            code: 'GM001',
            description: 'Master store for warehouse operations'
          }
        });
        storeIdToUse = newStore.id;
      } else {
        storeIdToUse = defaultStore.id;
      }
    }

    // Buat user baru
    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        username: data.username,
        email: data.email || null,
        password: hashedPassword,
        role: data.role,
        status: data.status || 'AKTIF',
        employeeNumber: data.employeeNumber || null,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        status: true,
        employeeNumber: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Jika storeId ditentukan, buat relasi ke store melalui tabel storeUser
    if (storeIdToUse) {
      await prisma.storeUser.create({
        data: {
          userId: newUser.id,
          storeId: storeIdToUse,
          role: data.role, // Gunakan role yang sama dengan user
          status: data.status || 'ACTIVE'
        }
      });
    }

    // Dapatkan warehouse store untuk mencatat aktivitas
    const warehouseStore = await prisma.store.findFirst({
      where: { code: 'GM001' } // Gunakan kode warehouse store
    });

    // Jika warehouse store tidak ditemukan, cari store pertama
    let storeIdForActivity = warehouseStore?.id;
    if (!storeIdForActivity) {
      const firstStore = await prisma.store.findFirst();
      storeIdForActivity = firstStore?.id;
    }

    // Catat aktivitas
    await logActivity(
      session.user.id,
      'CREATE',
      'USER',
      newUser.id,
      `Pengguna "${newUser.name}" dibuat dengan role ${newUser.role}`,
      null,
      { ...newUser },
      storeIdForActivity
    );

    return new Response(JSON.stringify(newUser), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating user:', error);

    if (error.code === 'P2002') {
      // Unique constraint violation
      return new Response(JSON.stringify({ error: 'Username sudah digunakan' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Internal Server Error: ' + error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.WAREHOUSE) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const userId = url.pathname.split('/').pop(); // Ambil ID dari path

    // Validasi ID
    if (!userId) {
      return new Response(JSON.stringify({ error: 'ID pengguna tidak valid' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await request.json();

    // Ambil data user sebelum update
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        status: true,
        employeeNumber: true
      }
    });

    if (!existingUser) {
      return new Response(JSON.stringify({ error: 'Pengguna tidak ditemukan' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validasi role - hanya boleh membuat role tertentu
    if (!['ATTENDANT', 'WAREHOUSE', 'CASHIER'].includes(data.role)) {
      return new Response(JSON.stringify({ error: 'Role tidak valid untuk pengguna gudang' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Tentukan storeId berdasarkan role
    let storeIdToUse = null;

    // Untuk role ATTENDANT dan CASHIER, kita tetap perlu storeId
    if (data.role === 'ATTENDANT' || data.role === 'CASHIER') {
      // Kita bisa menggunakan store default untuk role ini
      const defaultStore = await prisma.store.findFirst({
        where: { code: 'GM001' } // Gunakan kode warehouse store
      });

      if (!defaultStore) {
        // Jika tidak ada default store, buat satu
        const newStore = await prisma.store.create({
          data: {
            name: 'Warehouse Master Store',
            code: 'GM001',
            description: 'Master store for warehouse operations'
          }
        });
        storeIdToUse = newStore.id;
      } else {
        storeIdToUse = defaultStore.id;
      }
    }

    // Siapkan data update
    const updateData = {
      name: data.name,
      username: data.username,
      email: data.email,
      role: data.role,
      status: data.status,
      employeeNumber: data.employeeNumber,
    };

    // Jika password disertakan, hash dulu
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        status: true,
        employeeNumber: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Jika storeId ditentukan, perbarui atau buat relasi ke store melalui tabel storeUser
    if (storeIdToUse) {
      const existingStoreUser = await prisma.storeUser.findFirst({
        where: {
          userId: userId,
        }
      });

      if (existingStoreUser) {
        // Update relasi yang sudah ada
        await prisma.storeUser.update({
          where: { id: existingStoreUser.id },
          data: {
            storeId: storeIdToUse,
            role: data.role,
            status: data.status
          }
        });
      } else {
        // Buat relasi baru
        await prisma.storeUser.create({
          data: {
            userId: updatedUser.id,
            storeId: storeIdToUse,
            role: data.role,
            status: data.status
          }
        });
      }
    }

    // Dapatkan warehouse store untuk mencatat aktivitas
    const warehouseStore = await prisma.store.findFirst({
      where: { code: 'GM001' } // Gunakan kode warehouse store
    });

    // Jika warehouse store tidak ditemukan, cari store pertama
    let storeIdForActivity = warehouseStore?.id;
    if (!storeIdForActivity) {
      const firstStore = await prisma.store.findFirst();
      storeIdForActivity = firstStore?.id;
    }

    // Catat aktivitas
    await logActivity(
      session.user.id,
      'UPDATE',
      'USER',
      updatedUser.id,
      `Data pengguna "${updatedUser.name}" diperbarui`,
      { ...existingUser },
      { ...updatedUser },
      storeIdForActivity
    );

    return new Response(JSON.stringify(updatedUser), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating user:', error);

    if (error.code === 'P2002') {
      // Unique constraint violation
      return new Response(JSON.stringify({ error: 'Username sudah digunakan' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Internal Server Error: ' + error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

