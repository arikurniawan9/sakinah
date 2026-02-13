// app/api/member/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

// Fungsi untuk menghasilkan kode pendek unik
function generateShortCode(prefix = '') {
  const randomNum = Math.floor(Math.random() * 900000) + 100000;
  return `${prefix}${randomNum}`;
}

// GET: Mengambil semua member
export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session || !['CASHIER', 'ADMIN', 'ATTENDANT', 'MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';

    const globalSearch = searchParams.get('global') === 'true';

    let baseWhereClause = {};
    if (!globalSearch) {
      let storeId = session.user.storeId;

      if (!storeId && session.user.role === 'ATTENDANT') {
        const storeUser = await prisma.storeUser.findFirst({
          where: {
            userId: session.user.id,
            role: 'ATTENDANT',
            status: { in: ['AKTIF', 'ACTIVE'] }
          },
          select: { storeId: true }
        });
        if (storeUser) storeId = storeUser.storeId;
      }
      
      if (!storeId) {
        return NextResponse.json({ error: 'User is not associated with a store' }, { status: 400 });
      }
      baseWhereClause.storeId = storeId;
    }

    const skip = (page - 1) * limit;

    const whereClause = search
      ? {
          ...baseWhereClause,
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
          ],
        }
      : baseWhereClause;

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          phone: true,
          code: true,
          membershipType: true,
          storeId: true,
          createdAt: true,
          address: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.member.count({ where: whereClause }),
    ]);

    const isSimple = searchParams.get('simple');
    if (isSimple) return NextResponse.json(members);

    return NextResponse.json({
      members,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

// POST: Membuat member baru
export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session || !['CASHIER', 'ADMIN', 'ATTENDANT', 'MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    let { name, phone, address, membershipType, code } = body;

    const isPelangganUmum = (code === 'UMUM' || name === 'Pelanggan Umum');
    
    if (isPelangganUmum) {
      phone = '0000000000'; // Default phone for UMUM to satisfy unique constraint
    }

    if (!name) return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });
    if (!phone) return NextResponse.json({ error: 'Nomor telepon wajib diisi' }, { status: 400 });
    
    if (!isPelangganUmum && !/^\d{10,15}$/.test(phone)) {
      return NextResponse.json({ error: 'Format nomor telepon tidak valid' }, { status: 400 });
    }

    let storeId = session.user.storeId;
    if (!storeId) {
      const storeUser = await prisma.storeUser.findFirst({
        where: { userId: session.user.id, status: { in: ['AKTIF', 'ACTIVE'] } },
        select: { storeId: true }
      });
      if (storeUser) storeId = storeUser.storeId;
    }

    if (!storeId) return NextResponse.json({ error: 'User tidak memiliki akses ke toko manapun' }, { status: 400 });

    // UPSERT for Pelanggan Umum to avoid conflicts
    if (isPelangganUmum) {
      const existingUmum = await prisma.member.findFirst({
        where: { storeId, code: 'UMUM' }
      });

      if (existingUmum) return NextResponse.json(existingUmum, { status: 200 });

      const newUmum = await prisma.member.create({
        data: {
          name: 'Pelanggan Umum',
          phone: '0000000000',
          code: 'UMUM',
          membershipType: 'RETAIL',
          storeId
        }
      });
      return NextResponse.json(newUmum, { status: 201 });
    }

    // Standard member creation
    const existingMember = await prisma.member.findUnique({
      where: { phone_storeId: { phone, storeId } },
    });

    if (existingMember) return NextResponse.json({ error: 'Nomor telepon sudah terdaftar di toko ini' }, { status: 400 });

    let uniqueCode;
    let attempt = 0;
    do {
      uniqueCode = generateShortCode('MEM');
      const exists = await prisma.member.findFirst({ where: { code: uniqueCode, storeId } });
      if (!exists) break;
      attempt++;
    } while (attempt < 10);

    const newMember = await prisma.member.create({
      data: {
        name,
        phone,
        address: address || null,
        membershipType: (membershipType || 'SILVER').toUpperCase(),
        code: uniqueCode,
        storeId
      },
    });

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error('Error creating member:', error);
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    let storeId = session.user.storeId;

    if (!storeId) {
      const su = await prisma.storeUser.findFirst({ where: { userId: session.user.id, status: { in: ['AKTIF', 'ACTIVE'] } } });
      storeId = su?.storeId;
    }

    if (id) {
      await prisma.member.delete({ where: { id, storeId } });
      return NextResponse.json({ message: 'Member deleted' });
    } else {
      const { ids } = await request.json();
      await prisma.member.deleteMany({ where: { id: { in: ids }, storeId } });
      return NextResponse.json({ message: 'Members deleted' });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id, name, phone, address, membershipType } = await request.json();
    const updated = await prisma.member.update({
      where: { id },
      data: { name, phone, address, membershipType: membershipType?.toUpperCase() }
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
