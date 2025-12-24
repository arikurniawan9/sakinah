import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

// Fungsi untuk mengimpor data toko dari CSV
export async function importStoresFromCSV(csvData) {
  try {
    // Parse CSV data
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true
    });

    const importedStores = [];
    const errors = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      try {
        // Validasi data
        if (!record.name || !record.address) {
          errors.push({
            row: i + 1,
            error: 'Nama toko dan alamat wajib diisi'
          });
          continue;
        }

        // Buat atau update toko
        const store = await prisma.store.upsert({
          where: { 
            id: record.id || `temp-${i}` // Gunakan ID jika tersedia, jika tidak buat ID sementara
          },
          update: {
            name: record.name,
            code: record.code || null,
            description: record.description || '',
            address: record.address,
            phone: record.phone || '',
            email: record.email || '',
            status: record.status || 'ACTIVE'
          },
          create: {
            name: record.name,
            code: record.code || null,
            description: record.description || '',
            address: record.address,
            phone: record.phone || '',
            email: record.email || '',
            status: record.status || 'ACTIVE'
          }
        });

        importedStores.push(store);
      } catch (error) {
        errors.push({
          row: i + 1,
          error: error.message
        });
      }
    }

    return {
      success: true,
      importedCount: importedStores.length,
      errors,
      importedStores
    };
  } catch (error) {
    console.error('Error importing stores from CSV:', error);
    throw error;
  }
}

// Fungsi untuk mengimpor data pengguna dari CSV
export async function importUsersFromCSV(csvData) {
  try {
    // Parse CSV data
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true
    });

    const importedUsers = [];
    const errors = [];
    const bcrypt = await import('bcryptjs'); // Import bcrypt secara dinamis

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      try {
        // Validasi data
        if (!record.name || !record.username || !record.password) {
          errors.push({
            row: i + 1,
            error: 'Nama, username, dan password wajib diisi'
          });
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(record.password, 10);

        // Buat atau update pengguna
        const user = await prisma.user.upsert({
          where: { 
            id: record.id || `temp-${i}` // Gunakan ID jika tersedia, jika tidak buat ID sementara
          },
          update: {
            name: record.name,
            username: record.username,
            password: hashedPassword, // Gunakan password yang sudah di-hash
            role: record.role || 'CASHIER',
            employeeNumber: record.employeeNumber || null,
            status: record.status || 'AKTIF'
          },
          create: {
            name: record.name,
            username: record.username,
            password: hashedPassword, // Gunakan password yang sudah di-hash
            role: record.role || 'CASHIER',
            employeeNumber: record.employeeNumber || null,
            status: record.status || 'AKTIF'
          }
        });

        importedUsers.push(user);
      } catch (error) {
        errors.push({
          row: i + 1,
          error: error.message
        });
      }
    }

    return {
      success: true,
      importedCount: importedUsers.length,
      errors,
      importedUsers
    };
  } catch (error) {
    console.error('Error importing users from CSV:', error);
    throw error;
  }
}

// Fungsi untuk mengimpor data produk dari CSV
export async function importProductsFromCSV(csvData) {
  try {
    // Parse CSV data
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true
    });

    const importedProducts = [];
    const errors = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      try {
        // Validasi data
        if (!record.name || !record.storeId) {
          errors.push({
            row: i + 1,
            error: 'Nama produk dan ID toko wajib diisi'
          });
          continue;
        }

        // Buat atau update produk
        const product = await prisma.product.upsert({
          where: { 
            id: record.id || `temp-${i}` // Gunakan ID jika tersedia, jika tidak buat ID sementara
          },
          update: {
            name: record.name,
            category: record.category || 'Umum',
            unit: record.unit || 'pcs',
            stock: parseInt(record.stock) || 0,
            price: parseInt(record.price) || 0,
            storeId: record.storeId
          },
          create: {
            name: record.name,
            category: record.category || 'Umum',
            unit: record.unit || 'pcs',
            stock: parseInt(record.stock) || 0,
            price: parseInt(record.price) || 0,
            storeId: record.storeId
          }
        });

        importedProducts.push(product);
      } catch (error) {
        errors.push({
          row: i + 1,
          error: error.message
        });
      }
    }

    return {
      success: true,
      importedCount: importedProducts.length,
      errors,
      importedProducts
    };
  } catch (error) {
    console.error('Error importing products from CSV:', error);
    throw error;
  }
}

// Fungsi untuk mengimpor data umum (menentukan tipe data dari header)
export async function importDataFromCSV(csvData, dataType) {
  switch (dataType) {
    case 'stores':
      return await importStoresFromCSV(csvData);
    case 'users':
      return await importUsersFromCSV(csvData);
    case 'products':
      return await importProductsFromCSV(csvData);
    default:
      throw new Error(`Tipe data tidak didukung: ${dataType}`);
  }
}