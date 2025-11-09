// app/api/laporan/piutang/bayar/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request) {
  const session = await getSession();
  if (!session || !['ADMIN', 'CASHIER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { receivableId, paymentAmount } = await request.json();

    if (!receivableId || !paymentAmount || paymentAmount <= 0) {
      return NextResponse.json({ error: 'Receivable ID and a valid payment amount are required' }, { status: 400 });
    }

    const updatedReceivable = await prisma.$transaction(async (tx) => {
      const receivable = await tx.receivable.findUnique({
        where: { id: receivableId },
      });

      if (!receivable) {
        throw new Error('Piutang tidak ditemukan.');
      }

      if (receivable.status === 'PAID') {
        throw new Error('Piutang ini sudah lunas.');
      }

      const newAmountPaid = receivable.amountPaid + paymentAmount;
      const remainingDue = receivable.amountDue - newAmountPaid;

      if (newAmountPaid > receivable.amountDue) {
        throw new Error(`Pembayaran melebihi sisa hutang. Sisa hutang: ${receivable.amountDue - receivable.amountPaid}`);
      }

      const newStatus = remainingDue <= 0 ? 'PAID' : 'PARTIALLY_PAID';

      return await tx.receivable.update({
        where: { id: receivableId },
        data: {
          amountPaid: newAmountPaid,
          status: newStatus,
        },
      });
    });

    return NextResponse.json(updatedReceivable);

  } catch (error) {
    console.error('Error processing receivable payment:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memproses pembayaran piutang' },
      { status: 500 }
    );
  }
}
