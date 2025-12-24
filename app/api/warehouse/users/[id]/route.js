// app/api/warehouse/users/[id]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { ROLES, WAREHOUSE_STORE_ID } from '@/lib/constants';

// PUT /api/warehouse/users/[id] - Update a user for warehouse
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only WAREHOUSE and MANAGER roles can update warehouse users
    if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the warehouse store
    let warehouseStore = await prisma.store.findFirst({
      where: { code: WAREHOUSE_STORE_ID },
    });

    if (!warehouseStore) {
      // Create the warehouse store if it doesn't exist
      warehouseStore = await prisma.store.create({
        data: {
          name: 'Warehouse Master Store',
          code: WAREHOUSE_STORE_ID,
          description: 'Master store for warehouse operations',
        }
      });
    }

    const warehouseStoreId = warehouseStore.id;
    const { id } = params; // Get ID from URL parameter

    const { name, username, employeeNumber, password, role, code, address, phone } = await request.json();

    // Validation
    if (!id) {
      return NextResponse.json(
        { error: 'ID user wajib disediakan' },
        { status: 400 }
      );
    }

    if (!name || !username || !role) {
      return NextResponse.json(
        { error: 'Nama, username, dan role wajib diisi' },
        { status: 400 }
      );
    }

    // Validate role - only allow warehouse-specific roles
    const validWarehouseRoles = [ROLES.CASHIER, ROLES.ATTENDANT];
    if (!validWarehouseRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Role tidak valid untuk warehouse' },
        { status: 400 }
      );
    }

    // Check if user exists and is associated with the warehouse store
    const storeUser = await prisma.storeUser.findFirst({
      where: {
        userId: id,
        storeId: warehouseStoreId,
      }
    });

    if (!storeUser) {
      return NextResponse.json(
        { error: 'User tidak ditemukan di warehouse' },
        { status: 404 }
      );
    }

    // Check if username already exists (excluding current user)
    const existingUser = await prisma.user.findFirst({
      where: {
        username: username.trim(),
        id: { not: id }  // Exclude current user
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username sudah digunakan' },
        { status: 400 }
      );
    }

    // Check if code already exists for this warehouse store (excluding current user)
    if (code) {
      const existingUserCode = await prisma.storeUser.findFirst({
        where: {
          storeId: warehouseStoreId,
          userId: { not: id }, // Exclude current user
          user: {
            code: code.trim()
          }
        }
      });

      if (existingUserCode) {
        return NextResponse.json(
          { error: 'Kode pengguna sudah digunakan di warehouse' },
          { status: 400 }
        );
      }
    }

    // Prepare update data for user table
    const updateUserData = {
      name: name.trim(),
      username: username.trim(),
      employeeNumber: employeeNumber ? employeeNumber.trim() : null,
      code: code ? code.trim() : null,
      address: address || null, // Add address field
      phone: phone || null, // Add phone field
      role: role, // Also update role in User table to match warehouse role
    };

    // Add password if provided
    if (password) {
      updateUserData.password = await bcrypt.hash(password, 10);
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateUserData
    });

    // Update the warehouse store-user relationship with new role
    await prisma.storeUser.update({
      where: {
        userId_storeId: {
          userId: id,
          storeId: warehouseStoreId,
        }
      },
      data: {
        role: role, // Update role in this warehouse store
        status: 'AKTIF', // Ensure the status is active
      }
    });

    // Don't return the password hash
    const { password: _, ...userWithoutPassword } = updatedUser;
    return NextResponse.json({...userWithoutPassword, role}); // Return user data with warehouse role
  } catch (error) {
    console.error('Error updating warehouse user:', error);

    // Check if it's a Prisma error (e.g., record not found)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update warehouse user' },
      { status: 500 }
    );
  }
}

// DELETE /api/warehouse/users/[id] - Delete a single user from warehouse
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only WAREHOUSE and MANAGER roles can delete warehouse users
    if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the warehouse store
    let warehouseStore = await prisma.store.findFirst({
      where: { code: WAREHOUSE_STORE_ID },
    });

    if (!warehouseStore) {
      // Create the warehouse store if it doesn't exist
      warehouseStore = await prisma.store.create({
        data: {
          name: 'Warehouse Master Store',
          code: WAREHOUSE_STORE_ID,
          description: 'Master store for warehouse operations',
        }
      });
    }

    const warehouseStoreId = warehouseStore.id;
    const { id } = params; // Get ID from URL parameter

    // Check if user exists and is associated with the warehouse store
    const storeUser = await prisma.storeUser.findFirst({
      where: {
        userId: id,
        storeId: warehouseStoreId,
      }
    });

    if (!storeUser) {
      return NextResponse.json(
        { error: 'User tidak ditemukan di warehouse' },
        { status: 404 }
      );
    }

    // Update status in storeUser table to mark as inactive
    const updatedStoreUser = await prisma.storeUser.update({
      where: {
        userId_storeId: {
          userId: id,
          storeId: warehouseStoreId,
        }
      },
      data: {
        status: 'TIDAK AKTIF', // Mark as inactive instead of deleting
      }
    });

    // Also update status in the main User table
    // Check if user is inactive in ALL stores before changing main user status
    const activeStoreUsers = await prisma.storeUser.findMany({
      where: {
        userId: id,
        status: { not: 'TIDAK AKTIF' } // Find if user is active in any store
      }
    });

    // Only update main user status if user is inactive in ALL stores
    if (activeStoreUsers.length === 0) {
      await prisma.user.update({
        where: { id },
        data: {
          status: 'TIDAK_AKTIF' // Change main user status to inactive
        }
      });
    }

    return NextResponse.json({
      message: 'Berhasil menonaktifkan user dari warehouse',
      deletedCount: 1
    });
  } catch (error) {
    console.error('Error deleting warehouse user:', error);

    // Check if it's a Prisma error
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete warehouse user' },
      { status: 500 }
    );
  }
}