// app/api/warehouse/supplier/import/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import globalPrisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { data, force = false } = body; // Ambil data dan parameter force

    // Validasi bahwa data adalah array
    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'Data tidak valid atau kosong' }, { status: 400 });
    }

    // Get or create the central warehouse store (s1) for warehouse suppliers
    let warehouseStore = await globalPrisma.store.findFirst({
      where: { id: 's1' }
    });

    if (!warehouseStore) {
      // Create the warehouse store if it doesn't exist
      warehouseStore = await globalPrisma.store.create({
        data: {
          id: 's1',
          code: 'WH001',
          name: 'Gudang Pusat',
          description: 'Store untuk gudang pusat',
          status: 'ACTIVE'
        }
      });
    }

    const warehouseStoreId = warehouseStore.id;

    // Validasi setiap item
    const validatedData = [];
    const validationErrors = [];

    for (let i = 0; i < data.length; i++) {
      const item = data[i];

      // Validasi bahwa item adalah object
      if (!item || typeof item !== 'object') {
        validationErrors.push({
          index: i,
          name: `Item ${i + 1}`,
          errors: 'Data item bukan object yang valid'
        });
        continue;
      }

      const errors = [];

      // Validasi wajib
      if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
        errors.push('Nama supplier wajib diisi');
      }
      if (!item.code || typeof item.code !== 'string' || item.code.trim() === '') {
        errors.push('Kode supplier wajib diisi');
      }

      // Validasi format email jika diisi
      if (item.email && typeof item.email === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(item.email.trim())) {
          errors.push('Format email tidak valid');
        }
      }

      if (errors.length > 0) {
        validationErrors.push({
          index: i,
          name: item.name || `Item ${i + 1}`,
          errors: errors.join(', ')
        });
      } else {
        validatedData.push({
          code: item.code.trim(),
          name: item.name.trim(),
          contactPerson: item.contactPerson ? item.contactPerson.trim() : null,
          phone: item.phone ? item.phone.trim() : null,
          email: item.email ? item.email.trim() : null,
          address: item.address ? item.address.trim() : null,
          storeId: warehouseStoreId // Gunakan storeId dari warehouse
        });
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({
        error: 'Beberapa data tidak valid',
        results: validationErrors.map(err => ({
          name: err.name,
          status: 'failed',
          error: err.errors
        })),
        totalProcessed: data.length,
        created: 0,
        updated: 0,
        failed: validationErrors.length
      }, { status: 400 });
    }

    // Cek duplikat sebelum import
    const codesToCheck = validatedData.map(item => item.code);
    const existingSuppliers = await globalPrisma.supplier.findMany({
      where: {
        code: { in: codesToCheck },
        storeId: warehouseStoreId
      }
    });

    if (existingSuppliers.length > 0 && !force) {
      // Kembalikan informasi tentang duplikat yang ditemukan
      return NextResponse.json({
        needConfirmation: true,
        message: `Ditemukan ${existingSuppliers.length} supplier yang sudah ada`,
        duplicateSuppliers: existingSuppliers.map(supplier => ({
          code: supplier.code,
          name: supplier.name,
          currentData: {
            name: supplier.name,
            contactPerson: supplier.contactPerson,
            phone: supplier.phone,
            email: supplier.email,
            address: supplier.address
          }
        })),
        validatedData: validatedData,
        totalProcessed: validatedData.length
      }, { status: 200 });
    }

    // Jika ada duplikat dan force=true, atau tidak ada duplikat, lanjutkan import
    let createdCount = 0;
    let updatedCount = 0;
    const importResults = [];

    for (const supplierData of validatedData) {
      try {
        // Cek apakah supplier sudah ada berdasarkan kode dan storeId (karena kode harus unik per toko)
        const existingSupplier = await globalPrisma.supplier.findFirst({
          where: {
            code: supplierData.code,
            storeId: supplierData.storeId
          }
        });

        if (existingSupplier && force) {
          // Update supplier yang sudah ada (hanya field yang tidak kosong)
          const updatedSupplier = await globalPrisma.supplier.update({
            where: { id: existingSupplier.id },
            data: {
              name: supplierData.name,
              contactPerson: supplierData.contactPerson,
              phone: supplierData.phone,
              email: supplierData.email,
              address: supplierData.address,
              updatedAt: new Date()
            }
          });
          updatedCount++;
          importResults.push({
            name: updatedSupplier.name,
            status: 'updated'
          });
        } else if (!existingSupplier) {
          // Buat supplier baru
          const newSupplier = await globalPrisma.supplier.create({
            data: supplierData
          });
          createdCount++;
          importResults.push({
            name: newSupplier.name,
            status: 'created'
          });
        } else {
          // Lewati jika sudah ada dan force=false
          importResults.push({
            name: supplierData.name,
            status: 'skipped'
          });
        }
      } catch (error) {
        // Tangani error seperti constraint unik atau field yang tidak valid
        let errorMessage = error.message || 'Gagal menyimpan data';

        // Tambahkan penanganan khusus untuk error Prisma
        if (error.code === 'P2002') {
          // Error constraint unik (misalnya kode atau kombinasi kode-storeId sudah ada)
          errorMessage = `Kode supplier '${supplierData.code}' sudah digunakan dalam toko ini`;
        }

        importResults.push({
          name: supplierData.name,
          status: 'failed',
          error: errorMessage
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil mengimpor ${createdCount + updatedCount} supplier, ${importResults.filter(r => r.status === 'skipped').length} dilewati`,
      results: importResults,
      totalProcessed: validatedData.length,
      created: createdCount,
      updated: updatedCount,
      skipped: importResults.filter(r => r.status === 'skipped').length,
      failed: importResults.filter(r => r.status === 'failed').length
    });
  } catch (error) {
    console.error('Error importing suppliers for warehouse:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}