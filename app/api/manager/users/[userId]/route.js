import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES, WAREHOUSE_STORE_ID } from '@/lib/constants';
import bcrypt from 'bcryptjs';
import { logActivity } from '@/lib/auditTrail';

export async function GET(request, { params }) {
  const { userId } = await params;
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== ROLES.MANAGER) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        stores: {
          select: {
            storeId: true,
            role: true,
            assignedAt: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Do not expose password hash
    const { password, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== ROLES.MANAGER) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId } = await params;

  if (userId === session.user.id) {
    return NextResponse.json({ error: "You cannot edit your own account here. Please use the profile page." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, username, employeeNumber, phone, address, role, status, password } = body;

    // Validasi panjang nomor telepon
    if (phone && phone.trim() !== '' && phone.trim().length > 13) {
      return NextResponse.json({ error: 'Nomor telepon maksimal 13 karakter' }, { status: 400 });
    }

    const userToUpdate = await prisma.user.findUnique({ where: { id: userId } });
    if (!userToUpdate) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only allow updating global roles via this endpoint
    const validGlobalRoles = [ROLES.WAREHOUSE, ROLES.MANAGER];
    if (role && !validGlobalRoles.includes(role)) {
       return NextResponse.json({ error: `Cannot assign a store-specific role via this endpoint.` }, { status: 400 });
    }

    const updateData = {
      name,
      username,
      employeeNumber,
      phone,
      address,
      role,
      status,
    };

    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    return NextResponse.json(userWithoutPassword);

  } catch (error) {
    console.error(`Error updating user ${userId}:`, error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== ROLES.MANAGER) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId } = await params;

  if (userId === session.user.id) {
    return NextResponse.json({ error: "You cannot delete your own account." }, { status: 403 });
  }

  try {
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
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Jangan hapus user manager
    if (userToDelete.role === ROLES.MANAGER) {
      return NextResponse.json({ error: 'Tidak dapat menghapus pengguna dengan role MANAGER' }, { status: 400 });
    }

    // Update status menjadi INAKTIF alih-alih menghapus
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status: 'INAKTIF' },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        status: true
      }
    });

    // Dapatkan storeId untuk mencatat aktivitas
    // Untuk operasi manager, kita bisa menggunakan store default
    const defaultStore = await prisma.store.findFirst({
      where: { code: 'GM001' } // Gunakan kode warehouse store sebagai default
    });

    let storeIdForActivity = defaultStore?.id;
    if (!storeIdForActivity) {
      // Jika tidak ada default store, cari store pertama
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
    console.error(`Error deleting user ${userId}:`, error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}