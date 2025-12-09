export const dynamic = 'force-dynamic';
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
    const limit = parseInt(searchParams.get('limit')) || 50;

    // Fetch categories for the current store
    const categories = await globalPrisma.category.findMany({
      where: {
        storeId: session.user.storeId
      },
      orderBy: {
        name: 'asc',
      },
      take: limit
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories for warehouse:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only WAREHOUSE or MANAGER roles can access this API
    if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'Nama kategori wajib diisi' }, { status: 400 });
    }

    // Check if a category with the same name already exists in the store
    const existingCategory = await globalPrisma.category.findFirst({
      where: {
        name: name,
        storeId: session.user.storeId
      }
    });

    if (existingCategory) {
      return NextResponse.json({ error: 'Kategori dengan nama yang sama sudah ada' }, { status: 400 });
    }

    // Create the new category in the database
    const newCategory = await globalPrisma.category.create({
      data: {
        name,
        description: description || null,
        storeId: session.user.storeId
      }
    });

    return NextResponse.json({ category: newCategory }, { status: 201 });
  } catch (error) {
    console.error('Error creating category for warehouse:', error);

    // Check if this is a Prisma-specific error
    if (error.code === 'P2003' || error.code === 'P2025') {
      return NextResponse.json({ error: 'Store tidak ditemukan' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}