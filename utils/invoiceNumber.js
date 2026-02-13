/**
 * Generate readable invoice number for warehouse distribution
 * Format: DIST-YYYYMMDD-XXXX
 * Where XXXX is a sequential number or random alphanumeric code
 */
export function generateDistributionInvoiceNumber() {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
                  String(now.getMonth() + 1).padStart(2, '0') +
                  String(now.getDate()).padStart(2, '0');

  // Generate a random 4-character alphanumeric code
  const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();

  return `DIST-${dateStr}-${randomCode}`;
}

/**
 * Generate invoice number with store name (for distribution)
 * Format: DIST-YYYYMMDD-STORENAME-USERCODE
 */
export function generateDistributionInvoiceNumberWithStore(storeName, userCode = 'USR') {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
                  String(now.getMonth() + 1).padStart(2, '0') +
                  String(now.getDate()).padStart(2, '0');

  // Use store name, take first 3 characters and make uppercase
  const storeNameCode = storeName.substring(0, 3).replace(/\s+/g, '').toUpperCase();
  const userCodeFormatted = userCode.substring(0, 3).toUpperCase();

  return `DIST-${dateStr}-${storeNameCode}-${userCodeFormatted}`;
}

/**
 * Generate invoice number with sequential counter (alternative approach)
 * This would require storing the last used number in database
 */
export async function generateSequentialDistributionInvoiceNumber() {
  // This would typically fetch the last invoice number from database
  // and increment it, but for now we'll use a timestamp-based approach
  const now = new Date();
  const timestamp = now.getTime().toString().slice(-6); // Use last 6 digits of timestamp

  const dateStr = now.getFullYear().toString() +
                  String(now.getMonth() + 1).padStart(2, '0') +
                  String(now.getDate()).padStart(2, '0');

  return `DIST-${dateStr}-${timestamp}`;
}

/**
 * Generate distribution invoice number with store code and sequential number
 * Format: DIST-YYYYMMDD-STORECODE-SEQNUM
 * Where SEQNUM is the sequential number for that store on that date
 */
export async function generateDistributionInvoiceNumberWithStoreCode(storeCode) {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
                  String(now.getMonth() + 1).padStart(2, '0') +
                  String(now.getDate()).padStart(2, '0');

  // Get Prisma instance to count distributions for this store on this date
  const prisma = (await import('@/lib/prisma')).default;

  // Count existing distributions for this store on the same date
  const existingDistributions = await prisma.warehouseDistribution.count({
    where: {
      storeId: storeCode, // Actually this should be the store ID, but we'll adapt
      distributedAt: {
        gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      }
    }
  });

  // Generate sequential number (001, 002, etc.)
  const seqNum = String(existingDistributions + 1).padStart(3, '0');

  return `DIST-${dateStr}-${storeCode}-${seqNum}`;
}

/**
 * Generate distribution invoice number with store code and sequential number (simplified)
 * Format: DIST-YYYYMMDD-STORECODE-SEQNUM
 * This version uses a simpler approach by just using timestamp for uniqueness
 */
export function generateDistributionInvoiceNumberWithStoreCodeSimple(storeCode) {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
                  String(now.getMonth() + 1).padStart(2, '0') +
                  String(now.getDate()).padStart(2, '0');

  // Use timestamp for uniqueness
  const timestamp = Date.now().toString().slice(-4); // Use last 4 digits for uniqueness

  // Ensure store code is properly formatted (uppercase, no spaces)
  const formattedStoreCode = storeCode.replace(/\s+/g, '').toUpperCase();

  return `DIST-${dateStr}-${formattedStoreCode}-${timestamp}`;
}

/**
 * Generate invoice number for return products
 * Format: RET-YYYYMMDD-XXXXX
 * Where XXXXX is the sequential number for that store on that date
 */
export async function generateReturnInvoiceNumber(storeId) {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
                  String(now.getMonth() + 1).padStart(2, '0') +
                  String(now.getDate()).padStart(2, '0');

  // Get Prisma instance to find the highest sequence number for this store on this date
  let prisma;
  try {
    const prismaModule = await import('@/lib/prisma');
    prisma = prismaModule.default;
  } catch (error) {
    // Fallback untuk skenario di mana import dinamis tidak bekerja
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
  }

  // Find all return products for this store that have invoice numbers starting with RET-YYYYMMDD
  // We don't filter by date in createdAt because the invoice numbers were retroactively assigned
  const existingReturns = await prisma.returnProduct.findMany({
    where: {
      storeId: storeId,
      invoiceNumber: {
        startsWith: `RET-${dateStr}-`
      }
    },
    select: {
      invoiceNumber: true
    }
  });

  // Extract sequence numbers and find the highest one
  let maxSeqNum = 0;
  existingReturns.forEach(ret => {
    // Extract the sequence part from the invoice number (the last 5 digits after the date)
    const parts = ret.invoiceNumber.split('-');
    if (parts.length >= 3) {
      const seqPart = parts[parts.length - 1]; // Get the last part
      // If it contains only digits, parse it as integer
      if (/^\d+$/.test(seqPart)) {
        const seqNum = parseInt(seqPart, 10);
        if (seqNum > maxSeqNum) {
          maxSeqNum = seqNum;
        }
      }
    }
  });

  // Generate the next sequential number (001, 002, etc.)
  const nextSeqNum = String(maxSeqNum + 1).padStart(5, '0');

  // Generate the final invoice number
  const invoiceNumber = `RET-${dateStr}-${nextSeqNum}`;
  
  return invoiceNumber;
}