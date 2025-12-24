// app/api/produk/import/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
    }

    // Convert blob to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    let records = [];
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (fileExtension === 'csv') {
      // Parse CSV file
      const csvString = new TextDecoder().decode(buffer);
      records = parse(csvString, { columns: true, skip_empty_lines: true });
    } else if (['xlsx', 'xls'].includes(fileExtension)) {
      // Parse Excel file
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      records = XLSX.utils.sheet_to_json(sheet);
    } else {
      return NextResponse.json({ error: 'Format file tidak didukung. Gunakan CSV, XLSX, atau XLS' }, { status: 400 });
    }

    if (!records || records.length === 0) {
      return NextResponse.json({ error: 'File kosong atau tidak valid' }, { status: 400 });
    }

    // Group records by product to handle multiple price tiers per product
    const groupedRecords = {};
    for (const record of records) {
      // Handle different possible column names for product code
      const productKey = record['Kode'] || record['productCode'] || record['kode'] || record['product_code'];

      if (!productKey) {
        console.warn('Product code not found in record:', record);
        continue; // Skip this record if product code is missing
      }

      // Initialize the product if not already exists
      if (!groupedRecords[productKey]) {
        // Always use current date for createdAt and updatedAt during import
        const currentDate = new Date();

        groupedRecords[productKey] = {
          name: record['Nama'] || record['name'] || record['nama'] || '',
          productCode: productKey,
          stock: !isNaN(parseInt(record['Stok'] || record['stock'])) ? parseInt(record['Stok'] || record['stock']) : 0, // Default to 0 if not specified
          category: record['Kategori'] || record['category'] || record['kategori'] || '',
          supplier: record['Supplier'] || record['supplier'] || record['supplier'] || '', // Could be empty as per requirement
          description: record['Deskripsi'] || record['description'] || record['deskripsi'] || '',
          createdAt: currentDate,
          updatedAt: currentDate,
          purchaseData: currentDate, // Store original creation date
          purchasePrice: !isNaN(parseInt(record['Harga Beli'] || record['purchase_price'] || record['purchasePrice'])) ? parseInt(record['Harga Beli'] || record['purchase_price'] || record['purchasePrice']) : 0,
          retailPrice: !isNaN(parseInt(record['Harga Eceran'] || record['retailPrice'] || record['hargaEceran'])) ? parseInt(record['Harga Eceran'] || record['retailPrice'] || record['hargaEceran']) : 0,
          silverPrice: !isNaN(parseInt(record['Harga Silver'] || record['silverPrice'] || record['hargaSilver'])) ? parseInt(record['Harga Silver'] || record['silverPrice'] || record['hargaSilver']) : 0,
          goldPrice: !isNaN(parseInt(record['Harga Gold'] || record['goldPrice'] || record['hargaGold'])) ? parseInt(record['Harga Gold'] || record['goldPrice'] || record['hargaGold']) : 0,
          platinumPrice: !isNaN(parseInt(record['Harga Platinum'] || record['platinumPrice'] || record['hargaPlatinum'])) ? parseInt(record['Harga Platinum'] || record['platinumPrice'] || record['hargaPlatinum']) : 0,
        };
      }
    }

    // Check for existing products before importing if not forced
    const force = formData.get('force') === 'true';
    if (!force) {
      const existingProducts = [];
      for (const [productCode, productData] of Object.entries(groupedRecords)) {
        const existingProduct = await prisma.product.findUnique({
          where: {
            productCode_storeId: {
              productCode: productCode,
              storeId: session.user.storeId
            }
          }
        });

        if (existingProduct) {
          existingProducts.push({
            productCode: productCode,
            name: productData.name,
            existingProduct: existingProduct
          });
        }
      }

      // Jika ada produk yang sudah ada, kembalikan daftar produk yang konflik
      if (existingProducts.length > 0) {
        return NextResponse.json({
          duplicateProducts: existingProducts,
          message: `Terdapat ${existingProducts.length} produk yang sudah ada. Silakan konfirmasi untuk menimpa produk yang sudah ada.`,
          needConfirmation: true
        }, { status: 200 }); // Gunakan status 200 agar bisa menangani di frontend
      }
    }

    let importedCount = 0;
    const errors = [];

    // Process each unique product
    for (const [productCode, productData] of Object.entries(groupedRecords)) {
      try {

        // Find or create category
        let categoryId = null;
        if (productData.category) {
          let category = await prisma.category.findFirst({
            where: {
              name: productData.category,
              storeId: session.user.storeId
            }
          });

          if (!category) {
            // Create category if doesn't exist
            category = await prisma.category.create({
              data: {
                name: productData.category,
                store: { connect: { id: session.user.storeId } }
              }
            });
          }
          categoryId = category.id;
        }

        // Find or create supplier - create default if not provided
        let supplierId = null;
        if (productData.supplier) {
          let supplier = await prisma.supplier.findFirst({
            where: {
              name: productData.supplier,
              storeId: session.user.storeId
            }
          });

          if (!supplier) {
            // Create supplier if doesn't exist
            supplier = await prisma.supplier.create({
              data: {
                name: productData.supplier,
                store: { connect: { id: session.user.storeId } },
                code: productData.supplier.substring(0, 5).toUpperCase() // Generate default code
              }
            });
          }
          supplierId = supplier.id;
        } else {
          // Create or find a default supplier for "No Supplier"
          let defaultSupplier = await prisma.supplier.findFirst({
            where: {
              name: "Tidak Ada",
              storeId: session.user.storeId
            }
          });

          if (!defaultSupplier) {
            // Generate a unique code for the default supplier
            const baseCode = "NO-SUP";
            let uniqueCode = baseCode;
            let counter = 1;

            // Check if base code exists, increment if needed
            while(await prisma.supplier.findFirst({
              where: {
                code: uniqueCode,
                storeId: session.user.storeId
              }
            })) {
              uniqueCode = `${baseCode}-${counter}`;
              counter++;
            }

            defaultSupplier = await prisma.supplier.create({
              data: {
                name: "Tidak Ada",
                code: uniqueCode,
                store: { connect: { id: session.user.storeId } }
              }
            });
          }
          supplierId = defaultSupplier.id;
        }

        // Check if product already exists in the store
        const existingProduct = await prisma.product.findUnique({
          where: {
            productCode_storeId: {
              productCode: productCode,
              storeId: session.user.storeId
            }
          }
        });

        if (existingProduct) {
          // Update existing product
          const updatedProduct = await prisma.$transaction(async (tx) => {
            await tx.product.update({
              where: {
                id: existingProduct.id,
                storeId: session.user.storeId // Tambahkan storeId ke kondisi update
              },
              data: {
                name: productData.name,
                stock: productData.stock,
                category: { connect: { id: categoryId } },
                supplier: { connect: { id: supplierId } },
                description: productData.description,
                purchasePrice: productData.purchasePrice,
                retailPrice: productData.retailPrice || 0,
                silverPrice: productData.silverPrice || 0,
                goldPrice: productData.goldPrice || 0,
                platinumPrice: productData.platinumPrice || 0,
                updatedAt: new Date()
              }
            });

            return product;
          });
        } else {
          // Create new product
          const createdProduct = await prisma.$transaction(async (tx) => {
            const product = await tx.product.create({
              data: {
                name: productData.name,
                productCode: productCode,
                store: { connect: { id: session.user.storeId } },
                stock: productData.stock,
                category: { connect: { id: categoryId } },
                supplier: { connect: { id: supplierId } },
                description: productData.description,
                purchasePrice: productData.purchasePrice,
                retailPrice: productData.retailPrice || 0,
                silverPrice: productData.silverPrice || 0,
                goldPrice: productData.goldPrice || 0,
                platinumPrice: productData.platinumPrice || 0,
                createdAt: new Date(productData.createdAt),
                updatedAt: new Date(productData.updatedAt),
              }
            });

            return product;
          });
        }

        importedCount++;
      } catch (productError) {
        console.error(`Error importing product with code ${productCode}:`, productError);
        errors.push(`Gagal mengimpor produk dengan kode ${productCode}: ${productError.message}`);
      }
    }

    return NextResponse.json({
      message: `Berhasil mengimpor ${importedCount} produk`,
      importedCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error importing products:', error);
    return NextResponse.json({ error: `Gagal mengimpor produk: ${error.message}` }, { status: 500 });
  }
}