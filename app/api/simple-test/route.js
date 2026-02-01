// Endpoint sangat sederhana untuk menguji model ReturnProduct
// File: app/api/simple-test/route.js

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    // Coba akses model ReturnProduct secara langsung
    const count = await prisma.returnProduct.count({});
    
    return NextResponse.json({
      success: true,
      message: 'Berhasil mengakses model ReturnProduct',
      count: count
    });
  } catch (error) {
    console.error('Simple test error:', error);
    return NextResponse.json({
      success: false,
      message: 'Gagal mengakses model ReturnProduct',
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}