// app/api/setting/route.js
import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/authOptions';

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session || !['CASHIER', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Cek apakah pengguna memiliki akses ke toko
  if (!session.user.storeId) {
    return NextResponse.json({ error: 'User tidak memiliki akses ke toko' }, { status: 400 });
  }

  try {
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

    return NextResponse.json(setting, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json({ error: 'Gagal mengambil pengaturan toko' }, { status: 500 });
  }
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Cek apakah pengguna memiliki akses ke toko
  if (!session.user.storeId) {
    return NextResponse.json({ error: 'User tidak memiliki akses ke toko' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { shopName, address, phone } = body;

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

    return NextResponse.json(setting, { status: 200 });
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json({ error: 'Gagal memperbarui pengaturan toko' }, { status: 500 });
  }
}