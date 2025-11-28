import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES, WAREHOUSE_STORE_ID } from '@/lib/constants';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only WAREHOUSE or MANAGER roles can create warehouse distributions
    if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { storeId, distributionDate, items, distributedBy, status: distributionStatus } = body;

    if (!storeId || !distributionDate || !items || items.length === 0) {
      return NextResponse.json({ error: 'Data distribusi tidak lengkap' }, { status: 400 });
    }

    // Ensure the target store exists
    const targetStore = await prisma.store.findUnique({
      where: { id: storeId }
    });

    if (!targetStore) {
      return NextResponse.json({ error: 'Toko tujuan tidak ditemukan' }, { status: 404 });
    }

    // Use a transaction to ensure atomicity
    const newDistribution = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;

      // First, check stock and calculate total amount
      for (const item of items) {
        const warehouseProduct = await tx.warehouseProduct.findUnique({
          where: {
            productId_warehouseId: {
              productId: item.productId,
              warehouseId: WAREHOUSE_STORE_ID,
            },
          },
          include: {
            product: true // Include the actual product to get purchase price
          }
        });

        if (!warehouseProduct || warehouseProduct.quantity < item.quantity) {
          throw new Error(`Stok produk ${item.productId} tidak mencukupi di gudang`);
        }

        // Use the product's purchase price for calculation
        totalAmount += item.quantity * warehouseProduct.product.purchasePrice;
      }

      // Create WarehouseDistribution record
      const distribution = await tx.warehouseDistribution.create({
        data: {
          warehouseId: WAREHOUSE_STORE_ID, // Central warehouse
          storeId,
          distributedBy,
          distributedAt: new Date(distributionDate),
          status: distributionStatus || 'DELIVERED',
          notes: body.notes || null,
          totalAmount,
        },
      });

      // Update WarehouseProduct quantities and target store's Product stock
      for (const item of items) {
        // Find warehouse product by ID
        const warehouseProduct = await tx.warehouseProduct.findUnique({
          where: {
            productId_warehouseId: {
              productId: item.productId,
              warehouseId: WAREHOUSE_STORE_ID,
            },
          },
          include: {
            product: true
          }
        });

        // Decrement warehouse stock
        await tx.warehouseProduct.update({
          where: {
            productId_warehouseId: {
              productId: item.productId,
              warehouseId: WAREHOUSE_STORE_ID,
            },
          },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });

        // Find the corresponding product in the target store
        let existingStoreProduct = await tx.product.findFirst({
          where: {
            productCode: warehouseProduct.product.productCode,
            storeId: storeId
          }
        });

        if (existingStoreProduct) {
          // If the product exists, update the stock
          await tx.product.update({
            where: { id: existingStoreProduct.id },
            data: {
              stock: {
                increment: item.quantity,
              },
              // Optionally update other fields if needed
              name: warehouseProduct.product.name,
              categoryId: warehouseProduct.product.categoryId,
              purchasePrice: warehouseProduct.product.purchasePrice,
              supplierId: warehouseProduct.product.supplierId,
            },
          });
        } else {
          // If the product doesn't exist, create it in the target store
          await tx.product.create({
            data: {
              name: warehouseProduct.product.name,
              productCode: warehouseProduct.product.productCode,
              categoryId: warehouseProduct.product.categoryId,
              stock: item.quantity,
              purchasePrice: warehouseProduct.product.purchasePrice,
              supplierId: warehouseProduct.product.supplierId,
              description: warehouseProduct.product.description || null,
              image: warehouseProduct.image || null,
              storeId: storeId, // This is the target store
            }
          });
        }
      }

      return distribution;
    });

    return NextResponse.json({
      success: true,
      distribution: newDistribution,
      message: 'Distribusi produk berhasil disimpan dan stok diperbarui',
    });
  } catch (error) {
    console.error('Error creating warehouse distribution:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// GET - Get warehouse distributions with filtering
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only WAREHOUSE or MANAGER roles can access warehouse distributions
    if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId'); // Filter by specific store
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Parameter untuk filtering berdasarkan tanggal
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'Parameter pagination tidak valid' }, { status: 400 });
    }

    const offset = (page - 1) * limit;

    // Membangun klausa where untuk filtering
    const whereClause = {
      warehouseId: WAREHOUSE_STORE_ID, // Hanya distribusi dari gudang pusat
      ...(storeId && { storeId }), // Filter berdasarkan toko jika disediakan
      ...(startDate && {
        distributedAt: {
          gte: new Date(startDate),
        }
      }),
      ...(endDate && {
        distributedAt: {
          lte: new Date(`${endDate}T23:59:59Z`), // Include full end date
        }
      }),
    };

    const [distributions, totalCount] = await Promise.all([
      prisma.warehouseDistribution.findMany({
        where: whereClause,
        skip: offset,
        take: limit,
        include: {
          warehouse: {
            select: {
              id: true,
              name: true,
            }
          },
          store: {
            select: {
              id: true,
              name: true,
              code: true,
            }
          },
          distributedByUser: {
            select: {
              id: true,
              name: true,
              username: true,
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  productCode: true,
                }
              }
            }
          }
        },
        orderBy: {
          distributedAt: 'desc',
        },
      }),
      prisma.warehouseDistribution.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      distributions,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching warehouse distributions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
