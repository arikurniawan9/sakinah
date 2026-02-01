// Endpoint sederhana untuk menguji model ReturnProduct
// File: app/api/test-return-model/route.js

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    // Coba hitung jumlah data di tabel ReturnProduct
    const count = await prisma.returnProduct.count();
    
    // Coba ambil satu data jika ada
    let sampleData = null;
    if (count > 0) {
      sampleData = await prisma.returnProduct.findFirst();
    }
    
    return NextResponse.json({
      success: true,
      message: 'Model ReturnProduct ditemukan dan dapat diakses',
      data: {
        count,
        sampleData
      }
    });
  } catch (error) {
    console.error('Error accessing ReturnProduct model:', error);
    
    // Cek apakah error karena model tidak ditemukan
    if (error.message.includes('Unknown table') || error.message.includes('does not exist on model')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Model ReturnProduct tidak ditemukan. Pastikan model sudah ditambahkan ke schema.prisma dan migrasi sudah dijalankan.',
          error: error.message
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengakses model ReturnProduct',
        error: error.message
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}