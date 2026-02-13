import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateReturnInvoiceNumber } from '@/utils/invoiceNumber';
import {
  getMockReturnData,
  getMockReturnById,
  addMockReturn,
  updateMockReturnStatus,
  getMockReturnStats
} from '@/utils/mock-return-data';

const prisma = new PrismaClient();


export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const status = searchParams.get('status');
    const searchTerm = searchParams.get('search'); 
    const userId = searchParams.get('userId');     
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;

    const skip = (page - 1) * limit;

    let whereClause = {};

    if (storeId) {
      whereClause.storeId = storeId;
    }

    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    if (userId) {
      whereClause.OR = [
        { attendantId: userId },
        { transaction: { cashierId: userId } },
        { transaction: { attendantId: userId } },
      ];
    }

    if (searchTerm) {
      const searchConditions = [
        { transactionId: { contains: searchTerm, mode: 'insensitive' } },
        { reason: { contains: searchTerm, mode: 'insensitive' } },
        { product: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { attendant: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { attendant: { employeeNumber: { contains: searchTerm, mode: 'insensitive' } } },
      ];

      if (whereClause.OR) {
        whereClause.AND = [
          { OR: whereClause.OR },
          { OR: searchConditions }
        ];
        delete whereClause.OR;
      } else {
        whereClause.OR = searchConditions;
      }
    }

    const returnsWithData = await prisma.returnProduct.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: { 
        product: {
          select: {
            id: true,
            name: true,
            productCode: true,
          },
        },
        attendant: {
          select: {
            id: true,
            name: true,
            employeeNumber: true,
          }
        },
        transaction: {
          select: {
            id: true,
            invoiceNumber: true,
            date: true,
            total: true,
            status: true,
            member: {
              select: {
                name: true
              }
            },
            cashier: {
              select: {
                name: true
              }
            }
          }
        },
        store: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    const total = await prisma.returnProduct.count({
      where: whereClause
    });

    return NextResponse.json({
      success: true,
      data: returnsWithData,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: false,
        hasPrev: false
      },
      source: 'database'
    });
  } catch (error) {
    console.error('Error in GET /api/return-products:', error);
    
    try {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status');
      const searchTerm = searchParams.get('searchTerm');

      const filters = {
        status: status || 'ALL',
        searchTerm: searchTerm || ''
      };

      const mockData = getMockReturnData(filters);

      return NextResponse.json({
        success: true,
        data: mockData,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: mockData.length,
          hasNext: false,
          hasPrev: false
        },
        source: 'fallback-mock',
        warning: 'Using mock data due to database error'
      });
    } catch (mockError) {
      console.error('Error even with mock data:', mockError);
      return NextResponse.json(
        {
          success: false,
          message: 'Terjadi kesalahan saat mengambil data retur produk',
          error: error.message,
          details: {
            originalError: error.message,
            mockError: mockError.message
          }
        },
        { status: 500 }
      );
    }
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      storeId,
      transactionId,
      productId,
      attendantId,
      reason,
      notes,
      category = 'OTHERS'
    } = body;

    if (!storeId || !transactionId || !productId || !attendantId || !reason) {
      return NextResponse.json(
        {
          success: false,
          message: 'Semua field wajib diisi: storeId, transactionId, productId, attendantId, reason'
        },
        { status: 400 }
      );
    }

    const [existingTransaction, existingProduct, existingAttendant, existingStore] = await Promise.all([
      prisma.sale.findUnique({ where: { id: transactionId } }),
      prisma.product.findUnique({ where: { id: productId } }),
      prisma.user.findUnique({ where: { id: attendantId } }),
      prisma.store.findUnique({ where: { id: storeId } })
    ]);

    if (!existingTransaction) {
      return NextResponse.json(
        {
          success: false,
          message: 'Transaksi tidak ditemukan'
        },
        { status: 404 }
      );
    }

    if (!existingProduct) {
      return NextResponse.json(
        {
          success: false,
          message: 'Produk tidak ditemukan'
        },
        { status: 404 }
      );
    }

    if (!existingAttendant) {
      return NextResponse.json(
        {
          success: false,
          message: 'Pelayan tidak ditemukan'
        },
        { status: 404 }
      );
    }

    if (!existingStore) {
      return NextResponse.json(
        {
          success: false,
          message: 'Toko tidak ditemukan'
        },
        { status: 404 }
      );
    }

    const invoiceNumber = await generateReturnInvoiceNumber(storeId);

    const newReturn = await prisma.returnProduct.create({
      data: {
        storeId,
        invoiceNumber,
        transactionId,
        productId,
        attendantId,
        reason,
        notes,
        category,
        returnDate: new Date(),
        status: 'PENDING'
      }
    });

    const [product, store, attendant] = await Promise.all([
      prisma.product.findUnique({ where: { id: productId }, select: { name: true } }),
      prisma.store.findUnique({ where: { id: storeId }, select: { name: true } }),
      prisma.user.findUnique({ where: { id: attendantId }, select: { name: true } })
    ]);

    await prisma.notification.create({
      data: {
        type: 'RETURN_REQUEST',
        title: 'Permintaan Retur Produk Baru',
        message: `Permintaan retur produk untuk ${product.name} telah diajukan`,
        storeId,
        severity: 'HIGH',
        data: {
          returnId: newReturn.id,
          invoiceNumber: newReturn.invoiceNumber, 
          transactionId,
          productId,
          productName: product.name
        }
      }
    });

    const returnWithDetails = {
      ...newReturn,
      store,
      product,
      attendant
    };

    return NextResponse.json({
      success: true,
      data: returnWithDetails,
      message: 'Retur produk berhasil dibuat',
      source: 'database'
    });
  } catch (error) {
    console.error('Error in POST /api/return-products:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan saat membuat retur produk',
        error: error.message
      },
      { status: 500 }
    );
  }
}
