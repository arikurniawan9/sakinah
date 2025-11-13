// app/api/pelayan/[id]/route.js
import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/authOptions';

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Attendant ID is required' }, { status: 400 });
  }

  try {
    // 1. Fetch attendant details
    const attendant = await prisma.user.findUnique({
      where: { id },
    });

    if (!attendant) {
      return NextResponse.json({ error: 'Attendant not found' }, { status: 404 });
    }

    // 2. Fetch all sales served by this attendant
    const sales = await prisma.sale.findMany({
      where: { attendantId: id },
      orderBy: { date: 'desc' },
      include: {
        cashier: { select: { name: true } },
        member: { select: { name: true } },
      },
    });

    // 3. Calculate total sales for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysSales = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= today && saleDate < tomorrow;
    });

    const totalSalesToday = todaysSales.reduce((sum, sale) => sum + sale.total, 0);

    return NextResponse.json({
      attendant,
      sales,
      totalSalesToday,
    });

  } catch (error) {
    console.error(`Error fetching details for attendant ${id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
