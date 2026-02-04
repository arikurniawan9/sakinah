// app/api/member/[id]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Dapatkan storeId dari session
    let storeId = session.user.storeId;

    // Jika tidak ada storeId langsung, coba cari dari storeUser
    if (!storeId && session.user.role === 'MANAGER') {
      const storeUser = await prisma.storeUser.findFirst({
        where: {
          userId: session.user.id,
          role: 'MANAGER',
          status: { in: ['AKTIF', 'ACTIVE'] }
        },
        select: {
          storeId: true
        }
      });

      if (storeUser && storeUser.storeId) {
        storeId = storeUser.storeId;
      } else {
        return NextResponse.json({ error: 'Manager tidak dikaitkan dengan toko manapun' }, { status: 400 });
      }
    } else if (!storeId) {
      return NextResponse.json({ error: 'User is not associated with a store' }, { status: 400 });
    }

    // Periksa apakah permintaan datang dari konteks transaksi atau global
    const url = new URL(request.url);
    const context = url.searchParams.get('context'); // Jika context=transaction, ini untuk transaksi
    const globalParam = url.searchParams.get('global'); // Jika global=true, akses semua toko

    let member;

    if (context === 'transaction' || globalParam === 'true') {
      // Untuk konteks transaksi atau global, izinkan akses ke member dari toko manapun
      member = await prisma.member.findUnique({
        where: {
          id: params.id,
        },
      });
    } else {
      // Untuk konteks administrasi, batasi hanya member dari toko ini
      member = await prisma.member.findUnique({
        where: {
          id: params.id,
          storeId: storeId, // Tambahkan filter storeId untuk administrasi
        },
      });
    }

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: member.id,
      name: member.name,
      phone: member.phone,
      code: member.code,
      address: member.address,
      membershipType: member.membershipType,
      storeId: member.storeId,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt
    });
  } catch (error) {
    console.error('Error fetching member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}