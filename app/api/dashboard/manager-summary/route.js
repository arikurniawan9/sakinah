// app/api/dashboard/manager-summary/route.js
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { getFromCache, setToCache } from '@/lib/cache';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'MANAGER') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Gunakan cache untuk data dashboard
    const cacheKey = `manager-dashboard-summary-${session.user.id}`;
    const cachedData = await getFromCache(cacheKey);

    if (cachedData) {
      console.log('Serving dashboard summary from cache');
      return new Response(JSON.stringify(cachedData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Ambil data statistik keseluruhan
    const [totalStores, activeStores, todaySalesData, recentActivity, lowStockProducts, warehouseProducts] = await Promise.all([
      // Total stores
      prisma.store.count({
        where: { status: 'ACTIVE' }
      }),
      // Active stores
      prisma.store.count({
        where: { status: 'ACTIVE' }
      }),
      // Data penjualan hari ini (gabungkan count dan aggregate)
      (async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [totalSales, totalRevenue] = await Promise.all([
          prisma.sale.count({
            where: {
              date: {
                gte: today,
              }
            }
          }),
          prisma.sale.aggregate({
            where: {
              date: {
                gte: today,
              }
            },
            _sum: {
              total: true
            }
          })
        ]);

        return { totalSales, totalRevenue: totalRevenue._sum.total || 0 };
      })(),
      // Aktivitas terbaru
      prisma.auditLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          store: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      // Produk stok rendah
      prisma.product.findMany({
        where: {
          stock: { lte: 5 }
        },
        select: {
          id: true,
          name: true,
          stock: true,
          store: {
            select: {
              id: true,
              name: true
            }
          }
        },
        take: 5
      }),
      // Produk gudang
      prisma.warehouseProduct.findMany({
        take: 5,
        orderBy: { quantity: 'desc' },
        select: {
          id: true,
          quantity: true,
          Product: {
            select: {
              id: true,
              name: true
            }
          },
          warehouse: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })
    ]);

    // Fungsi untuk membuat deskripsi aktivitas yang lebih user-friendly
    const getFriendlyDescription = (activity) => {
      // Coba parse newValue untuk mendapatkan nama item jika tersedia
      let itemName = null;
      if (activity.newValue) {
        try {
          const parsedValue = JSON.parse(activity.newValue);
          // Ambil nama dari newValue berdasarkan entity
          if (activity.entity === 'STORE' && parsedValue.name) {
            itemName = parsedValue.name;
          } else if (activity.entity === 'USER' && parsedValue.name) {
            itemName = parsedValue.name;
          } else if (activity.entity === 'PRODUCT' && parsedValue.name) {
            itemName = parsedValue.name;
          }
        } catch (e) {
          // Jika parsing gagal, abaikan
        }
      }

      // Jika itemName tidak ditemukan di newValue, coba dari oldValue
      if (!itemName && activity.oldValue) {
        try {
          const parsedValue = JSON.parse(activity.oldValue);
          // Ambil nama dari oldValue berdasarkan entity
          if (activity.entity === 'STORE' && parsedValue.name) {
            itemName = parsedValue.name;
          } else if (activity.entity === 'USER' && parsedValue.name) {
            itemName = parsedValue.name;
          } else if (activity.entity === 'PRODUCT' && parsedValue.name) {
            itemName = parsedValue.name;
          }
        } catch (e) {
          // Jika parsing gagal, abaikan
        }
      }

      // Jika nama tetap tidak ditemukan, gunakan ID
      const displayName = itemName || (activity.entityId ? `ID ${activity.entityId}` : 'entitas');

      const actionLabels = {
        'CREATE': 'Dibuat',
        'UPDATE': 'Diperbarui',
        'DELETE': 'Dihapus',
        'DEACTIVATE': 'Dinonaktifkan',
        'TRANSFER': 'Ditransfer',
        'LOGIN': 'Login',
        'LOGOUT': 'Logout'
      };

      const entityLabels = {
        'STORE': 'Toko',
        'USER': 'Pengguna',
        'PRODUCT': 'Produk',
        'SALE': 'Penjualan',
        'EXPENSE': 'Pengeluaran'
      };

      // Deskripsi berdasarkan action dan entity
      const actionLabel = actionLabels[activity.action] || activity.action;
      const entityLabel = entityLabels[activity.entity] || activity.entity;

      // Buat deskripsi berdasarkan kombinasi action dan entity
      switch(activity.action) {
        case 'CREATE':
          switch(activity.entity) {
            case 'STORE':
              return `Toko "${displayName}" dibuat`;
            case 'USER':
              return `Pengguna "${displayName}" ditambahkan`;
            case 'PRODUCT':
              return `Produk "${displayName}" ditambahkan`;
            default:
              return `${actionLabel} ${entityLabel.toLowerCase()} ${displayName}`;
          }
        case 'UPDATE':
          switch(activity.entity) {
            case 'STORE':
              return `Data toko "${displayName}" diperbarui`;
            case 'USER':
              return `Data pengguna "${displayName}" diperbarui`;
            case 'PRODUCT':
              return `Data produk "${displayName}" diperbarui`;
            default:
              return `${actionLabel} ${entityLabel.toLowerCase()} ${displayName}`;
          }
        case 'DELETE':
          switch(activity.entity) {
            case 'USER':
              return `Pengguna "${displayName}" dinonaktifkan`;
            case 'PRODUCT':
              return `Produk "${displayName}" dihapus`;
            default:
              return `${actionLabel} ${entityLabel.toLowerCase()} ${displayName}`;
          }
        case 'DEACTIVATE':
          switch(activity.entity) {
            case 'STORE':
              return `Toko "${displayName}" dinonaktifkan`;
            default:
              return `${actionLabel} ${entityLabel.toLowerCase()} ${displayName}`;
          }
        case 'TRANSFER':
          switch(activity.entity) {
            case 'USER':
              return `Pengguna "${displayName}" dipindahkan ke toko lain`;
            default:
              return `${actionLabel} ${entityLabel.toLowerCase()} ${displayName}`;
          }
        default:
          return `${actionLabel} ${entityLabel.toLowerCase()} ${displayName}`;
      }
    };

    const summaryData = {
      stats: {
        totalStores,
        activeStores,
        totalSales: todaySalesData.totalSales,
        totalRevenue: todaySalesData.totalRevenue
      },
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        storeName: activity.store.name,
        description: getFriendlyDescription(activity),
        time: activity.createdAt.toLocaleString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        type: activity.entity // Gunakan entity untuk keperluan icon
      })),
      lowStockProducts: lowStockProducts.map(product => ({
        id: product.id,
        name: product.name,
        stock: product.stock,
        storeName: product.store.name
      })),
      warehouseProducts: warehouseProducts.map(wp => ({
        id: wp.id,
        name: wp.Product.name,
        quantity: wp.quantity,
        warehouseName: wp.warehouse.name
      }))
    };

    // Simpan ke cache selama 5 menit
    await setToCache(cacheKey, summaryData, 300);

    return new Response(JSON.stringify(summaryData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching manager dashboard data:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}