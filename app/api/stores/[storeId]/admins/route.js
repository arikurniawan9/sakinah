// app/api/stores/[storeId]/admins/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { ROLES } from '@/lib/constants';

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);

  // 1. Authenticate and authorize the manager
  if (!session || session.user.role !== ROLES.MANAGER) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { storeId } = params;
  const { username, password, employeeNumber, name } = await request.json();

  // 2. Validate input
  if (!username || !password) {
    return NextResponse.json({ error: 'Username dan password wajib diisi' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password minimal harus 6 karakter' }, { status: 400 });
  }

  try {
    // 3. Check for existing users and store admin
    const existingUserByUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUserByUsername) {
      return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 409 });
    }

    if (employeeNumber) {
        const existingUserByEmployeeNumber = await prisma.user.findUnique({ where: { employeeNumber } });
        if (existingUserByEmployeeNumber) {
            return NextResponse.json({ error: 'Kode pegawai sudah digunakan' }, { status: 409 });
        }
    }

    const existingAdmin = await prisma.storeUser.findFirst({
      where: {
        storeId: storeId,
        role: ROLES.ADMIN,
      },
    });

    if (existingAdmin) {
      return NextResponse.json({ error: 'Toko ini sudah memiliki admin' }, { status: 409 });
    }

    // 4. Create the new admin user and link to the store in a transaction
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name: name || `Admin ${username}`,
          username,
          password: hashedPassword,
          employeeNumber,
          role: ROLES.ADMIN,
          status: 'AKTIF',
        },
      });

      await tx.storeUser.create({
        data: {
          userId: createdUser.id,
          storeId: storeId,
          role: ROLES.ADMIN,
          status: 'ACTIVE',
          assignedBy: session.user.id,
        },
      });

      return createdUser;
    });

    // 5. Return success response
    return NextResponse.json({
        message: 'Akun admin berhasil dibuat',
        user: {
            id: newUser.id,
            username: newUser.username,
            name: newUser.name,
        }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating admin user:', error);
    // Prisma conflict error
    if (error.code === 'P2002') {
        return NextResponse.json({ error: 'Username atau Kode Pegawai sudah ada.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
