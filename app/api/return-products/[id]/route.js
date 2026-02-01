import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { handleReturnStockUpdate, handleReturnCancellation } from '@/utils/return-stock-handler';
import { updateMockReturnStatus } from '@/utils/mock-return-data';

const prisma = new PrismaClient();

// Fungsi untuk mengecek apakah database dapat diakses
async function isDatabaseAccessible() {
  try {
    await prisma.$connect();
    // Coba akses sederhana
    await prisma.returnProduct.count({ take: 1 });
    return true;
  } catch (error) {
    console.warn('Database not accessible:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Handler untuk GET request (mengambil detail retur produk berdasarkan ID)
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'ID retur produk harus disertakan' 
        },
        { status: 400 }
      );
    }
    
    const dbAccessible = await isDatabaseAccessible();
    
    if (!dbAccessible) {
      // Gunakan data mock jika database tidak dapat diakses
      const mockReturn = await import('@/utils/mock-return-data').then(mod => mod.getMockReturnById(id));
      
      if (!mockReturn) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Retur produk tidak ditemukan di data mock' 
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: mockReturn,
        source: 'mock'
      });
    }
    
    const returnProduct = await prisma.returnProduct.findUnique({
      where: { id },
      include: {
        store: true,
        transaction: {
          include: {
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
                username: true
              }
            },
            cashier: {
              select: {
                id: true,
                name: true,
                username: true
              }
            }
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
    
    if (!returnProduct) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Retur produk tidak ditemukan' 
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: returnProduct,
      source: 'database'
    });
  } catch (error) {
    console.error('Error fetching return product details:', error);
    
    // Coba dengan data mock
    try {
      const mockReturn = await import('@/utils/mock-return-data').then(mod => mod.getMockReturnById(params.id));
      
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
  } finally {
    if(await isDatabaseAccessible()) {
      await prisma.$disconnect();
    }
  }
}

// Handler untuk PUT request (memperbarui retur produk, seperti menyetujui atau menolak)
export async function PUT(request, { params }) {
  try {
    const { id } = params;
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
    
    const dbAccessible = await isDatabaseAccessible();
    
    if (!dbAccessible) {
      // Gunakan mock jika database tidak dapat diakses
      const mockReturn = updateMockReturnStatus(id, status, processedById);
      
      if (!mockReturn) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Retur produk tidak ditemukan di data mock' 
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: mockReturn,
        message: `Retur produk berhasil ${status === 'APPROVED' ? 'disetujui' : 'ditolak'} (menggunakan data mock)`,
        source: 'mock'
      });
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
        transaction: true,
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
      // Gunakan fungsi khusus untuk menangani pembaruan stok
      await handleReturnStockUpdate(id);
      
      // Catat aktivitas ke audit log
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
      // Catat aktivitas ke audit log
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
        userId: existingReturn.attendantId, // Kirim notifikasi ke pelayan yang membuat permintaan
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
    
    // Coba dengan data mock
    try {
      const mockReturn = updateMockReturnStatus(params.id, body.status, body.processedById);
      
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
  } finally {
    if(await isDatabaseAccessible()) {
      await prisma.$disconnect();
    }
  }
}

// Handler untuk DELETE request (menghapus retur produk)
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'ID retur produk harus disertakan' 
        },
        { status: 400 }
      );
    }
    
    const dbAccessible = await isDatabaseAccessible();
    
    if (!dbAccessible) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Tidak dapat menghapus data saat database tidak dapat diakses' 
        },
        { status: 500 }
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
  } finally {
    if(await isDatabaseAccessible()) {
      await prisma.$disconnect();
    }
  }
}