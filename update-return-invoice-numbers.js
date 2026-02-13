const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Fungsi untuk generate invoice number untuk return produk
async function generateReturnInvoiceNumber(storeId) {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
                  String(now.getMonth() + 1).padStart(2, '0') +
                  String(now.getDate()).padStart(2, '0');

  // Count existing returns for this store on the same date
  const existingReturns = await prisma.returnProduct.count({
    where: {
      storeId: storeId,
      createdAt: {
        gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      }
    }
  });

  // Generate sequential number (001, 002, etc.)
  const seqNum = String(existingReturns + 1).padStart(5, '0');

  return `RET-${dateStr}-${seqNum}`;
}

async function updateExistingReturnProducts() {
  try {
    // Ambil semua retur produk yang belum memiliki invoiceNumber
    const returnsWithoutInvoice = await prisma.returnProduct.findMany({
      where: {
        invoiceNumber: null
      }
    });

    console.log(`Menemukan ${returnsWithoutInvoice.length} retur produk tanpa invoice number`);

    for (const ret of returnsWithoutInvoice) {
      // Generate invoice number berdasarkan storeId
      const invoiceNumber = await generateReturnInvoiceNumber(ret.storeId);
      
      // Update retur produk dengan invoice number
      await prisma.returnProduct.update({
        where: { id: ret.id },
        data: { invoiceNumber }
      });
      
      console.log(`Updated return ${ret.id} with invoice number: ${invoiceNumber}`);
    }

    console.log('Update selesai!');
  } catch (error) {
    console.error('Error updating return products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Jalankan fungsi
updateExistingReturnProducts();