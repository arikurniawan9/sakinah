import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';
import { logActivity } from '@/lib/auditTrail';

export async function GET(request, { params }) {
  try {
    const { id: userId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.WAREHOUSE) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id: userId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.WAREHOUSE) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    // Validasi role - hanya boleh membuat role tertentu
    if (!['ATTENDANT', 'WAREHOUSE', 'CASHIER'].includes(data.role)) {
      return NextResponse.json({ error: 'Role tidak valid untuk pengguna gudang' }, { status: 400 });
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
      const bcrypt = await import('bcryptjs');
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

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);

    if (error.code === 'P2002') {
      // Unique constraint violation
      return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal Server Error: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id: userId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.WAREHOUSE) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ambil data user sebelum dihapus
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        role: true
      }
    });

    if (!userToDelete) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    // Update status menjadi TIDAK_AKTIF alih-alih menghapus
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status: 'TIDAK_AKTIF' },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        status: true
      }
    });

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
      'DELETE',
      'USER',
      updatedUser.id,
      `Pengguna "${updatedUser.name}" dinonaktifkan`,
      { ...userToDelete },
      { ...updatedUser },
      storeIdForActivity
    );

    return NextResponse.json({
      message: 'Pengguna berhasil dinonaktifkan',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal Server Error: ' + error.message }, { status: 500 });
  }
}