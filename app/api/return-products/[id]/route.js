import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { handleReturnStockUpdate, handleReturnCancellation } from '@/utils/return-stock-handler';
import { updateMockReturnStatus } from '@/utils/mock-return-data';

const prisma = new PrismaClient();

// Handler untuk GET request (mengambil detail retur produk berdasarkan ID)
export async function GET(request, { params }) {
  try {
    const { id } = await params; // Unwrapping params correctly

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID retur produk harus disertakan'
        },
        { status: 400 }
      );
    }

    const returnProduct = await prisma.returnProduct.findUnique({
      where: { id },
      include: {
        store: true,
        transaction: {
          select: {
            id: true,
            invoiceNumber: true,
            date: true,
            total: true,
            status: true,
            saleDetails: {
              include: {
                product: true
              }
            },
            member: true,
            attendant: {
              select: {
                id: true,
                name: true,
                username: true,
                employeeNumber: true
              }
            },
            cashier: {
              select: {
                id: true,
                name: true,
                username: true,
                employeeNumber: true
              }
            }
          }
        },
        product: true,
        attendant: {
          select: {
            id: true,
            name: true,
            username: true,
            employeeNumber: true,
            _count: {
              select: {
                attendantSales: true
              }
            }
          }
        }
      }
    });

    if (!returnProduct) {
      return NextResponse.json(
        {
          success: false,
          message: 'Retur produk tidak ditemukan'
        },
        { status: 404 }
      );
    }

    // Transform data to ensure codes are always present (logic fallback)
    const transformedData = {
      ...returnProduct,
      attendant: returnProduct.attendant ? {
        ...returnProduct.attendant,
        code: returnProduct.attendant.employeeNumber || returnProduct.attendant.id?.substring(0, 5) || '-'
      } : null,
      transaction: returnProduct.transaction ? {
        ...returnProduct.transaction,
        cashier: returnProduct.transaction.cashier ? {
          ...returnProduct.transaction.cashier,
          code: returnProduct.transaction.cashier.employeeNumber || returnProduct.transaction.cashier.id?.substring(0, 5) || '-'
        } : null,
        member: returnProduct.transaction.member ? {
          ...returnProduct.transaction.member,
          code: returnProduct.transaction.member.code || returnProduct.transaction.member.id?.substring(0, 5) || '-'
        } : null
      } : null
    };

    return NextResponse.json({
      success: true,
      data: transformedData,
      source: 'database'
    });
  } catch (error) {
    console.error('Error fetching return product details:', error);

    try {
      const { id } = await params; // Unwrapping params again in catch for safety
      const mockReturn = await import('@/utils/mock-return-data').then(mod => mod.getMockReturnById(id));

      if (mockReturn) {
        return NextResponse.json({
          success: true,
          data: mockReturn,
          source: 'fallback-mock',
          warning: 'Using mock data due to database error'
        });
      }

      return NextResponse.json(
        {
          success: false,
          message: 'Terjadi kesalahan saat mengambil detail retur produk',
          error: error.message
        },
        { status: 500 }
      );
    } catch (mockError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Terjadi kesalahan saat mengambil detail retur produk',
          error: error.message
        },
        { status: 500 }
      );
    }
  }
}

// Handler untuk PUT request (memperbarui retur produk, seperti menyetujui atau menolak)
export async function PUT(request, { params }) {
  try {
    const { id } = await params; // Unwrapping params correctly
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID retur produk harus disertakan'
        },
        { status: 400 }
      );
    }

    const { status, processedById } = body;

    if (!status || !processedById) {
      return NextResponse.json(
        {
          success: false,
          message: 'Status dan processedById harus disertakan'
        },
        { status: 400 }
      );
    }

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Status hanya boleh APPROVED atau REJECTED'
        },
        { status: 400 }
      );
    }

    // Ambil data retur produk sebelum diperbarui
    const existingReturn = await prisma.returnProduct.findUnique({
      where: { id },
      include: {
        product: true,
        transaction: true,
        store: true
      }
    });

    if (!existingReturn) {
      return NextResponse.json(
        {
          success: false,
          message: 'Retur produk tidak ditemukan'
        },
        { status: 404 }
      );
    }

    // Perbarui status retur produk
    const updatedReturn = await prisma.returnProduct.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date()
      },
      include: {
        store: true,
        transaction: {
          select: {
            id: true,
            invoiceNumber: true,
            date: true,
            total: true,
            status: true
          }
        },
        product: true,
        attendant: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      }
    });

    // Jika disetujui, perbarui stok produk
    if (status === 'APPROVED') {
      await handleReturnStockUpdate(id);

      await prisma.auditLog.create({
        data: {
          storeId: existingReturn.storeId,
          userId: processedById,
          action: 'RETURN_PRODUCT_APPROVED',
          entity: 'ReturnProduct',
          entityId: id,
          oldValue: JSON.stringify({ status: existingReturn.status }),
          newValue: JSON.stringify({ status: 'APPROVED' }),
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      });
    } else if (status === 'REJECTED') {
      await prisma.auditLog.create({
        data: {
          storeId: existingReturn.storeId,
          userId: processedById,
          action: 'RETURN_PRODUCT_REJECTED',
          entity: 'ReturnProduct',
          entityId: id,
          oldValue: JSON.stringify({ status: existingReturn.status }),
          newValue: JSON.stringify({ status: 'REJECTED' }),
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      });
    }

    // Buat notifikasi untuk pihak terkait
    await prisma.notification.create({
      data: {
        type: 'RETURN_STATUS_UPDATE',
        title: `Status Retur Produk Diubah`,
        message: `Status retur produk untuk ${existingReturn.product.name} telah diubah menjadi ${status}`,
        userId: existingReturn.attendantId, 
        storeId: existingReturn.storeId,
        severity: status === 'APPROVED' ? 'INFO' : 'WARNING',
        data: {
          returnId: id,
          status,
          productId: existingReturn.productId,
          productName: existingReturn.product.name
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedReturn,
      message: `Retur produk berhasil ${status === 'APPROVED' ? 'disetujui' : 'ditolak'}`,
      source: 'database'
    });
  } catch (error) {
    console.error('Error updating return product:', error);

    try {
      const { id } = await params;
      const mockReturn = updateMockReturnStatus(id, body.status, body.processedById);

      if (mockReturn) {
        return NextResponse.json({
          success: true,
          data: mockReturn,
          message: `Retur produk berhasil ${body.status === 'APPROVED' ? 'disetujui' : 'ditolak'} (menggunakan data mock)`,
          source: 'fallback-mock',
          warning: 'Using mock data due to database error'
        });
      }

      return NextResponse.json(
        {
          success: false,
          message: 'Terjadi kesalahan saat memperbarui status retur produk',
          error: error.message
        },
        { status: 500 }
      );
    } catch (mockError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Terjadi kesalahan saat memperbarui status retur produk',
          error: error.message
        },
        { status: 500 }
      );
    }
  }
}

// Handler untuk DELETE request (menghapus retur produk)
export async function DELETE(request, { params }) {
  try {
    const { id } = await params; // Unwrapping params correctly

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID retur produk harus disertakan'
        },
        { status: 400 }
      );
    }

    const existingReturn = await prisma.returnProduct.findUnique({
      where: { id }
    });

    if (!existingReturn) {
      return NextResponse.json(
        {
          success: false,
          message: 'Retur produk tidak ditemukan'
        },
        { status: 404 }
      );
    }

    // Hapus retur produk
    await prisma.returnProduct.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Retur produk berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting return product:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan saat menghapus retur produk',
        error: error.message
      },
      { status: 500 }
    );
  }
}
