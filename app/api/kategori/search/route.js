// app/api/kategori/search/route.js
import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ categories: [] });
  }

  try {
    const categories = await prisma.category.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      take: 10, // Limit the number of results
    });
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error searching categories:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat mencari kategori' }, { status: 500 });
  }
}
