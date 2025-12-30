import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";

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
    const { storeIds, distributionDate, items, distributedBy, notes } = body;

    if (!storeIds || !Array.isArray(storeIds) || storeIds.length === 0) {
      return Response.json({ error: 'Minimal satu toko tujuan harus dipilih' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'Item distribusi wajib disediakan' }, { status: 400 });
    }

    // Validasi setiap item
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return Response.json({ error: 'Setiap item harus memiliki produk dan jumlah yang valid' }, { status: 400 });
      }
    }

    // Ambil informasi gudang pusat
    const centralWarehouse = await prisma.store.findFirst({
      where: {
        description: 'Gudang pusat untuk distribusi ke toko-toko',
      },
    });

    if (!centralWarehouse) {
      return Response.json({ error: 'Gudang pusat tidak ditemukan' }, { status: 500 });
    }

    // Validasi bahwa semua toko tujuan adalah toko biasa (bukan gudang)
    const targetStores = await prisma.store.findMany({
      where: {
        id: { in: storeIds },
        description: { not: 'Gudang pusat untuk distribusi ke toko-toko' },
      },
    });

    if (targetStores.length !== storeIds.length) {
      return Response.json({ error: 'Salah satu atau lebih toko tujuan tidak valid' }, { status: 400 });
    }

    // Validasi ketersediaan stok untuk setiap produk
    for (const item of items) {
      const warehouseProduct = await prisma.warehouseStock.findFirst({
        where: {
          productId: item.productId,
          storeId: centralWarehouse.id,
        },
      });

      if (!warehouseProduct || warehouseProduct.quantity < item.quantity * storeIds.length) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });

        return Response.json({
          error: `Stok tidak mencukupi untuk produk ${product?.name || 'N/A'}. Tersedia: ${warehouseProduct?.quantity || 0}, Dibutuhkan: ${item.quantity * storeIds.length}`
        }, { status: 400 });
      }
    }

    // Lakukan distribusi multi-toko dalam transaksi
    const results = await prisma.$transaction(async (tx) => {
      const distributionResults = [];

      // Untuk setiap toko tujuan
      for (const storeId of storeIds) {
        // Buat ID invoice unik untuk setiap distribusi
        const dateStr = new Date(distributionDate).toISOString().split('T')[0].replace(/-/g, '');
        const timestamp = Date.now().toString().slice(-4); // Gunakan 4 digit terakhir dari timestamp
        const invoiceNumber = `DIST-${dateStr}-${timestamp}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

        // Proses setiap item untuk toko ini
        for (const item of items) {
          // Buat entri distribusi
          const distribution = await tx.warehouseDistribution.create({
            data: {
              storeId,
              productId: item.productId,
              quantity: item.quantity,
              purchasePrice: item.purchasePrice,
              unitPrice: item.purchasePrice, // Tambahkan unitPrice
              distributedBy: distributedBy || session.user.id,
              invoiceNumber,
              status: 'PENDING_ACCEPTANCE', // Status default untuk distribusi multi-toko
              notes: notes || '',
              distributedAt: new Date(distributionDate),
            },
          });

          distributionResults.push(distribution);

          // Kurangi stok di gudang
          await tx.warehouseStock.update({
            where: {
              id: centralWarehouse.id,
              productId: item.productId,
            },
            data: {
              quantity: {
                decrement: item.quantity,
              },
              updatedAt: new Date(),
            },
          });

          // Tambahkan stok ke toko tujuan
          const existingStock = await tx.productStock.findFirst({
            where: {
              storeId,
              productId: item.productId,
            },
          });

          if (existingStock) {
            await tx.productStock.update({
              where: { id: existingStock.id },
              data: {
                quantity: {
                  increment: item.quantity,
                },
                updatedAt: new Date(),
              },
            });
          } else {
            // Jika produk belum ada di toko, buat entri baru
            await tx.productStock.create({
              data: {
                storeId,
                productId: item.productId,
                quantity: item.quantity,
                lastUpdated: new Date(),
              },
            });
          }

          // Dapatkan informasi produk untuk log
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { name: true, productCode: true },
          });

          // Buat log aktivitas distribusi gudang
          await tx.activityLog.create({
            data: {
              userId: distributedBy || session.user.id,
              action: 'DISTRIBUSI_PRODUK',
              description: `Distribusi produk ${product?.name || 'N/A'} (Kode: ${product?.productCode || 'N/A'}) ke toko ${targetStores.find(s => s.id === storeId)?.name || 'N/A'}, Jumlah: ${item.quantity}`,
              storeId: centralWarehouse.id, // Log aktivitas di gudang
              timestamp: new Date(),
            },
          });

          // Buat log untuk setiap item distribusi
          await tx.activityLog.create({
            data: {
              userId: distributedBy || session.user.id,
              action: 'DISTRIBUSI_ITEM',
              description: `Item distribusi: ${product?.name || 'N/A'}, Jumlah: ${item.quantity}, Tujuan: ${targetStores.find(s => s.id === storeId)?.name || 'N/A'}`,
              storeId: centralWarehouse.id,
              timestamp: new Date(),
            },
          });
        }

        // Jika status distribusi adalah PENDING_ACCEPTANCE, buat notifikasi untuk toko
        // Loop kembali untuk membuat notifikasi
        for (const item of items) {
          const targetStore = targetStores.find(s => s.id === storeId);
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { name: true },
          });

          if (targetStore) {
            await tx.notification.create({
              data: {
                userId: targetStore.userId, // Kiranya ke user toko
                title: `Distribusi Gudang Tertunda ke ${targetStore.name}`,
                message: `Produk '${product?.name || 'N/A'}' sejumlah ${item.quantity} unit siap didistribusikan ke toko '${targetStore.name}'. Menunggu konfirmasi.`,
                type: 'DISTRIBUTION_PENDING',
                read: false,
                storeId: targetStore.id,
              },
            });
          }
        }
      }

      return distributionResults;
    });

    // Dapatkan informasi lengkap tentang distribusi yang dibuat
    const distributionInfo = await prisma.warehouseDistribution.findMany({
      where: {
        id: { in: results.map(r => r.id) },
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            productCode: true,
          },
        },
        distributedByUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Group by invoice number untuk mendapatkan distribusi lengkap per toko
    const groupedDistributions = distributionInfo.reduce((acc, item) => {
      if (!acc[item.invoiceNumber]) {
        acc[item.invoiceNumber] = {
          id: item.invoiceNumber,
          storeId: item.storeId,
          store: item.store,
          distributedBy: item.distributedBy,
          distributedByUser: item.distributedByUser,
          distributedAt: item.distributedAt,
          items: [],
          notes: item.notes,
          status: item.status,
        };
      }
      
      acc[item.invoiceNumber].items.push({
        id: item.id,
        productId: item.productId,
        product: item.product,
        quantity: item.quantity,
        purchasePrice: item.purchasePrice,
      });
      
      return acc;
    }, {});

    const result = Object.values(groupedDistributions);

    return Response.json({ 
      message: 'Distribusi multi-toko berhasil disimpan dan stok diperbarui', 
      distributions: result,
      totalDistributions: result.length,
    });
  } catch (error) {
    console.error('Error creating multi-store distribution:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}