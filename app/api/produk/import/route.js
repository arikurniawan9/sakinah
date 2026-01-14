// app/api/produk/import/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

// Helper function to find or create a category
async function findOrCreateCategory(categoryName, storeId) {
  if (!categoryName) return null;

  let category = await prisma.category.findFirst({
    where: {
      name: categoryName,
      storeId: storeId
    }
  });

  if (!category) {
    category = await prisma.category.create({
      data: {
        name: categoryName,
        store: { connect: { id: storeId } }
      }
    });
  }
  return category.id;
}

// Helper function to find or create a supplier
async function findOrCreateSupplier(supplierName, storeId) {
  if (!supplierName) {
    // Create or find a default supplier for "Tidak Ada"
    let defaultSupplier = await prisma.supplier.findFirst({
      where: {
        name: "Tidak Ada",
        storeId: storeId
      }
    });

    if (!defaultSupplier) {
      const baseCode = "NO-SUP";
      let uniqueCode = baseCode;
      let counter = 1;
      while(await prisma.supplier.findFirst({
        where: {
          code: uniqueCode,
          storeId: storeId
        }
      })) {
        uniqueCode = `${baseCode}-${counter}`;
        counter++;
      }
      defaultSupplier = await prisma.supplier.create({
        data: {
          name: "Tidak Ada",
          code: uniqueCode,
          store: { connect: { id: storeId } }
        }
      });
    }
    return defaultSupplier.id;
  }

  let supplier = await prisma.supplier.findFirst({
    where: {
      name: supplierName,
      storeId: storeId
    }
  });

  if (!supplier) {
    let baseCode = supplierName.substring(0, 5).toUpperCase();
    let uniqueCode = baseCode;
    let counter = 1;

    while(await prisma.supplier.findFirst({
      where: {
        code: uniqueCode,
        storeId: storeId
      }
    })) {
      uniqueCode = `${baseCode}-${counter}`;
      counter++;
    }

    supplier = await prisma.supplier.create({
      data: {
        name: supplierName,
        store: { connect: { id: storeId } },
        code: uniqueCode
      }
    });
  }
  return supplier.id;
}


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
          purchasePrice: (() => {
            const value = record['Harga Beli'] || record['purchase_price'] || record['purchasePrice'] || record['harga_beli'];
            return !isNaN(parseInt(value)) ? parseInt(value) : 0;
          })(),
          retailPrice: (() => {
            const value = record['Harga Jual/Eceran'] || record['Harga Eceran'] || record['retailPrice'] || record['hargaEceran'] || record['harga_jual'];
            return !isNaN(parseInt(value)) ? parseInt(value) : 0;
          })(),
          silverPrice: (() => {
            const value = record['Harga Member Silver'] || record['Harga Silver'] || record['silverPrice'] || record['hargaSilver'] || record['harga_silver'];
            return !isNaN(parseInt(value)) ? parseInt(value) : 0;
          })(),
          goldPrice: (() => {
            const value = record['Harga Member Gold'] || record['Harga Gold'] || record['goldPrice'] || record['hargaGold'] || record['harga_gold'];
            return !isNaN(parseInt(value)) ? parseInt(value) : 0;
          })(),
          platinumPrice: (() => {
            const value = record['Harga Member Platinum (Partai)'] || record['Harga Platinum'] || record['platinumPrice'] || record['hargaPlatinum'] || record['harga_platinum'];
            return !isNaN(parseInt(value)) ? parseInt(value) : 0;
          })(),
        };
      }
    }

    const updateMode = formData.get('updateMode'); // 'overwrite' or 'add_stock'

    // If no updateMode is specified, this is a preliminary check.
    if (!updateMode) {
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

      if (existingProducts.length > 0) {
        return NextResponse.json({
          duplicateProducts: existingProducts,
          message: `Terdapat ${existingProducts.length} produk yang sudah ada. Silakan konfirmasi untuk melanjutkan.`,
          needConfirmation: true
        }, { status: 200 });
      }
    }

    let importedCount = 0;
    const errors = [];

    // Process each unique product
    for (const [productCode, productData] of Object.entries(groupedRecords)) {
      try {
        const existingProduct = await prisma.product.findUnique({
          where: {
            productCode_storeId: {
              productCode: productCode,
              storeId: session.user.storeId
            }
          }
        });

        if (existingProduct) {
          if (updateMode === 'add_stock') {
            await prisma.product.update({
              where: { id: existingProduct.id },
              data: {
                stock: {
                  increment: productData.stock || 0
                },
                updatedAt: new Date()
              }
            });
          } else if (updateMode === 'overwrite') {
            const categoryId = await findOrCreateCategory(productData.category, session.user.storeId);
            const supplierId = await findOrCreateSupplier(productData.supplier, session.user.storeId);

            await prisma.product.update({
              where: { id: existingProduct.id },
              data: {
                name: productData.name,
                stock: productData.stock,
                category: { connect: { id: categoryId } },
                supplier: { connect: { id: supplierId } },
                description: productData.description,
                purchasePrice: productData.purchasePrice,
                retailPrice: productData.retailPrice,
                silverPrice: productData.silverPrice,
                goldPrice: productData.goldPrice,
                platinumPrice: productData.platinumPrice,
                updatedAt: new Date()
              }
            });
          }
        } else {
          // Create new product if it doesn't exist, regardless of updateMode
          const categoryId = await findOrCreateCategory(productData.category, session.user.storeId);
          const supplierId = await findOrCreateSupplier(productData.supplier, session.user.storeId);

          await prisma.product.create({
            data: {
              name: productData.name,
              productCode: productCode,
              store: { connect: { id: session.user.storeId } },
              stock: productData.stock,
              category: { connect: { id: categoryId } },
              supplier: { connect: { id: supplierId } },
              description: productData.description,
              purchasePrice: productData.purchasePrice,
              retailPrice: productData.retailPrice,
              silverPrice: productData.silverPrice,
              goldPrice: productData.goldPrice,
              platinumPrice: productData.platinumPrice,
              createdAt: new Date(productData.createdAt),
              updatedAt: new Date(productData.updatedAt),
            }
          });
        }

        importedCount++;
      } catch (productError) {
        console.error(`Error importing product with code ${productCode}:`, productError);
        errors.push({ row: productCode, error: `Gagal memproses: ${productError.message}` });
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