import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Fungsi untuk menangani pembaruan stok setelah retur produk disetujui
 */
export async function handleReturnStockUpdate(returnId) {
  try {
    // Ambil data retur produk
    const returnProduct = await prisma.returnProduct.findUnique({
      where: { id: returnId },
      include: {
        product: true,
        store: true
      }
    });

    if (!returnProduct) {
      throw new Error('Retur produk tidak ditemukan');
    }

    if (returnProduct.status !== 'APPROVED') {
      throw new Error('Hanya retur produk yang disetujui yang dapat memperbarui stok');
    }

    // Tambahkan stok produk karena barang kembali ke toko
    await prisma.product.update({
      where: { id: returnProduct.productId },
      data: {
        stock: {
          increment: 1 // Tambah 1 ke stok karena produk kembali
        }
      }
    });

    // Catat aktivitas ke audit log
    await prisma.auditLog.create({
      data: {
        storeId: returnProduct.storeId,
        userId: returnProduct.attendantId, // Atau user yang menyetujui retur
        action: 'STOCK_INCREASED_FROM_RETURN',
        entity: 'Product',
        entityId: returnProduct.productId,
        oldValue: JSON.stringify({ stock: returnProduct.product.stock }),
        newValue: JSON.stringify({ stock: returnProduct.product.stock + 1 }),
        ipAddress: 'SYSTEM', // Ditangani oleh sistem
        userAgent: 'Return Stock Handler',
        additionalData: {
          returnId: returnProduct.id,
          returnReason: returnProduct.reason,
          returnCategory: returnProduct.category
        }
      }
    });

    console.log(`Stok produk ${returnProduct.productId} telah diperbarui setelah retur ${returnId}`);
    return { success: true, message: 'Stok berhasil diperbarui setelah retur' };
  } catch (error) {
    console.error('Error handling return stock update:', error);
    throw error;
  }
}

/**
 * Fungsi untuk menangani pembatalan retur produk dan pengurangan stok
 */
export async function handleReturnCancellation(returnId) {
  try {
    // Ambil data retur produk
    const returnProduct = await prisma.returnProduct.findUnique({
      where: { id: returnId },
      include: {
        product: true,
        store: true
      }
    });

    if (!returnProduct) {
      throw new Error('Retur produk tidak ditemukan');
    }

    if (returnProduct.status === 'APPROVED') {
      // Jika retur sudah disetujui, kurangi kembali stok
      await prisma.product.update({
        where: { id: returnProduct.productId },
        data: {
          stock: {
            decrement: 1 // Kurangi 1 dari stok karena retur dibatalkan
          }
        }
      });

      // Catat aktivitas ke audit log
      await prisma.auditLog.create({
        data: {
          storeId: returnProduct.storeId,
          userId: returnProduct.attendantId,
          action: 'STOCK_DECREASED_FROM_RETURN_CANCELLATION',
          entity: 'Product',
          entityId: returnProduct.productId,
          oldValue: JSON.stringify({ stock: returnProduct.product.stock }),
          newValue: JSON.stringify({ stock: returnProduct.product.stock - 1 }),
          ipAddress: 'SYSTEM',
          userAgent: 'Return Cancellation Handler',
          additionalData: {
            returnId: returnProduct.id,
            returnReason: returnProduct.reason,
            returnCategory: returnProduct.category
          }
        }
      });
    }

    console.log(`Stok produk ${returnProduct.productId} telah diperbarui setelah pembatalan retur ${returnId}`);
    return { success: true, message: 'Stok berhasil diperbarui setelah pembatalan retur' };
  } catch (error) {
    console.error('Error handling return cancellation:', error);
    throw error;
  }
}

/**
 * Fungsi untuk mendapatkan ringkasan retur produk per toko
 */
export async function getReturnSummary(storeId) {
  try {
    const summary = await prisma.returnProduct.groupBy({
      by: ['status'],
      where: {
        storeId: storeId
      },
      _count: true,
      _sum: {
        id: true
      }
    });

    const totalReturns = await prisma.returnProduct.count({
      where: { storeId: storeId }
    });

    const returnsByCategory = await prisma.returnProduct.groupBy({
      by: ['category'],
      where: { storeId: storeId },
      _count: true
    });

    return {
      success: true,
      summary: {
        totalReturns,
        byStatus: summary.reduce((acc, curr) => {
          acc[curr.status] = curr._count;
          return acc;
        }, {}),
        byCategory: returnsByCategory.reduce((acc, curr) => {
          acc[curr.category] = curr._count;
          return acc;
        }, {})
      }
    };
  } catch (error) {
    console.error('Error getting return summary:', error);
    throw error;
  }
}

/**
 * Fungsi untuk mendapatkan dampak retur terhadap stok produk
 */
export async function getReturnStockImpact(storeId) {
  try {
    // Dapatkan semua retur yang disetujui
    const approvedReturns = await prisma.returnProduct.findMany({
      where: {
        storeId: storeId,
        status: 'APPROVED'
      },
      include: {
        product: true
      }
    });

    // Hitung jumlah retur per produk
    const returnCountByProduct = approvedReturns.reduce((acc, curr) => {
      if (!acc[curr.productId]) {
        acc[curr.productId] = {
          product: curr.product,
          returnCount: 0
        };
      }
      acc[curr.productId].returnCount += 1;
      return acc;
    }, {});

    return {
      success: true,
      data: Object.values(returnCountByProduct)
    };
  } catch (error) {
    console.error('Error getting return stock impact:', error);
    throw error;
  }
}

/**
 * Fungsi untuk memvalidasi retur produk sebelum disimpan
 */
export async function validateReturnRequest(data) {
  try {
    const { storeId, transactionId, productId, attendantId, reason } = data;

    // Validasi keberadaan entitas
    const [store, transaction, product, attendant] = await Promise.all([
      prisma.store.findUnique({ where: { id: storeId } }),
      prisma.sale.findUnique({ where: { id: transactionId } }),
      prisma.product.findUnique({ where: { id: productId } }),
      prisma.user.findUnique({ where: { id: attendantId } })
    ]);

    if (!store) {
      return { success: false, error: 'Toko tidak ditemukan' };
    }

    if (!transaction) {
      return { success: false, error: 'Transaksi tidak ditemukan' };
    }

    if (!product) {
      return { success: false, error: 'Produk tidak ditemukan' };
    }

    if (!attendant) {
      return { success: false, error: 'Pelayan tidak ditemukan' };
    }

    // Validasi apakah produk benar-benar ada dalam transaksi
    const saleDetail = await prisma.saleDetail.findFirst({
      where: {
        saleId: transactionId,
        productId: productId
      }
    });

    if (!saleDetail) {
      return { success: false, error: 'Produk tidak ditemukan dalam transaksi yang ditentukan' };
    }

    return { success: true, message: 'Validasi berhasil' };
  } catch (error) {
    console.error('Error validating return request:', error);
    return { success: false, error: 'Terjadi kesalahan saat memvalidasi permintaan retur' };
  }
}