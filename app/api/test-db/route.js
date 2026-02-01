// Test API endpoint untuk menguji koneksi database
// File: app/api/test-db/route.js

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    // Lakukan ping sederhana ke database
    await prisma.$connect();
    
    // Coba ambil jumlah total retur produk
    const totalReturns = await prisma.returnProduct.count();
    
    // Coba ambil satu data retur produk jika ada
    let sampleReturn = null;
    if (totalReturns > 0) {
      sampleReturn = await prisma.returnProduct.findFirst({
        include: {
          store: true,
          product: true,
          attendant: true
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Koneksi database berhasil',
      data: {
        totalReturns,
        sampleReturn: sampleReturn ? {
          id: sampleReturn.id,
          status: sampleReturn.status,
          reason: sampleReturn.reason,
          createdAt: sampleReturn.createdAt
        } : null
      }
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal terhubung ke database',
        error: error.message
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}