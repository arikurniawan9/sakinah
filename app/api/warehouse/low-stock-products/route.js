// app/api/warehouse/low-stock-products/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

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
    const storeId = url.searchParams.get('storeId') || '';
    const category = url.searchParams.get('category') || '';
    const lowStock = url.searchParams.get('lowStock') === 'true';

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
        { code: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (category) {
      whereClause.categoryId = category;
    }

    // Tambahkan filter untuk produk stok rendah jika lowStock=true
    if (lowStock) {
      // Kita akan filter setelah query karena tidak bisa membandingkan field dengan field lain di where clause
    }

    // Ambil produk dengan stok rendah
    const allProducts = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
      },
      orderBy: { stock: 'asc' }, // Urutkan berdasarkan stok terendah
    });

    // Filter produk dengan stok <= minStock jika lowStock=true
    let filteredProducts = allProducts;
    if (lowStock) {
      filteredProducts = allProducts.filter(product => product.stock <= product.minStock);
    }

    // Tambahkan field currentStock dan minStock ke produk untuk kebutuhan frontend
    const productsWithStockInfo = filteredProducts.map(product => ({
      ...product,
      currentStock: product.stock,
      minStock: product.minStock
    }));

    // Terapkan pagination setelah filter
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = productsWithStockInfo.slice(startIndex, endIndex);

    return new Response(JSON.stringify({
      products: paginatedProducts,
      total: productsWithStockInfo.length,
      pagination: {
        page,
        limit,
        total: productsWithStockInfo.length,
        totalPages: Math.ceil(productsWithStockInfo.length / limit)
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}