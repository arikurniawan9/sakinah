import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== ROLES.MANAGER && session.user.role !== ROLES.ADMIN)) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { id: storeId } = params;

    // Validasi ID toko
    if (!storeId) {
      return new Response(
        JSON.stringify({ error: 'ID toko wajib disediakan' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verifikasi bahwa toko ada dan milik pengguna
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return new Response(
        JSON.stringify({ error: 'Toko tidak ditemukan' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Lakukan penghapusan data dalam transaksi untuk memastikan konsistensi
    await prisma.$transaction(async (tx) => {
      // Hapus data terkait dalam urutan yang benar (mengikuti foreign key constraints)
      
      // 1. Hapus notifikasi terkait
      await tx.notification.deleteMany({
        where: { storeId },
      });

      // 2. Hapus log aktivitas terkait
      await tx.auditLog.deleteMany({
        where: { storeId },
      });

      // 3. Hapus retur produk terkait (ini mereferensikan sale, jadi dihapus dulu)
      await tx.returnProduct.deleteMany({
        where: { storeId },
      });

      // 4. Hapus piutang terkait (ini mereferensikan sale, jadi dihapus dulu)
      await tx.receivable.deleteMany({
        where: { storeId },
      });

      // 5. Hapus detail penjualan terkait (ini mereferensikan sale, jadi dihapus dulu)
      await tx.saleDetail.deleteMany({
        where: { storeId },
      });

      // 6. Hapus transaksi penjualan terkait
      await tx.sale.deleteMany({
        where: { storeId },
      });

      // 7. Hapus item pembelian terkait (ini mereferensikan purchase, jadi dihapus dulu)
      await tx.purchaseItem.deleteMany({
        where: { storeId },
      });

      // 8. Hapus transaksi pembelian terkait
      await tx.purchase.deleteMany({
        where: { storeId },
      });

      // 9. Hapus distribusi gudang terkait
      await tx.warehouseDistribution.deleteMany({
        where: { storeId },
      });

      // 10. Hapus keranjang sementara terkait
      await tx.tempCart.deleteMany({
        where: { storeId },
      });

      // 11. Hapus penjualan yang ditangguhkan terkait
      await tx.suspendedSale.deleteMany({
        where: { storeId },
      });

      // 12. Hapus pengeluaran terkait
      await tx.expense.deleteMany({
        where: { storeId },
      });

      // 13. Hapus kategori pengeluaran terkait
      await tx.expenseCategory.deleteMany({
        where: { storeId },
      });

      // 14. Hapus produk terkait
      await tx.product.deleteMany({
        where: { storeId },
      });

      // 15. Hapus member terkait
      await tx.member.deleteMany({
        where: { storeId },
      });

      // 16. Hapus supplier terkait
      await tx.supplier.deleteMany({
        where: { storeId },
      });

      // 17. Hapus kategori terkait
      await tx.category.deleteMany({
        where: { storeId },
      });

      // 18. Hapus relasi user-store (many-to-many)
      await tx.storeUser.deleteMany({
        where: { storeId },
      });
    });

    return new Response(
      JSON.stringify({ 
        message: 'Data toko berhasil dihapus. Toko tetap aktif namun tidak memiliki data transaksi, produk, atau data terkait lainnya.' 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting store data:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error', 
        details: error.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}