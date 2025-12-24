// app/api/manager/transfer-user/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { ROLES } from '@/lib/constants';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.MANAGER) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { userId, storeId, role, status } = await request.json();

    // Validasi input
    if (!userId || !storeId || !role) {
      return new Response(JSON.stringify({ 
        error: 'User ID, Store ID, dan Role wajib diisi' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Periksa apakah user dan store yang dituju valid
    const [user, store] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId }
      }),
      prisma.store.findUnique({
        where: { id: storeId }
      })
    ]);

    if (!user) {
      return new Response(JSON.stringify({
        error: 'Pengguna tidak ditemukan'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Cegah pemindahan untuk role MANAGER karena merupakan role global
    if (user.role === ROLES.MANAGER) {
      return new Response(JSON.stringify({
        error: 'Pengguna dengan role MANAGER tidak dapat dipindahkan ke toko lain karena merupakan role global'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!store) {
      return new Response(JSON.stringify({
        error: 'Toko tujuan tidak ditemukan'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Periksa apakah user sudah terdaftar di toko tujuan
    const existingStoreUser = await prisma.storeUser.findFirst({
      where: {
        userId: userId,
        storeId: storeId
      }
    });

    if (existingStoreUser) {
      return new Response(JSON.stringify({ 
        error: 'Pengguna sudah terdaftar di toko ini' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Buat koneksi baru antara user dan toko
    const newStoreUser = await prisma.storeUser.create({
      data: {
        userId: userId,
        storeId: storeId,
        role: role,
        status: status || 'ACTIVE',
        assignedBy: session.user.id,
      }
    });

    // Jika hanya ingin menambahkan ke toko baru tanpa menghapus dari toko lama
    // Maka kita hanya perlu membuat record baru di storeUser
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Pengguna berhasil ditambahkan ke toko baru',
      storeUser: newStoreUser
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error transferring user:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Endpoint untuk memindahkan user secara eksklusif (hapus dari toko lama, tambahkan ke toko baru)
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.MANAGER) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { userId, storeId, role, status, removeFromCurrentStore } = await request.json();

    // Validasi input
    if (!userId || !storeId || !role) {
      return new Response(JSON.stringify({ 
        error: 'User ID, Store ID, dan Role wajib diisi' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Periksa apakah user dan store yang dituju valid
    const [user, store] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId }
      }),
      prisma.store.findUnique({
        where: { id: storeId }
      })
    ]);

    if (!user) {
      return new Response(JSON.stringify({
        error: 'Pengguna tidak ditemukan'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Cegah pemindahan untuk role MANAGER karena merupakan role global
    if (user.role === ROLES.MANAGER) {
      return new Response(JSON.stringify({
        error: 'Pengguna dengan role MANAGER tidak dapat dipindahkan ke toko lain karena merupakan role global'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!store) {
      return new Response(JSON.stringify({
        error: 'Toko tujuan tidak ditemukan'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Lakukan dalam transaksi untuk memastikan konsistensi data
    const result = await prisma.$transaction(async (tx) => {
      // Periksa apakah user sudah terdaftar di toko tujuan
      const existingStoreUser = await tx.storeUser.findFirst({
        where: {
          userId: userId,
          storeId: storeId
        }
      });

      if (existingStoreUser) {
        return { 
          success: false, 
          error: 'Pengguna sudah terdaftar di toko ini' 
        };
      }

      // Jika removeFromCurrentStore true, hapus dari semua toko sebelumnya
      if (removeFromCurrentStore) {
        await tx.storeUser.deleteMany({
          where: {
            userId: userId
          }
        });
      }

      // Buat koneksi baru antara user dan toko
      const newStoreUser = await tx.storeUser.create({
        data: {
          userId: userId,
          storeId: storeId,
          role: role,
          status: status || 'ACTIVE',
          assignedBy: session.user.id,
        }
      });

      return { 
        success: true, 
        storeUser: newStoreUser 
      };
    });

    if (!result.success) {
      return new Response(JSON.stringify({ 
        error: result.error 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: removeFromCurrentStore 
        ? 'Pengguna berhasil dipindahkan ke toko baru' 
        : 'Pengguna berhasil ditambahkan ke toko baru',
      storeUser: result.storeUser
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error transferring user exclusively:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}