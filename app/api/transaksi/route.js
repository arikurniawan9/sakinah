// app/api/transaksi/route.js
import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/authOptions';
import { logCreate } from '@/lib/auditLogger';
import initRedisClient from '@/lib/redis';

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session || !['CASHIER', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Ambil storeId dari session untuk filter
    const storeId = session.user.storeId;
    if (!storeId) {
      return NextResponse.json({ error: 'User is not associated with a store' }, { status: 400 });
    }

    // Ambil query parameter
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');

    // Generate cache key
    const cacheKey = `transactions:${storeId}:${memberId || 'all'}:${page}:${limit}`;
    let redisClient;
    try {
      redisClient = await initRedisClient();
    } catch (error) {
      console.warn('Redis not available, proceeding without caching:', error.message);
    }

    // Try to get cached data
    let cachedData = null;
    if (redisClient) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          console.log('Cache hit for transactions');
          return NextResponse.json(JSON.parse(cached));
        }
      } catch (error) {
        console.warn('Cache retrieval failed:', error.message);
      }
    }

    // Buat filter berdasarkan storeId dan memberId jika disediakan
    const filter = {
      storeId: storeId,
    };
    if (memberId) {
      filter.memberId = memberId;
    }

    // Ambil transaksi dengan filter dan pagination
    const [transactions, totalCount] = await Promise.all([
      prisma.sale.findMany({
        where: filter,
        select: {
          id: true,
          invoiceNumber: true,
          date: true,
          total: true,
          tax: true,
          payment: true,
          change: true,
          status: true,
          paymentMethod: true,
          referenceNumber: true,
          cashier: {
            select: {
              name: true,
              username: true,
            }
          },
          attendant: {
            select: {
              name: true,
              username: true,
            }
          },
          member: {
            select: {
              name: true,
              phone: true,
              membershipType: true,
            }
          },
          saleDetails: {
            select: {
              id: true,
              quantity: true,
              price: true,
              discount: true,
              subtotal: true,
              product: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          },
        },
        orderBy: {
          date: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.sale.count({
        where: filter,
      })
    ]);

    const result = {
      transactions,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      }
    };

    // Cache the response if Redis is available
    if (redisClient) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(result), { EX: 300 }); // Cache for 5 minutes
      } catch (error) {
        console.warn('Cache storage failed:', error.message);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Function to generate a unique invoice number with format: YYYYMMDDXXXXX (year-month-date-5digit_urut)
async function generateInvoiceNumber(storeId) {
  const date = new Date();
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  const datePrefix = `${year}${month}${day}`; // YYYYMMDD format

  // Hitung jumlah transaksi hari ini untuk menentukan nomor urut
  const todayStart = new Date(date);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(date);
  todayEnd.setHours(23, 59, 59, 999);

  // Hitung jumlah transaksi dengan format yang sama hari ini
  const existingSalesCount = await prisma.sale.count({
    where: {
      invoiceNumber: {
        startsWith: datePrefix
      },
      storeId: storeId, // Pastikan menghitung per toko
      createdAt: {
        gte: todayStart,
        lte: todayEnd
      }
    }
  });

  // Nomor urut dimulai dari 1 setiap hari
  const sequenceNumber = (existingSalesCount + 1).toString().padStart(5, '0'); // 5 digit dengan leading zeros

  // Gabungkan format: YYYYMMDD + 5 digit urut
  const invoiceNumber = `${datePrefix}${sequenceNumber}`;

  // Pastikan nomor unik (jaga-jaga jika ada konflik)
  const existingSale = await prisma.sale.findFirst({
    where: {
      invoiceNumber: invoiceNumber,
      storeId: storeId, // Pastikan memeriksa invoice number unik per toko
    },
  });

  if (existingSale) {
    // Jika ternyata sudah ada (kemungkinan kecil), tambahkan angka acak kecil
    const randomSuffix = Math.floor(10 + Math.random() * 89).toString(); // 2 digit acak
    const altSequence = (parseInt(sequenceNumber) + parseInt(randomSuffix)).toString().padStart(5, '0');
    return `${datePrefix}${altSequence}`;
  }

  return invoiceNumber;
}


import { getIo } from '@/lib/socket';

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session || !['CASHIER', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    items,
    total,
    payment,
    change,
    tax,
    memberId,
    attendantId,
    paymentMethod, // Add payment method
    status, // Tambahkan status transaksi
    referenceNumber, // Tambahkan reference number untuk pembayaran non-tunai
    discount = 0, // Item discount (optional, default 0)
    additionalDiscount = 0 // Overall discount (optional, default 0)
  } = body;

  const finalMemberId = memberId === 'general-customer' ? null : memberId;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
  }

  if (!attendantId) {
    return NextResponse.json({ error: 'Attendant must be selected' }, { status: 400 });
  }

  // Untuk transaksi hutang, memberId wajib (dan tidak boleh general-customer)
  if (!finalMemberId && (status === 'UNPAID' || status === 'CREDIT' || status === 'CREDIT_PAID')) {
    return NextResponse.json({ error: 'Member must be selected for credit transactions' }, { status: 400 });
  }

  // Validasi stok sebelum membuat transaksi
  try {
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: {
          id: true,
          name: true,
          stock: true
        }
      });

      if (!product) {
        return NextResponse.json({ error: `Produk dengan ID ${item.productId} tidak ditemukan.` }, { status: 400 });
      }

      if (product.stock < item.quantity) {
        return NextResponse.json({
          error: `Stok tidak cukup untuk produk "${product.name}". Stok tersedia: ${product.stock}, permintaan: ${item.quantity}.`
        }, { status: 400 });
      }
    }
  } catch (error) {
    console.error('Error validating stock:', error);
    return NextResponse.json({ error: 'Gagal memvalidasi stok produk.' }, { status: 500 });
  }

  try {
    const newInvoiceNumber = await generateInvoiceNumber(session.user.storeId);

    const sale = await prisma.$transaction(async (tx) => {
      // 1. Validasi ulang stok sebelum membuat transaksi untuk mencegah race condition
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            name: true,
            stock: true
          }
        });

        if (!product) {
          throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan.`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`Stok tidak cukup untuk produk "${product.name}". Stok tersedia: ${product.stock}, permintaan: ${item.quantity}.`);
        }
      }

      // 2. Create the Sale record - 'total' from frontend is already member-priced
      const totalAfterDiscount = total - additionalDiscount; // Only subtract overall discount

      const newSale = await tx.sale.create({
        data: {
          invoiceNumber: newInvoiceNumber,
          storeId: session.user.storeId, // Tambahkan storeId dari session user
          cashierId: session.user.id,
          attendantId: attendantId,
          memberId: finalMemberId,
          paymentMethod: paymentMethod || 'CASH', // Include payment method, default to CASH
          total: totalAfterDiscount,
          tax: tax,
          payment: payment,
          change: change,
          status: status || 'PAID', // Gunakan status yang dikirim, default ke 'PAID'
          referenceNumber: referenceNumber || null, // Simpan reference number jika ada
          saleDetails: {
            create: items.map(item => ({
              storeId: session.user.storeId, // Tambahkan storeId ke detail penjualan
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              discount: item.discount || 0, // Item discount per detail
              subtotal: item.price * item.quantity,
            })),
          },
        },
        include: {
          saleDetails: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      // 3. Update product stock - dilakukan untuk semua transaksi karena produk telah diberikan ke pelanggan
      const io = getIo(); // Get io instance once
      for (const item of items) {
        const updatedProduct = await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
          select: {
            id: true,
            name: true,
            stock: true
          }
        });

        // Emit real-time stock update
        if (io && session.user.storeId) {
            const room = `attendant-store-${session.user.storeId}`;
            io.to(room).emit('stock:update', {
                productId: updatedProduct.id,
                stock: updatedProduct.stock
            });
            console.log(`Emitted 'stock:update' to ${room} for product ${updatedProduct.id}`);
        }

        if (updatedProduct.stock < 0) {
          throw new Error(`Stok produk ${updatedProduct.name} menjadi negatif setelah transaksi.`);
        }
      }

      // 4. Jika status UNPAID, PARTIALLY_PAID, CREDIT, atau CREDIT_PAID, buat juga entri di Receivable
      if ((status === 'UNPAID' || status === 'PARTIALLY_PAID' || status === 'CREDIT' || status === 'CREDIT_PAID') && finalMemberId) {
        const finalTotal = total - additionalDiscount;
        const remainingAmount = finalTotal - (payment || 0);
        if (remainingAmount > 0) {
          await tx.receivable.create({
            data: {
              storeId: session.user.storeId,
              saleId: newSale.id,
              memberId: finalMemberId,
              amountDue: finalTotal,
              amountPaid: payment || 0,
              status: payment > 0 ? 'PARTIALLY_PAID' : 'UNPAID',
            }
          });
        }
      }

      return newSale;
    });

    // Invalidate related caches after successful transaction
    const redisClient = await initRedisClient().catch(() => null);
    if (redisClient) {
      try {
        // Clear related cache entries
        await redisClient.del(`dashboard_data:*:${session.user.storeId}:*`); // Clear dashboard cache for this store
        await redisClient.del(`products:${session.user.storeId}:*`); // Clear product cache for this store
      } catch (error) {
        console.warn('Cache invalidation failed:', error.message);
      }
    }

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await logCreate(session.user.id, 'Sale', sale, ipAddress, userAgent, session.user.storeId);

    console.log("Sale object created:", {
      id: sale.id,
      invoiceNumber: sale.invoiceNumber,
      total: sale.total,
      paymentMethod: sale.paymentMethod,
      status: sale.status
    });

    return NextResponse.json({
      ...sale,
      invoiceNumber: sale.invoiceNumber,
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create sale:', error);

    if (error.message && error.message.includes('stok menjadi negatif')) {
      return NextResponse.json({
        error: 'Gagal membuat transaksi: Stok produk tidak mencukupi karena transaksi lain sedang berlangsung.'
      }, { status: 400 });
    }

    if (error.code === 'P2025' || (error.meta && error.meta.cause === 'Record to update not found.')) {
       return NextResponse.json({ error: 'Gagal membuat transaksi: Stok produk tidak mencukupi.' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Gagal membuat transaksi: ' + error.message || 'Terjadi kesalahan internal.' }, { status: 500 });
  }
}