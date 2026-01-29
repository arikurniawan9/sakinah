// app/api/suspended-sales/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

import { getIo } from '@/lib/socket';

// GET /api/suspended-sales - Fetch all suspended sales
export async function GET(request) {
  const session = await getSession();
  if (!session || !['ADMIN', 'CASHIER', 'ATTENDANT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const suspendedSales = await prisma.suspendedSale.findMany({
      where: {
        storeId: session.user.storeId, // Filter by store of the current user
      },
      include: {
        member: { // Include the related Member model
          select: {
            name: true,
            membershipType: true,
            code: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Ambil nama pelayan untuk setiap suspended sale
    const salesWithParsedCart = [];

    for (const sale of suspendedSales) {
      let parsedCartItems;
      try {
        parsedCartItems = JSON.parse(sale.cartItems);
      } catch (parseError) {
        console.error('Error parsing cart items for sale ID:', sale.id, parseError);
        parsedCartItems = [];
      }

      let attendantName = null;
      if (sale.selectedAttendantId) {
        try {
          // Ambil informasi pelayan dari tabel User
          const attendant = await prisma.user.findUnique({
            where: { id: sale.selectedAttendantId },
            select: { name: true }
          });
          attendantName = attendant?.name;
        } catch (error) {
          console.error('Error fetching attendant name:', error);
        }
      }

      salesWithParsedCart.push({
        ...sale,
        cartItems: parsedCartItems,
        additionalDiscount: sale.additionalDiscount || 0, // Tambahkan diskon tambahan
        selectedAttendantId: sale.selectedAttendantId, // Tambahkan ID pelayan yang dipilih
        attendantName, // Tambahkan nama pelayan
        memberDetails: sale.member ? { // Add member details if available
          name: sale.member.name,
          membershipType: sale.member.membershipType,
          code: sale.member.code,
        } : null,
      });
    }

    return NextResponse.json({ suspendedSales: salesWithParsedCart });
  } catch (error) {
    console.error('Error fetching suspended sales:', error);
    return NextResponse.json({ error: 'Failed to fetch suspended sales' }, { status: 500 });
  }
}

// POST /api/suspended-sales - Create a new suspended sale
export async function POST(request) {
  const session = await getSession();
  if (!session || !['ADMIN', 'CASHIER', 'ATTENDANT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, cartItems, memberId, notes, additionalDiscount, selectedAttendantId, items, note, attendantId } = await request.json();
    console.log('POST /api/suspended-sales: Received memberId:', memberId);
    console.log('POST /api/suspended-sales: Received items (from attendant):', items);
    console.log('POST /api/suspended-sales: Received cartItems (from cashier):', cartItems);

    // Gunakan items (dari pelayan) jika tersedia, jika tidak gunakan cartItems (dari kasir)
    const itemsToUse = items || cartItems;
    // Gunakan note (dari pelayan) jika tersedia, jika tidak gunakan notes (dari kasir)
    const noteToUse = note || notes || '';

    if (!itemsToUse || !Array.isArray(itemsToUse) || itemsToUse.length === 0) {
      return NextResponse.json({ error: 'Cart items are required' }, { status: 400 });
    }

    // Validasi bahwa itemsToUse dapat diserialisasi dengan aman
    let serializedCartItems;
    try {
      serializedCartItems = JSON.stringify(itemsToUse);
    } catch (serializeError) {
      console.error('Error serializing cart items:', serializeError);
      return NextResponse.json({ error: 'Invalid cart items format' }, { status: 400 });
    }

    // Gunakan nama default jika tidak disediakan
    const nameToUse = name || `Pesanan dari Pelayan ${session.user.name}`;

    const newSuspendedSale = await prisma.suspendedSale.create({
      data: {
        name: nameToUse,
        notes: noteToUse,
        memberId,
        additionalDiscount: additionalDiscount ? parseInt(additionalDiscount) || 0 : 0, // Pastikan tipe data benar
        selectedAttendantId: selectedAttendantId || attendantId || null, // Simpan ID pelayan yang dipilih, atau null jika tidak ada
        cartItems: serializedCartItems, // Gunakan variabel yang sudah divalidasi
        storeId: session.user.storeId, // Tambahkan storeId dari session user
      },
      include: {
        member: {
          select: {
            name: true,
            membershipType: true,
            code: true,
          },
        },
      }
    });

    // Kirim event real-time ke kasir
    const io = getIo();
    if (io && newSuspendedSale.storeId) {
      let attendantName = null;
      if (newSuspendedSale.selectedAttendantId) {
        try {
          const attendant = await prisma.user.findUnique({
            where: { id: newSuspendedSale.selectedAttendantId },
            select: { name: true }
          });
          attendantName = attendant?.name;
        } catch (error) {
          console.error('Error fetching attendant name for socket event:', error);
        }
      }

      const saleForEvent = {
        ...newSuspendedSale,
        cartItems: JSON.parse(newSuspendedSale.cartItems), // Pastikan cartItems di-parse
        attendantName,
        memberDetails: newSuspendedSale.member ? {
          name: newSuspendedSale.member.name,
          membershipType: newSuspendedSale.member.membershipType,
          code: newSuspendedSale.member.code,
        } : null,
      };

      const room = `cashier-store-${newSuspendedSale.storeId}`;
      io.to(room).emit('sale:suspended:new', saleForEvent);
      console.log(`Emitted 'sale:suspended:new' event to room ${room}`);
    }

    return NextResponse.json(newSuspendedSale, { status: 201 });
  } catch (error) {
    console.error('Error creating suspended sale:', error);
    // Jika error terkait validasi Prisma, kembalikan pesan error yang lebih spesifik
    if (error.code === 'P2002') {
      // Unique constraint violation
      return NextResponse.json({ error: 'Data already exists with this unique constraint' }, { status: 400 });
    } else if (error.code === 'P2003') {
      // Foreign key constraint violation
      return NextResponse.json({ error: 'Referenced data does not exist' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create suspended sale: ' + error.message }, { status: 500 });
  }
}

// DELETE /api/suspended-sales - Delete a suspended sale
export async function DELETE(request) {
  const session = await getSession();
  if (!session || !['ADMIN', 'CASHIER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Suspended sale ID is required' }, { status: 400 });
    }

    await prisma.suspendedSale.delete({
      where: {
        id,
        storeId: session.user.storeId, // Pastikan hanya menghapus suspended sale dari toko yang sesuai
      },
    });

    return NextResponse.json({ message: 'Suspended sale deleted successfully' });
  } catch (error) {
    console.error('Error deleting suspended sale:', error);
    return NextResponse.json({ error: 'Failed to delete suspended sale' }, { status: 500 });
  }
}
