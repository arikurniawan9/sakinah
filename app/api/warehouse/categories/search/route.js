export const dynamic = 'force-dynamic';
// app/api/warehouse/categories/search/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import globalPrisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only WAREHOUSE or MANAGER roles can access this API
    if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ categories: [] });
    }

    // Search for categories in the warehouse context
    const categories = await globalPrisma.category.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive'
        },
        storeId: 's1' // Only warehouse categories (using default store ID)
      },
      select: {
        id: true,
        name: true
      },
      take: 10 // Limit to 10 results
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error searching warehouse categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}