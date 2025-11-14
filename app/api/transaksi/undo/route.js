// app/api/transaksi/undo/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

// Fungsi untuk undo transaksi dalam jangka waktu tertentu (misalnya 5 menit)
export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { saleId } = body;

  if (!saleId) {
    return NextResponse.json({ error: 'Sale ID is required' }, { status: 400 });
  }

  try {
    // Ambil data penjualan
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        saleDetails: {
          include: {
            product: true
          }
        }
      }
    });

    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    // Cek apakah transaksi sudah lebih dari 5 menit yang lalu
    const transactionTime = new Date(sale.createdAt);
    const currentTime = new Date();
    const timeDiffInMinutes = (currentTime - transactionTime) / (1000 * 60);

    // Hanya izinkan undo dalam 5 menit terakhir
    if (timeDiffInMinutes > 5) {
      return NextResponse.json({ 
        error: `Tidak dapat membatalkan transaksi lebih dari 5 menit. Transaksi ini dilakukan ${Math.round(timeDiffInMinutes)} menit yang lalu.` 
      }, { status: 400 });
    }

    // Lakukan pembatalan transaksi dalam satu transaksi database
    const result = await prisma.$transaction(async (tx) => {
      // Kembalikan stok produk
      for (const detail of sale.saleDetails) {
        await tx.product.update({
          where: { id: detail.productId },
          data: {
            stock: {
              increment: detail.quantity
            }
          }
        });
      }

      // Hapus entri receivable jika ada
      await tx.receivable.deleteMany({
        where: { saleId: sale.id }
      });

      // Hapus detail penjualan
      await tx.saleDetail.deleteMany({
        where: { saleId: sale.id }
      });

      // Hapus penjualan itu sendiri
      const deletedSale = await tx.sale.delete({
        where: { id: sale.id }
      });

      return deletedSale;
    });

    return NextResponse.json({ 
      message: 'Transaksi berhasil dibatalkan', 
      invoiceNumber: sale.invoiceNumber 
    }, { status: 200 });
  } catch (error) {
    console.error('Error undoing transaction:', error);
    return NextResponse.json({ 
      error: 'Gagal membatalkan transaksi: ' + error.message 
    }, { status: 500 });
  }
}