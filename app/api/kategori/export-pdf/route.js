// app/api/kategori/export-pdf/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// Fungsi untuk menghasilkan PDF kategori
export async function POST(request) {
  const session = await getSession();
  if (!session || !['CASHIER', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const storeId = session.user.storeId;
  if (!storeId) {
    return NextResponse.json(
      { error: 'User tidak terkait dengan toko manapun' },
      { status: 400 }
    );
  }

  try {
    // Ambil data toko
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        name: true,
        address: true,
        phone: true,
        email: true,
      }
    });

    if (!store) {
      return NextResponse.json(
        { error: 'Toko tidak ditemukan' },
        { status: 404 }
      );
    }

    // Ambil pengaturan toko untuk nama dan informasi tambahan
    const settings = await prisma.setting.findUnique({
      where: { storeId },
      select: {
        shopName: true,
        address: true,
        phone: true,
      }
    });

    // Gabungkan informasi toko dan pengaturan
    const shopInfo = {
      name: settings?.shopName || store.name,
      address: settings?.address || store.address,
      phone: settings?.phone || store.phone,
    };

    // Ambil semua kategori untuk toko ini
    const categories = await prisma.category.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    // Format data untuk PDF
    const formattedCategories = categories.map((category, index) => ({
      no: index + 1,
      name: category.name,
      description: category.description || '-',
      createdAt: new Date(category.createdAt).toLocaleDateString('id-ID'),
    }));

    // Simpan data dalam sesi atau kembalikan sebagai JSON untuk frontend proses PDF
    // Untuk implementasi ini, kita kembalikan data ke frontend untuk proses PDF
    return NextResponse.json({
      shopInfo,
      categories: formattedCategories,
      exportDate: new Date().toLocaleDateString('id-ID'),
    });
  } catch (error) {
    console.error('Error generating category PDF:', error);
    return NextResponse.json(
      { error: 'Gagal menghasilkan laporan PDF' },
      { status: 500 }
    );
  }
}