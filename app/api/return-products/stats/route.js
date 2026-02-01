import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    
    let whereClause = {};
    
    if (storeId) {
      whereClause.storeId = storeId;
    }
    
    // Hitung total retur
    const totalReturns = await prisma.returnProduct.count({
      where: whereClause
    });
    
    // Hitung retur berdasarkan status
    const returnsByStatus = await prisma.returnProduct.groupBy({
      by: ['status'],
      where: whereClause,
      _count: true
    });
    
    // Hitung retur berdasarkan kategori
    const returnsByCategory = await prisma.returnProduct.groupBy({
      by: ['category'],
      where: whereClause,
      _count: true
    });
    
    // Ambil 5 retur terbaru
    const latestReturns = await prisma.returnProduct.findMany({
      where: whereClause,
      include: {
        product: {
          select: {
            name: true
          }
        },
        attendant: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });
    
    // Hitung retur dalam 30 hari terakhir
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentReturns = await prisma.returnProduct.count({
      where: {
        ...whereClause,
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        totalReturns,
        returnsByStatus: returnsByStatus.reduce((acc, curr) => {
          acc[curr.status] = curr._count;
          return acc;
        }, {}),
        returnsByCategory: returnsByCategory.reduce((acc, curr) => {
          acc[curr.category] = curr._count;
          return acc;
        }, {}),
        latestReturns,
        recentReturns
      }
    });
  } catch (error) {
    console.error('Error fetching return product stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Terjadi kesalahan saat mengambil statistik retur produk',
        error: error.message 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}