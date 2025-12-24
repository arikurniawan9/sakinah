// app/api/warehouse/users/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { ROLES, WAREHOUSE_STORE_ID } from '@/lib/constants';

// GET /api/warehouse/users - Get users for warehouse with pagination and search
// Query parameters:
// - role: Optional, filter by specific role (defaults to CASHIER and ATTENDANT if not provided)
// - excludeRole: Optional, exclude specific role
// - search: Optional, search by name, username, code, or employee number
// - page: Optional, page number (default: 1)
// - limit: Optional, items per page (default: 10)
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only WAREHOUSE and MANAGER roles can access warehouse users
    if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const excludeRole = searchParams.get('excludeRole') || '';
    const offset = (page - 1) * limit;

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

    let whereClause = {
      storeId: warehouseStoreId,
    };

    // Add role filter if specified
    if (role) {
      whereClause.role = role;
    }

    // Add exclude role filter if specified
    if (excludeRole) {
      whereClause.role = {
        not: excludeRole
      };
    }

    if (search) {
      whereClause.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { employeeNumber: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    // Only allow specific roles for warehouse users
    // If role parameter is provided, filter by that role; otherwise, show both CASHIER and ATTENDANT
    if (role) {
      whereClause.role = role;
    } else {
      whereClause.role = {
        in: [ROLES.CASHIER, ROLES.ATTENDANT]
      };
    }

    const usersData = await prisma.storeUser.findMany({
      where: whereClause,
      select: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            employeeNumber: true,
            code: true,
            address: true,
            phone: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          }
        },
        role: true,
        storeId: true, // Include storeId in the response
      },
      skip: offset,
      take: limit,
      orderBy: { user: { createdAt: 'desc' } },
    });

    const totalCount = await prisma.storeUser.count({
      where: whereClause,
    });

    const users = usersData.map(storeUser => ({
      ...storeUser.user,
      role: storeUser.role,
      storeId: storeUser.storeId, // Include storeId in the returned data
    }));

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching warehouse users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouse users' },
      { status: 500 }
    );
  }
}

// POST /api/warehouse/users - Create a new user for warehouse
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only WAREHOUSE and MANAGER roles can create warehouse users
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

    const { name, username, employeeNumber, code, password, role, address, phone } = await request.json();

    // Validation
    if (!name || !username || !password || !role) {
      return NextResponse.json(
        { error: 'Nama, username, password, dan role wajib diisi' },
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

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: username.trim() }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username sudah digunakan' },
        { status: 400 }
      );
    }

    // Check if code already exists for this warehouse store
    if (code) {
      const existingUserCode = await prisma.storeUser.findFirst({
        where: {
          storeId: warehouseStoreId,
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        username: username.trim(),
        employeeNumber: employeeNumber ? employeeNumber.trim() : null,
        code: code ? code.trim() : null, // Use the provided code if available
        password: hashedPassword,
        address,
        phone,
        role: role, // Set role in user table to match the warehouse role
        status: 'AKTIF',
      }
    });

    // Create warehouse store-user relationship with specified role
    await prisma.storeUser.create({
      data: {
        userId: user.id,
        storeId: warehouseStoreId,
        role: role, // Role in the warehouse store
        assignedBy: session.user.id,
        status: 'AKTIF',
      }
    });

    // Don't return the password hash
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({...userWithoutPassword, role}); // Return user data with warehouse role
  } catch (error) {
    console.error('Error creating warehouse user:', error);
    return NextResponse.json(
      { error: 'Failed to create warehouse user' },
      { status: 500 }
    );
  }
}

// PUT /api/warehouse/users/[id] - Update a user for warehouse
export async function PUT(request) {
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

    const { id, name, username, employeeNumber, password, role, code, address, phone } = await request.json();

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

// DELETE /api/warehouse/users - Delete single or multiple users from warehouse
export async function DELETE(request) {
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

    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Array ID harus disediakan' },
        { status: 400 }
      );
    }

    // Check if all users exist in the warehouse store
    const storeUsers = await prisma.storeUser.findMany({
      where: {
        userId: { in: ids },
        storeId: warehouseStoreId,
      }
    });

    if (storeUsers.length !== ids.length) {
      return NextResponse.json(
        { error: 'Beberapa user tidak ditemukan di warehouse' },
        { status: 404 }
      );
    }

    // Update status in storeUser table
    const updatedStoreUsers = await prisma.storeUser.updateMany({
      where: {
        userId: { in: ids },
        storeId: warehouseStoreId,
      },
      data: {
        status: 'TIDAK AKTIF', // Mark as inactive instead of deleting
      }
    });

    // Also update status in the main User table
    // Check if user is inactive in ALL stores before changing main user status
    const userIdsToUpdate = [];
    for (const userId of ids) {
      const activeStoreUsers = await prisma.storeUser.findMany({
        where: {
          userId: userId,
          status: { not: 'TIDAK AKTIF' } // Find if user is active in any store
        }
      });

      // Only update main user status if user is inactive in ALL stores
      if (activeStoreUsers.length === 0) {
        userIdsToUpdate.push(userId);
      }
    }

    if (userIdsToUpdate.length > 0) {
      await prisma.user.updateMany({
        where: {
          id: { in: userIdsToUpdate }
        },
        data: {
          status: 'TIDAK_AKTIF' // Change main user status to inactive
        }
      });
    }

    return NextResponse.json({
      message: `Berhasil menonaktifkan ${updatedStoreUsers.count} user dari warehouse`,
      deletedCount: updatedStoreUsers.count
    });
  } catch (error) {
    console.error('Error deleting warehouse users:', error);

    // Check if it's a Prisma error
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete warehouse users' },
      { status: 500 }
    );
  }
}