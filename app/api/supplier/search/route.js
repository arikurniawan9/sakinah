// app/api/supplier/search/route.js
import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ suppliers: [] });
  }

  try {
    const suppliers = await prisma.supplier.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      take: 10, // Limit the number of results
    });
    return NextResponse.json({ suppliers });
  } catch (error) {
    console.error('Error searching suppliers:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat mencari supplier' }, { status: 500 });
  }
}
