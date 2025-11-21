// app/api/kategori/check-duplicates/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
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
    const body = await request.json();
    const { names } = body;

    if (!Array.isArray(names) || names.length === 0) {
      return NextResponse.json(
        { duplicates: [] },
        { status: 200 }
      );
    }

    // Cari kategori yang sudah ada di toko ini
    const existingCategories = await prisma.category.findMany({
      where: {
        name: { in: names },
        storeId: storeId,
      },
      select: {
        name: true,
        description: true,
      },
    });

    return NextResponse.json(
      { duplicates: existingCategories },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error checking duplicate categories:', error);
    return NextResponse.json(
      { error: 'Gagal memeriksa data duplikat' },
      { status: 500 }
    );
  }
}