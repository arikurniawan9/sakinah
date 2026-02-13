const { PrismaClient } = require('@prisma/client');
const { generateReturnInvoiceNumber } = require('./utils/invoiceNumber');

const prisma = new PrismaClient();

async function simulateNewReturns() {
  try {
    console.log('Simulating new return product creation...\n');
    
    // Ambil store ID dari salah satu retur produk yang sudah ada
    const sampleReturn = await prisma.returnProduct.findFirst();
    if (!sampleReturn) {
      console.log('Tidak ada retur produk untuk dijadikan contoh');
      return;
    }
    
    console.log(`Menggunakan storeId: ${sampleReturn.storeId}`);
    
    // Simulasikan pembuatan beberapa retur produk baru
    for (let i = 0; i < 3; i++) {
      // Generate invoice number
      const newInvoiceNumber = await generateReturnInvoiceNumber(sampleReturn.storeId);
      
      // Simulasikan pembuatan retur produk baru (tanpa benar-benar menyimpan ke database untuk tes ini)
      console.log(`New return ${i + 1} would have invoice number: ${newInvoiceNumber}`);
    }
    
    console.log('\nSimulasi selesai!');
    
    // Sekarang mari kita lihat data yang sudah ada
    console.log('\nData retur produk yang sudah ada:');
    const existingReturns = await prisma.returnProduct.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, invoiceNumber: true, createdAt: true }
    });
    
    existingReturns.forEach((ret, idx) => {
      console.log(`${idx + 1}. ID: ${ret.id.substring(0, 10)}..., Invoice: ${ret.invoiceNumber}, Created: ${ret.createdAt.toLocaleDateString()}`);
    });
  } catch (error) {
    console.error('Error during simulation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Jalankan fungsi simulasi
simulateNewReturns();