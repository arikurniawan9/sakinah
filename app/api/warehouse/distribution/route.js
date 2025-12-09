import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';
import { logWarehouseDistribution } from '@/lib/auditLogger';

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

    // Get the central warehouse (assuming there's one central warehouse)
    let centralWarehouse = await prisma.warehouse.findFirst({
      where: { name: 'Gudang Pusat' }
    });

    if (!centralWarehouse) {
      // If no central warehouse exists, return error
      return NextResponse.json({ error: 'Gudang pusat tidak ditemukan' }, { status: 404 });
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
              warehouseId: centralWarehouse.id,
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

      // Create individual warehouse distribution records for each product
      const distributionRecords = [];
      for (const item of items) {
        // Find warehouse product by ID
        const warehouseProduct = await tx.warehouseProduct.findUnique({
          where: {
            productId_warehouseId: {
              productId: item.productId,
              warehouseId: centralWarehouse.id,
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
              warehouseId: centralWarehouse.id,
            },
          },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });

        // Create individual warehouse distribution record for this product
        const distributionRecord = await tx.warehouseDistribution.create({
          data: {
            warehouseId: centralWarehouse.id, // Central warehouse
            storeId,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.purchasePrice || warehouseProduct.product.purchasePrice, // Use provided price or product's purchase price
            totalAmount: item.quantity * (item.purchasePrice || warehouseProduct.product.purchasePrice),
            status: distributionStatus || 'PENDING_ACCEPTANCE',
            notes: body.notes || null,
            distributedAt: new Date(distributionDate),
            distributedBy,
          },
        });

        distributionRecords.push(distributionRecord);
      }

      // Return the first distribution record as reference
      const distribution = distributionRecords[0];

      // Log aktivitas distribusi gudang
      // Ambil IP address dan user agent dari request
      const requestHeaders = new Headers(request.headers);
      const ipAddress = requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || '127.0.0.1';
      const userAgent = requestHeaders.get('user-agent') || '';

      // Log untuk setiap item distribusi
      for (const item of distributionRecords) {
        await logWarehouseDistribution(
          session.user.id,
          item,
          ipAddress,
          userAgent,
          storeId // log ke store tujuan
        );
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

// GET - Get warehouse distributions with filtering or get specific distribution by ID
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const distributionId = searchParams.get('id');
    const storeId = searchParams.get('storeId'); // Filter by specific store
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Parameter untuk filtering berdasarkan tanggal
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only WAREHOUSE or MANAGER roles can access warehouse distributions
    if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the central warehouse for the query
    const centralWarehouse = await prisma.warehouse.findFirst({
      where: { name: 'Gudang Pusat' }
    });

    if (!centralWarehouse) {
      return NextResponse.json({ error: 'Gudang pusat tidak ditemukan' }, { status: 404 });
    }

    // If ID is provided, return specific distribution for receipt printing
    // We need to get all distribution records for the same distribution batch
    // The current implementation creates individual records for each product
    // So we'll find all records with the same distributedAt time, storeId, and warehouseId
    if (distributionId) {
      // First, get the reference distribution to get the distributedAt time, storeId, etc.
      const referenceDistribution = await prisma.warehouseDistribution.findFirst({
        where: {
          id: distributionId,
          warehouseId: centralWarehouse.id, // Ensure it's from the central warehouse
        },
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
          product: {
            select: {
              id: true,
              name: true,
              productCode: true,
              purchasePrice: true,
            }
          },
          distributedByUser: {
            select: {
              id: true,
              name: true,
              username: true,
            }
          },
        },
      });

      if (!referenceDistribution) {
        return NextResponse.json({ error: 'Distribusi tidak ditemukan' }, { status: 404 });
      }

      // Now get all distribution records with the same distributedAt, storeId, and warehouseId
      // This captures all items in the same distribution batch
      const allDistributionItems = await prisma.warehouseDistribution.findMany({
        where: {
          distributedAt: referenceDistribution.distributedAt,
          storeId: referenceDistribution.storeId,
          warehouseId: referenceDistribution.warehouseId,
          distributedBy: referenceDistribution.distributedBy,
        },
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
          product: {
            select: {
              id: true,
              name: true,
              productCode: true,
              purchasePrice: true,
            }
          },
          distributedByUser: {
            select: {
              id: true,
              name: true,
              username: true,
            }
          },
        },
        orderBy: {
          product: { name: 'asc' }
        }
      });

      // Return the first record as the main reference but with all items
      return NextResponse.json({
        ...referenceDistribution,
        items: allDistributionItems
      });
    }

    // Otherwise, return list of distributions with pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'Parameter pagination tidak valid' }, { status: 400 });
    }

    const offset = (page - 1) * limit;

    // Membangun klausa where untuk filtering
    const whereClause = {
      warehouseId: centralWarehouse.id, // Hanya distribusi dari gudang pusat
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
          product: {
            select: {
              id: true,
              name: true,
              productCode: true,
              purchasePrice: true,
            }
          },
          distributedByUser: {
            select: {
              id: true,
              name: true,
              username: true,
            }
          },
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
