// Endpoint sangat sederhana untuk menguji model ReturnProduct
// File: app/api/basic-return-test/route.js

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    console.log('Mulai mengakses model ReturnProduct...');
    
    // Coba hitung jumlah data
    const count = await prisma.returnProduct.count();
    console.log(`Jumlah data ReturnProduct: ${count}`);
    
    // Jika ada data, ambil satu contoh
    let sampleRecord = null;
    if (count > 0) {
      sampleRecord = await prisma.returnProduct.findFirst();
      console.log('Contoh data:', JSON.stringify(sampleRecord, null, 2));
    }
    
    // Coba buat data dummy untuk menguji struktur
    const testStructure = {
      id: 'test_id',
      storeId: 'test_store_id',
      transactionId: 'test_transaction_id',
      productId: 'test_product_id',
      attendantId: 'test_attendant_id',
      reason: 'test_reason',
      category: 'OTHERS',
      returnDate: new Date(),
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return NextResponse.json({
      success: true,
      message: 'Model ReturnProduct dapat diakses',
      data: {
        count,
        sampleRecord: sampleRecord ? {
          id: sampleRecord.id,
          status: sampleRecord.status,
          reason: sampleRecord.reason,
          createdAt: sampleRecord.createdAt
        } : null,
        testStructure: Object.keys(testStructure)
      }
    });
  } catch (error) {
    console.error('Error dalam basic test:', error);
    
    // Cek jenis error
    if (error.message.includes('Unknown') || error.message.includes('does not exist')) {
      return NextResponse.json({
        success: false,
        message: 'Model ReturnProduct tidak ditemukan di schema Prisma',
        error: error.message,
        suggestion: 'Pastikan model ReturnProduct sudah ditambahkan ke schema.prisma dan migrasi sudah dijalankan'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: false,
      message: 'Terjadi error saat mengakses model ReturnProduct',
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}