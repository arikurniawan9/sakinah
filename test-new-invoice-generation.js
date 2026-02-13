const { PrismaClient } = require('@prisma/client');
const { generateReturnInvoiceNumber } = require('./utils/invoiceNumber');

const prisma = new PrismaClient();

async function testNewInvoiceGeneration() {
  try {
    console.log('Testing new invoice number generation...\n');
    
    // Ambil store ID dari salah satu retur produk yang sudah ada
    const sampleReturn = await prisma.returnProduct.findFirst();
    if (!sampleReturn) {
      console.log('Tidak ada retur produk untuk dijadikan contoh');
      return;
    }
    
    console.log(`Menggunakan storeId: ${sampleReturn.storeId}`);
    
    // Generate beberapa invoice number baru untuk melihat apakah unik
    for (let i = 0; i < 3; i++) {
      const newInvoiceNumber = await generateReturnInvoiceNumber(sampleReturn.storeId);
      console.log(`Generated invoice number ${i + 1}: ${newInvoiceNumber}`);
    }
    
    console.log('\nTest selesai!');
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Jalankan fungsi test
testNewInvoiceGeneration();