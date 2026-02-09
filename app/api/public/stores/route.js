// app/api/public/stores/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Ambil semua toko yang aktif tanpa memerlukan otentikasi
    const stores = await prisma.store.findMany({
      where: {
        status: 'ACTIVE', // Hanya tampilkan toko yang aktif
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        address: true,
        phone: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ stores }, { status: 200 });
  } catch (error) {
    console.error('Error fetching public stores:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}