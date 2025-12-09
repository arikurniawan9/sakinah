import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import globalPrisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';
import { logWarehousePurchase } from '@/lib/auditLogger';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only WAREHOUSE or MANAGER roles can create warehouse purchases
    if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { supplierId, purchaseDate, items, createdBy } = body;

    // For WAREHOUSE role users, we'll use the warehouse master store
    // If user is WAREHOUSE role, they operate on the warehouse master store
    let effectiveStoreId = 'WAREHOUSE_MASTER_STORE';

    // If user has MANAGER role, they must have a specific store context
    if (session.user.role === ROLES.MANAGER) {
        if (!session.user.storeId) {
          console.error('MANAGER user does not have storeId:', session.user);
          return NextResponse.json({ error: 'User MANAGER harus memiliki akses ke toko tertentu. Silakan pilih toko terlebih dahulu.' }, { status: 400 });
        }
        effectiveStoreId = session.user.storeId;
    }

    if (!supplierId || !purchaseDate || !items || items.length === 0) {
      return NextResponse.json({ error: 'Data pembelian tidak lengkap' }, { status: 400 });
    }

    // Validate all items have required fields
    for (const item of items) {
      if (!item.productId || !item.quantity || !item.purchasePrice) {
        return NextResponse.json({ error: 'Setiap item harus memiliki productId, quantity, dan purchasePrice' }, { status: 400 });
      }

      // Check if product exists - allow products from any store to be added to warehouse
      const product = await globalPrisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return NextResponse.json({ error: `Produk dengan ID ${item.productId} tidak ditemukan di database` }, { status: 400 });
      }

      // For warehouse purchases, we allow products from any store to be added to warehouse
      // The system will create/update master product in warehouse as needed
    }

    // Get the warehouse for this store (assuming there's a warehouse associated with each store)
    // For now, we'll create or get a general warehouse or use a default one
    let warehouse = await globalPrisma.warehouse.findFirst({
      where: { name: 'Gudang Pusat' } // Default warehouse
    });

    if (!warehouse) {
      // Create a default warehouse if it doesn't exist
      warehouse = await globalPrisma.warehouse.create({
        data: {
          name: 'Gudang Pusat',
          description: 'Gudang utama untuk semua toko',
          status: 'ACTIVE'
        }
      });
    }

    const newPurchase = await globalPrisma.$transaction(async (prisma) => {
      // Process items and handle products properly for warehouse context
      const processedItems = [];

      for (const item of items) {
        const originalProduct = await prisma.product.findUnique({
          where: { id: item.productId },
          include: {
            category: true,
            supplier: true
          }
        });

        if (!originalProduct) {
          throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan`);
        }

        // Check if there's already a master product with the same product code in warehouse
        let masterProduct = await prisma.product.findFirst({
          where: {
            productCode: originalProduct.productCode,
            storeId: 'WAREHOUSE_MASTER_STORE'
          }
        });

        // If no master product exists, create one based on the original product
        if (!masterProduct) {
          // Create new master product in warehouse store
          masterProduct = await prisma.product.create({
            data: {
              name: originalProduct.name,
              productCode: originalProduct.productCode,
              categoryId: originalProduct.categoryId, // Copy the categoryId from original product
              supplierId: originalProduct.supplierId, // Copy the supplierId from original product
              stock: 0, // Start with 0 stock, will be incremented below
              purchasePrice: item.purchasePrice, // Use the new purchase price
              storeId: 'WAREHOUSE_MASTER_STORE',
              description: originalProduct.description || '',
              image: originalProduct.image, // Copy image if exists
            }
          });
        } else {
          // If master product exists, update its details with the new values
          await prisma.product.update({
            where: { id: masterProduct.id },
            data: {
              purchasePrice: item.purchasePrice,
              // Update other fields with values from original product if not already set or to keep them current
              name: originalProduct.name,
              description: originalProduct.description || masterProduct.description || '',
              categoryId: originalProduct.categoryId, // Always update categoryId
              supplierId: originalProduct.supplierId, // Always update supplierId
              image: originalProduct.image || masterProduct.image,
            }
          });
        }

        // Update the original product's stock (the one in the specific store)
        const updatedOriginalProduct = await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity
            },
            purchasePrice: item.purchasePrice // Update purchase price to new value
          }
        });

        processedItems.push({
          ...item,
          productId: updatedOriginalProduct.id
        });
      }

      // 1. Create the Purchase record, linking to effective store
      const purchase = await prisma.purchase.create({
        data: {
          storeId: effectiveStoreId, // Use effective store ID for the purchase record
          supplierId,
          userId: session.user.id, // User who made the purchase (WAREHOUSE or MANAGER)
          purchaseDate: new Date(purchaseDate),
          totalAmount: processedItems.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0),
          status: 'COMPLETED', // Or 'PENDING' based on workflow
          items: {
            create: processedItems.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              purchasePrice: item.purchasePrice,
              subtotal: item.quantity * item.purchasePrice,
              storeId: effectiveStoreId, // Use effective store ID
            })),
          },
        },
      });

      // 2. Update warehouse stock for all products purchased
      // This adds the purchased items to the actual warehouse inventory
      for (const originalItem of items) {
        const originalProduct = await prisma.product.findUnique({
          where: { id: originalItem.productId },
          include: {
            category: true,
            supplier: true
          }
        });

        if (originalProduct) {
          // Find or create the master product in warehouse
          let masterProduct = await prisma.product.findFirst({
            where: {
              productCode: originalProduct.productCode,
              storeId: 'WAREHOUSE_MASTER_STORE'
            }
          });

          if (!masterProduct) {
            // This should not happen if the logic above worked properly
            masterProduct = await prisma.product.create({
              data: {
                name: originalProduct.name,
                productCode: originalProduct.productCode,
                categoryId: originalProduct.categoryId,
                supplierId: originalProduct.supplierId,
                stock: 0,
                purchasePrice: originalItem.purchasePrice,
                storeId: 'WAREHOUSE_MASTER_STORE',
                description: originalProduct.description || '',
                image: originalProduct.image,
              }
            });
          }

          // Update or create warehouse stock using the master product ID
          await prisma.warehouseProduct.upsert({
            where: {
              productId_warehouseId: {
                productId: masterProduct.id,
                warehouseId: warehouse.id,
              },
            },
            update: {
              quantity: {
                increment: originalItem.quantity,
              },
            },
            create: {
              productId: masterProduct.id,
              warehouseId: warehouse.id,
              quantity: originalItem.quantity,
            },
          });
        }
      }

      // Log aktivitas pembelian gudang
      // Ambil IP address dan user agent dari request
      const requestHeaders = new Headers(request.headers);
      const ipAddress = requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || '127.0.0.1';
      const userAgent = requestHeaders.get('user-agent') || '';

      await logWarehousePurchase(
        session.user.id,
        {
          id: purchase.id,
          warehouseId: warehouse.id,
          supplierId,
          totalAmount: purchase.totalAmount,
          status: purchase.status,
          purchasedAt: purchase.purchaseDate,
          purchasedBy: session.user.id,
        },
        ipAddress,
        userAgent,
        'WAREHOUSE_MASTER_STORE' // Log ke store gudang
      );

      return purchase;
    });


    return NextResponse.json({
      success: true,
      purchase: newPurchase,
      message: 'Pembelian gudang berhasil disimpan dan stok diperbarui',
    });
  } catch (error) {
    console.error('Error creating warehouse purchase:', error);

    // Provide more specific error messages
    if (error.code === 'P2003') { // Foreign key constraint error
      return NextResponse.json({ error: 'Supplier atau produk tidak ditemukan' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
