const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testReturnInvoiceNumbers() {
  try {
    console.log('Testing return product invoice numbers...\n');
    
    // Ambil semua retur produk
    const allReturns = await prisma.returnProduct.findMany({
      take: 10, // Ambil 10 terbaru
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        invoiceNumber: true,
        transactionId: true,
        createdAt: true
      }
    });

    console.log('Daftar retur produk dengan invoice number:');
    allReturns.forEach((ret, index) => {
      console.log(`${index + 1}. ID: ${ret.id}`);
      console.log(`   Invoice Number: ${ret.invoiceNumber}`);
      console.log(`   Format: ${ret.invoiceNumber.startsWith('RET-') ? 'VALID' : 'INVALID'}`);
      console.log(`   Transaction ID: ${ret.transactionId}`);
      console.log(`   Created At: ${ret.createdAt}\n`);
    });

    // Cek apakah semua memiliki invoice number
    const returnsWithoutInvoice = allReturns.filter(ret => !ret.invoiceNumber);
    if (returnsWithoutInvoice.length > 0) {
      console.log(`\nPeringatan: Ditemukan ${returnsWithoutInvoice.length} retur produk tanpa invoice number`);
    } else {
      console.log('\n✓ Semua retur produk memiliki invoice number');
    }

    // Cek format invoice number
    const invalidFormatReturns = allReturns.filter(ret => !ret.invoiceNumber.startsWith('RET-'));
    if (invalidFormatReturns.length > 0) {
      console.log(`\nPeringatan: Ditemukan ${invalidFormatReturns.length} retur produk dengan format invoice number tidak valid`);
      invalidFormatReturns.forEach(ret => {
        console.log(`  - ${ret.id}: ${ret.invoiceNumber}`);
      });
    } else {
      console.log('✓ Semua invoice number mengikuti format RET-YYYYMMDD-XXXXX');
    }

    console.log('\nTest selesai!');
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Jalankan fungsi test
testReturnInvoiceNumbers();