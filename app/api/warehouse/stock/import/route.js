// app/api/warehouse/stock/import/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import globalPrisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';

export async function POST(request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

    // Get or create the central warehouse
    let centralWarehouse = await globalPrisma.warehouse.findFirst({
      where: { name: 'Gudang Pusat' }
    });

    if (!centralWarehouse) {
      // Create the central warehouse if it doesn't exist
      centralWarehouse = await globalPrisma.warehouse.create({
        data: {
          name: 'Gudang Pusat',
          description: 'Gudang pusat untuk distribusi ke toko-toko',
          status: 'ACTIVE'
        }
      });
    }

    // Group records by product to handle stock import
    const groupedRecords = {};
    for (const record of records) {
      const productCode = record['Kode Produk'] || record['productCode'] || record['kode_produk'] || record['Kode'] || record['code'];
      
      if (!productCode) {
        console.warn('Product code not found in record:', record);
        continue; // Skip this record if product code is missing
      }

      // Initialize the product if not already exists
      if (!groupedRecords[productCode]) {
        const currentDate = new Date();

        groupedRecords[productCode] = {
          productCode: productCode,
          name: record['Nama Produk'] || record['name'] || record['nama_produk'] || record['Nama'] || record['name'] || '',
          quantity: !isNaN(parseInt(record['Stok'] || record['quantity'] || record['Jumlah'] || record['jumlah']))
                   ? parseInt(record['Stok'] || record['quantity'] || record['Jumlah'] || record['jumlah'])
                   : 0,
          purchasePrice: !isNaN(parseInt(record['Harga Beli'] || record['purchasePrice'] || record['harga_beli'] || 0))
                        ? parseInt(record['Harga Beli'] || record['purchasePrice'] || record['harga_beli'] || 0)
                        : 0,
          sellingPrice: !isNaN(parseInt(record['Harga Jual'] || record['sellingPrice'] || record['harga_jual'] || 0))
                        ? parseInt(record['Harga Jual'] || record['sellingPrice'] || record['harga_jual'] || 0)
                        : 0,
          categoryName: record['Kategori'] || record['category'] || record['kategori'] || '',
          supplierName: record['Supplier'] || record['supplier'] || record['supplier'] || '',
          description: record['Deskripsi'] || record['description'] || record['deskripsi'] || '',
          createdAt: currentDate,
          updatedAt: currentDate
        };
      }
    }

    // Check for existing warehouse products before importing if not forced
    const force = formData.get('force') === 'true';
    if (!force) {
      const existingProducts = [];
      for (const [productCode, productData] of Object.entries(groupedRecords)) {
        const existingProduct = await globalPrisma.warehouseProduct.findFirst({
          where: {
            warehouseId: centralWarehouse.id,
            Product: {
              productCode: productCode,
              storeId: 's1'
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

      // If there are duplicate products, return the list of conflicting products
      if (existingProducts.length > 0) {
        return NextResponse.json({
          duplicateProducts: existingProducts,
          message: `Terdapat ${existingProducts.length} produk yang sudah ada. Silakan konfirmasi untuk menimpa produk yang sudah ada.`,
          needConfirmation: true
        }, { status: 200 }); // Use status 200 to handle confirmation in frontend
      }
    }

    let importedCount = 0;
    const errors = [];

    // Ensure the default store exists for warehouse operations
    let defaultStore = await globalPrisma.store.findFirst({
      where: { id: 's1' }
    });

    if (!defaultStore) {
      defaultStore = await globalPrisma.store.create({
        data: {
          id: 's1',
          name: 'Warehouse Default Store',
          description: 'Default store for warehouse operations',
          status: 'ACTIVE'
        }
      });
    }

    // Process each unique product
    for (const [productCode, productData] of Object.entries(groupedRecords)) {
      try {
        // Find or create the product in the system first (if needed)
        let product = await globalPrisma.product.findFirst({
          where: {
            productCode: productCode,
            storeId: 's1' // Use default store ID for warehouse
          }
        });

        // If product doesn't exist, create it
        if (!product) {
          // Find or create category
          let categoryId = null;
          if (productData.categoryName) {
            let category = await globalPrisma.category.findFirst({
              where: {
                name: productData.categoryName,
                storeId: 's1'
              }
            });

            if (!category) {
              category = await globalPrisma.category.create({
                data: {
                  name: productData.categoryName,
                  storeId: 's1'
                }
              });
            }
            categoryId = category.id;
          }

          // Find or create supplier
          let supplierId = null;
          if (productData.supplierName) {
            let supplier = await globalPrisma.supplier.findFirst({
              where: {
                name: productData.supplierName,
                storeId: 's1'
              }
            });

            if (!supplier) {
              // Generate a unique supplier code
              let supplierCode = productData.supplierName.substring(0, 5).toUpperCase();
              let counter = 1;
              let uniqueCode = supplierCode;

              // Check if this code already exists for this store, if so, append a number
              while(await globalPrisma.supplier.findFirst({
                where: { code: uniqueCode, storeId: 's1' }
              })) {
                uniqueCode = `${supplierCode}${counter}`;
                counter++;
              }

              supplier = await globalPrisma.supplier.create({
                data: {
                  name: productData.supplierName,
                  code: uniqueCode,
                  storeId: 's1'
                }
              });
            }
            supplierId = supplier.id;
          } else {
            // Create or find a default supplier for "No Supplier"
            let defaultSupplier = await globalPrisma.supplier.findFirst({
              where: {
                name: "Tidak Ada",
                storeId: 's1'
              }
            });

            if (!defaultSupplier) {
              defaultSupplier = await globalPrisma.supplier.create({
                data: {
                  name: "Tidak Ada",
                  code: "NO-SUP",
                  storeId: 's1'
                }
              });
            }
            supplierId = defaultSupplier.id;
          }

          // Create the product
          product = await globalPrisma.product.create({
            data: {
              name: productData.name,
              productCode: productCode,
              storeId: 's1',
              stock: productData.quantity,
              categoryId: categoryId,
              supplierId: supplierId,
              description: productData.description,
              purchasePrice: productData.purchasePrice
            }
          });

          // If selling price is provided, create a price tier for it
          if (productData.sellingPrice > 0) {
            await globalPrisma.priceTier.create({
              data: {
                productId: product.id,
                minQty: 1,
                price: productData.sellingPrice
              }
            });
          }
        }

        // Check if warehouse product already exists
        const existingWarehouseProduct = await globalPrisma.warehouseProduct.findFirst({
          where: {
            warehouseId: centralWarehouse.id,
            productId: product.id
          }
        });

        if (existingWarehouseProduct) {
          // Update existing warehouse product
          await globalPrisma.warehouseProduct.update({
            where: { id: existingWarehouseProduct.id },
            data: {
              quantity: productData.quantity,
              reserved: existingWarehouseProduct.reserved || 0,
              updatedAt: new Date()
            }
          });

          // Update product information including price if needed
          await globalPrisma.product.update({
            where: { id: product.id },
            data: {
              stock: productData.quantity,
              purchasePrice: productData.purchasePrice || product.purchasePrice,
              updatedAt: new Date()
            }
          });

          // If selling price is provided, update or create price tier
          if (productData.sellingPrice > 0) {
            // Delete existing price tiers for this product
            await globalPrisma.priceTier.deleteMany({
              where: { productId: product.id }
            });

            // Create new price tier
            await globalPrisma.priceTier.create({
              data: {
                productId: product.id,
                minQty: 1,
                price: productData.sellingPrice
              }
            });
          }
        } else {
          // Create new warehouse product
          await globalPrisma.warehouseProduct.create({
            data: {
              warehouseId: centralWarehouse.id, // Use direct ID instead of nested object
              productId: product.id,
              quantity: productData.quantity,
              reserved: 0,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
        }

        importedCount++;
      } catch (productError) {
        console.error(`Error importing warehouse stock with product code ${productCode}:`, productError);
        errors.push(`Gagal mengimpor stok produk dengan kode ${productCode}: ${productError.message}`);
      }
    }

    return NextResponse.json({
      message: `Berhasil mengimpor ${importedCount} stok produk`,
      importedCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error importing warehouse stocks:', error);
    return NextResponse.json({ error: `Gagal mengimpor stok produk: ${error.message}` }, { status: 500 });
  }
}