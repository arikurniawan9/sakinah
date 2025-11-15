// app/api/pengeluaran/kategori/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

// GET: Fetch all expense categories with pagination and search
export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build where condition for filtering
    const whereCondition = search
      ? {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } }
          ]
        }
      : {};

    // Get expense categories with pagination and include expense count
    const categories = await prisma.expenseCategory.findMany({
      where: whereCondition,
      skip: offset,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        _count: {
          select: { expenses: true } // Include count of related expenses
        }
      }
    });

    // Get total count for pagination
    const totalCount = await prisma.expenseCategory.count({
      where: whereCondition
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      categories,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        total: totalCount,
        itemsPerPage: limit,
        startIndex: offset + 1,
        endIndex: Math.min(offset + limit, totalCount)
      }
    });
  } catch (error) {
    console.error('Error fetching expense categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new expense category
export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { name, description } = data;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'Nama kategori wajib diisi' }, { status: 400 });
    }

    // Check if category name already exists
    const existingCategory = await prisma.expenseCategory.findUnique({
      where: { name }
    });

    if (existingCategory) {
      return NextResponse.json({ error: 'Nama kategori sudah digunakan' }, { status: 409 });
    }

    // Create new expense category
    const newCategory = await prisma.expenseCategory.create({
      data: {
        name,
        description: description || null
      }
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('Error creating expense category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update an existing expense category
export async function PUT(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { id, name, description } = data;

    // Validate required fields
    if (!id || !name) {
      return NextResponse.json({ error: 'ID dan nama kategori wajib diisi' }, { status: 400 });
    }

    // Check if category exists
    const existingCategory = await prisma.expenseCategory.findUnique({
      where: { id }
    });

    if (!existingCategory) {
      return NextResponse.json({ error: 'Kategori pengeluaran tidak ditemukan' }, { status: 404 });
    }

    // Check if new name already exists (excluding current category)
    const duplicateName = await prisma.expenseCategory.findFirst({
      where: {
        name,
        id: { not: id } // Exclude current category
      }
    });

    if (duplicateName) {
      return NextResponse.json({ error: 'Nama kategori sudah digunakan' }, { status: 409 });
    }

    // Update expense category
    const updatedCategory = await prisma.expenseCategory.update({
      where: { id },
      data: {
        name,
        description: description || null
      }
    });

    return NextResponse.json(updatedCategory, { status: 200 });
  } catch (error) {
    console.error('Error updating expense category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete an expense category
export async function DELETE(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    // Fallback to body if not in URL params
    if (!id) {
      const body = await request.json();
      id = body.id;
    }

    if (!id) {
      return NextResponse.json({ error: 'ID kategori wajib diisi' }, { status: 400 });
    }

    // Check if category exists
    const existingCategory = await prisma.expenseCategory.findUnique({
      where: { id },
      include: {
        expenses: true // Include related expenses to check if any exist
      }
    });

    if (!existingCategory) {
      return NextResponse.json({ error: 'Kategori pengeluaran tidak ditemukan' }, { status: 404 });
    }

    // Check if category has any associated expenses
    if (existingCategory.expenses && existingCategory.expenses.length > 0) {
      return NextResponse.json({
        error: `Tidak dapat menghapus kategori karena terdapat ${existingCategory.expenses.length} pengeluaran yang terkait`
      }, { status: 400 });
    }

    // Delete the expense category
    await prisma.expenseCategory.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Kategori pengeluaran berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting expense category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}