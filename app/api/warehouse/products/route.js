import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';
import { logProductCreation, logProductUpdate, logProductDeletion } from '@/lib/auditLogger';

// GET - Get warehouse products (products added by warehouse staff)
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
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search');

    const includeAllStores = searchParams.get('includeAllStores') === 'true';

    // Build where clause for search
    // Filter for products in warehouse master store (added by warehouse staff) by default
    let whereClause = includeAllStores ? {} : { storeId: 'WAREHOUSE_MASTER_STORE' };

    if (search) {
      const searchConditions = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { productCode: { contains: search, mode: 'insensitive' } }
        ]
      };

      whereClause = includeAllStores
        ? { ...searchConditions }
        : { ...whereClause, ...searchConditions };
    }

    // Get total count for pagination
    const totalCount = await prisma.product.count({
      where: whereClause
    });

    // Get products with related data
    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        supplier: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate pagination values
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit + 1;
    const endIndex = Math.min(page * limit, totalCount);

    return NextResponse.json({
      products,
      pagination: {
        currentPage: page,
        totalPages,
        total: totalCount,
        startIndex,
        endIndex
      }
    });
  } catch (error) {
    console.error('Error fetching warehouse products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new warehouse product (if needed)
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, productCode, categoryId, supplierId, stock, purchasePrice } = body;

    if (!name || !productCode || !categoryId) {
      return NextResponse.json({ error: 'Nama, kode produk, dan kategori wajib diisi' }, { status: 400 });
    }

    // Check if product code already exists in warehouse
    const existingProduct = await prisma.product.findFirst({
      where: {
        productCode,
        storeId: 'WAREHOUSE_MASTER_STORE'
      }
    });

    if (existingProduct) {
      return NextResponse.json({ error: 'Kode produk sudah digunakan' }, { status: 400 });
    }

    // Create the product in warehouse context
    const newProduct = await prisma.product.create({
      data: {
        name,
        productCode,
        categoryId,
        supplierId,
        stock: stock || 0,
        purchasePrice: purchasePrice || 0,
        storeId: 'WAREHOUSE_MASTER_STORE',
        createdBy: session.user.id,
        status: 'ACTIVE'
      },
      include: {
        category: true,
        supplier: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          }
        }
      }
    });

    // Log aktivitas pembuatan produk gudang
    const requestHeaders = new Headers(request.headers);
    const ipAddress = requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || '127.0.0.1';
    const userAgent = requestHeaders.get('user-agent') || '';

    await logProductCreation(
      session.user.id,
      newProduct,
      'WAREHOUSE_MASTER_STORE', // Log ke store gudang
      ipAddress,
      userAgent
    );

    return NextResponse.json({
      success: true,
      product: newProduct,
      message: 'Produk berhasil ditambahkan ke gudang'
    });
  } catch (error) {
    console.error('Error creating warehouse product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}