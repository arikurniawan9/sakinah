// app/api/warehouse/suppliers/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';
import { logActivity } from '@/lib/auditTrail';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.WAREHOUSE) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    const search = url.searchParams.get('search') || '';

    // Validasi input
    if (page < 1 || limit < 1 || limit > 100) {
      return new Response(JSON.stringify({ error: 'Parameter halaman atau batas tidak valid' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Bangun where clause
    const whereClause = {};
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.supplier.count({ where: whereClause })
    ]);

    return new Response(JSON.stringify({ 
      suppliers, 
      total,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.WAREHOUSE) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await request.json();

    // Validasi input
    if (!data.name) {
      return new Response(JSON.stringify({ error: 'Nama supplier wajib diisi' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Buat supplier baru
    const newSupplier = await prisma.supplier.create({
      data: {
        name: data.name,
        contactPerson: data.contactPerson || null,
        position: data.position || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        notes: data.notes || null
      }
    });

    // Catat aktivitas
    await logActivity(
      session.user.id,
      'CREATE',
      'SUPPLIER',
      newSupplier.id,
      `Supplier "${newSupplier.name}" ditambahkan`,
      null,
      { ...newSupplier }
    );

    return new Response(JSON.stringify(newSupplier), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating supplier:', error);
    
    if (error.code === 'P2002') {
      // Unique constraint violation
      return new Response(JSON.stringify({ error: 'Email supplier sudah digunakan' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.WAREHOUSE) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const supplierId = url.pathname.split('/').pop(); // Ambil ID dari path

    // Validasi ID
    if (!supplierId) {
      return new Response(JSON.stringify({ error: 'ID supplier tidak valid' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await request.json();

    // Ambil data supplier sebelum update
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id: supplierId }
    });

    if (!existingSupplier) {
      return new Response(JSON.stringify({ error: 'Supplier tidak ditemukan' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update supplier
    const updatedSupplier = await prisma.supplier.update({
      where: { id: supplierId },
      data: {
        name: data.name,
        contactPerson: data.contactPerson,
        position: data.position,
        phone: data.phone,
        email: data.email,
        address: data.address,
        notes: data.notes
      }
    });

    // Catat aktivitas
    await logActivity(
      session.user.id,
      'UPDATE',
      'SUPPLIER',
      updatedSupplier.id,
      `Data supplier "${updatedSupplier.name}" diperbarui`,
      { ...existingSupplier },
      { ...updatedSupplier }
    );

    return new Response(JSON.stringify(updatedSupplier), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating supplier:', error);
    
    if (error.code === 'P2002') {
      // Unique constraint violation
      return new Response(JSON.stringify({ error: 'Email supplier sudah digunakan' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.WAREHOUSE) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const supplierId = url.pathname.split('/').pop(); // Ambil ID dari path

    // Validasi ID
    if (!supplierId) {
      return new Response(JSON.stringify({ error: 'ID supplier tidak valid' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Ambil data supplier sebelum dihapus
    const supplierToDelete = await prisma.supplier.findUnique({
      where: { id: supplierId }
    });

    if (!supplierToDelete) {
      return new Response(JSON.stringify({ error: 'Supplier tidak ditemukan' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Hapus supplier
    await prisma.supplier.delete({
      where: { id: supplierId }
    });

    // Catat aktivitas
    await logActivity(
      session.user.id,
      'DELETE',
      'SUPPLIER',
      supplierToDelete.id,
      `Supplier "${supplierToDelete.name}" dihapus`,
      { ...supplierToDelete },
      null
    );

    return new Response(JSON.stringify({ 
      message: 'Supplier berhasil dihapus',
      id: supplierId 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}