// app/api/laporan/piutang/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request) {
  const session = await getSession();
  // Allow both ADMIN and CASHIER to access this endpoint
  if (!session || !['ADMIN', 'CASHIER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    const where = {
      AND: [],
    };

    if (status) {
      const statuses = status.split(',');
      if (statuses.length > 0) {
        where.AND.push({
          status: {
            in: statuses,
          },
        });
      }
    }

    if (search) {
      where.AND.push({
        member: {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
      });
    }

    const receivables = await prisma.receivable.findMany({
      where: where.AND.length > 0 ? where : undefined,
      include: {
        member: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        sale: {
          select: {
            id: true,
            date: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ receivables });
  } catch (error) {
    console.error('Error fetching receivables:', error);
    return NextResponse.json(
      { error: 'Failed to fetch receivables' },
      { status: 500 }
    );
  }
}
