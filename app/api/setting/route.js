// app/api/setting/route.js
import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/authOptions';
import initRedisClient from '@/lib/redis';

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session || !['CASHIER', 'ADMIN', 'MANAGER', 'WAREHOUSE'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Cek apakah pengguna memiliki akses ke toko
  // Untuk MANAGER, mungkin tidak memiliki storeId langsung tetapi bisa mengakses beberapa toko
  if (!session.user.storeId && session.user.role !== 'MANAGER') {
    return NextResponse.json({ error: 'User tidak memiliki akses ke toko' }, { status: 400 });
  }

  try {
    // Jika user adalah MANAGER tetapi tidak memiliki storeId, kembalikan error spesifik
    if (!session.user.storeId && session.user.role === 'MANAGER') {
      // Tidak ada toko spesifik yang dipilih, kembalikan nilai default
      return NextResponse.json({
        shopName: 'Sakinah',
        address: '',
        phone: '',
        themeColor: '#3c8dbc'
      }, { status: 200 });
    }

    // Generate cache key
    const cacheKey = `setting:${session.user.storeId}`;
    let redisClient;
    try {
      redisClient = await initRedisClient();
    } catch (error) {
      console.warn('Redis not available, proceeding without caching:', error.message);
    }

    // Try to get cached data
    let cachedData = null;
    if (redisClient) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          cachedData = JSON.parse(cached);
          console.log('Cache hit for setting');
          return NextResponse.json(cachedData, { status: 200 });
        }
      } catch (error) {
        console.warn('Cache retrieval failed:', error.message);
      }
    }

    // Ambil pengaturan toko berdasarkan storeId yang sedang aktif
    let setting = await prisma.setting.findUnique({
      where: { storeId: session.user.storeId }
    });

    if (!setting) {
      // Buat setting default untuk toko ini jika belum ada
      setting = await prisma.setting.create({
        data: {
          storeId: session.user.storeId,
          shopName: 'Toko Baru', // Gunakan nama toko yang lebih umum atau ambil dari tabel store
          address: '',
          phone: '',
        }
      });
    }

    // Cache the response if Redis is available
    if (redisClient) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(setting), { EX: 3600 }); // Cache for 1 hour
      } catch (error) {
        console.warn('Cache storage failed:', error.message);
      }
    }

    return NextResponse.json(setting, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json({ error: 'Gagal mengambil pengaturan toko' }, { status: 500 });
  }
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);

  if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Cek apakah pengguna memiliki akses ke toko
  // Untuk MANAGER, mungkin tidak memiliki storeId langsung tetapi bisa mengakses beberapa toko
  if (!session.user.storeId && session.user.role !== 'MANAGER') {
    return NextResponse.json({ error: 'User tidak memiliki akses ke toko' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { shopName, address, phone } = body;

    // Jika user adalah MANAGER tetapi tidak memiliki storeId, return error
    if (!session.user.storeId && session.user.role === 'MANAGER') {
      return NextResponse.json({ error: 'MANAGER harus memilih toko terlebih dahulu sebelum mengubah pengaturan' }, { status: 400 });
    }

    // Cek apakah setting sudah ada untuk toko ini
    const existingSetting = await prisma.setting.findUnique({
      where: { storeId: session.user.storeId }
    });

    let setting;
    if (existingSetting) {
      // Update setting yang sudah ada untuk toko ini
      setting = await prisma.setting.update({
        where: { storeId: session.user.storeId },
        data: {
          shopName,
          address,
          phone,
        }
      });
    } else {
      // Buat setting baru untuk toko ini jika belum ada
      setting = await prisma.setting.create({
        data: {
          storeId: session.user.storeId,
          shopName,
          address,
          phone,
        }
      });
    }

    // Invalidate cache after update
    const redisClient = await initRedisClient().catch(() => null);
    if (redisClient) {
      try {
        await redisClient.del(`setting:${session.user.storeId}`);
      } catch (error) {
        console.warn('Cache deletion failed:', error.message);
      }
    }

    return NextResponse.json(setting, { status: 200 });
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json({ error: 'Gagal memperbarui pengaturan toko' }, { status: 500 });
  }
}