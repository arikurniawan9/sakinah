import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Hanya user dengan role WAREHOUSE atau lebih tinggi yang bisa mengakses
    if (!['WAREHOUSE', 'ADMIN', 'MANAGER'].includes(session.user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const storeId = url.searchParams.get('storeId');

    // Ambil draft distribusi berdasarkan storeId jika disediakan, atau semua draft milik user
    let whereClause = {
      status: 'DRAFT',
      distributedBy: session.user.id,
    };

    if (storeId) {
      whereClause.storeId = storeId;
    }

    const draftDistributions = await prisma.warehouseDistribution.findMany({
      where: whereClause,
      include: {
        store: {
          select: {
            id: true,
            name: true,
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            productCode: true,
          }
        },
        distributedByUser: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group by invoice number to get complete draft distributions
    const groupedDrafts = draftDistributions.reduce((acc, item) => {
      const invoiceNumber = item.invoiceNumber;
      if (!acc[invoiceNumber]) {
        acc[invoiceNumber] = {
          id: item.invoiceNumber,
          storeId: item.storeId,
          store: item.store,
          distributedBy: item.distributedBy,
          distributedByUser: item.distributedByUser,
          distributedAt: item.distributedAt,
          items: [],
          notes: item.notes,
          status: item.status,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        };
      }
      
      acc[invoiceNumber].items.push({
        id: item.id,
        productId: item.productId,
        product: item.product,
        quantity: item.quantity,
        purchasePrice: item.purchasePrice,
      });
      
      return acc;
    }, {});

    const result = Object.values(groupedDrafts);

    return Response.json({ drafts: result });
  } catch (error) {
    console.error('Error fetching draft distributions:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['WAREHOUSE', 'ADMIN', 'MANAGER'].includes(session.user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { storeId, items, notes } = body;

    if (!storeId || !items || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'Store ID dan items distribusi wajib disediakan' }, { status: 400 });
    }

    // Mulai transaksi database
    const result = await prisma.$transaction(async (tx) => {
      // Hapus draft lama untuk toko ini jika ada
      await tx.warehouseDistribution.deleteMany({
        where: {
          storeId: storeId,
          distributedBy: session.user.id,
          status: 'DRAFT',
        },
      });

      // Buat ID unik untuk draft
      const draftId = `DRAFT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Buat entri distribusi untuk setiap item
      const distributionPromises = items.map((item) =>
        tx.warehouseDistribution.create({
          data: {
            storeId,
            productId: item.productId,
            quantity: item.quantity,
            purchasePrice: item.purchasePrice,
            unitPrice: item.purchasePrice, // Tambahkan unitPrice
            distributedBy: session.user.id,
            invoiceNumber: draftId, // Gunakan ID draft sebagai invoice number
            status: 'DRAFT',
            notes: notes || '',
            distributedAt: new Date(),
          },
        })
      );

      const distributionItems = await Promise.all(distributionPromises);

      return distributionItems;
    });

    return Response.json({ 
      message: 'Draft distribusi berhasil disimpan', 
      draftId: result[0].invoiceNumber,
      items: result 
    });
  } catch (error) {
    console.error('Error saving draft distribution:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['WAREHOUSE', 'ADMIN', 'MANAGER'].includes(session.user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { draftId, storeId, items, notes } = body;

    if (!draftId || !storeId || !items || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'Draft ID, Store ID, dan items distribusi wajib disediakan' }, { status: 400 });
    }

    // Update draft distribusi
    const result = await prisma.$transaction(async (tx) => {
      // Hapus item draft lama
      await tx.warehouseDistribution.deleteMany({
        where: {
          invoiceNumber: draftId,
          distributedBy: session.user.id,
          status: 'DRAFT',
        },
      });

      // Buat ulang item draft
      const distributionPromises = items.map((item) =>
        tx.warehouseDistribution.create({
          data: {
            storeId,
            productId: item.productId,
            quantity: item.quantity,
            purchasePrice: item.purchasePrice,
            unitPrice: item.purchasePrice, // Tambahkan unitPrice
            distributedBy: session.user.id,
            invoiceNumber: draftId,
            status: 'DRAFT',
            notes: notes || '',
            distributedAt: new Date(),
          },
        })
      );

      const distributionItems = await Promise.all(distributionPromises);

      return distributionItems;
    });

    return Response.json({ 
      message: 'Draft distribusi berhasil diperbarui', 
      draftId: result[0].invoiceNumber,
      items: result 
    });
  } catch (error) {
    console.error('Error updating draft distribution:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['WAREHOUSE', 'ADMIN', 'MANAGER'].includes(session.user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const draftId = url.searchParams.get('draftId');

    if (!draftId) {
      return Response.json({ error: 'Draft ID wajib disediakan' }, { status: 400 });
    }

    // Hapus draft distribusi
    await prisma.warehouseDistribution.deleteMany({
      where: {
        invoiceNumber: draftId,
        distributedBy: session.user.id,
        status: 'DRAFT',
      },
    });

    return Response.json({ message: 'Draft distribusi berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting draft distribution:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}