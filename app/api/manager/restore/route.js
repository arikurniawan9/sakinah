// app/api/manager/restore/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';
import fs from 'fs';
import path from 'path';
import { logActivity } from '@/lib/auditTrail';

// Direktori untuk menyimpan file backup
const BACKUP_DIR = path.join(process.cwd(), 'backups');

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.MANAGER) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Ambil file dari form data
    const formData = await request.formData();
    const backupFile = formData.get('backupFile');

    if (!backupFile) {
      return new Response(JSON.stringify({ error: 'File backup tidak ditemukan' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validasi tipe file
    if (!backupFile.name.endsWith('.json')) {
      return new Response(JSON.stringify({ error: 'Format file tidak didukung. Gunakan file JSON.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Baca dan parse file backup
    const buffer = Buffer.from(await backupFile.arrayBuffer());
    const backupData = JSON.parse(buffer.toString());

    // Validasi struktur backup
    if (!backupData.timestamp || !backupData.stores) {
      return new Response(JSON.stringify({ error: 'File backup tidak valid' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Lakukan restore data (ini adalah contoh sederhana)
    // Dalam implementasi nyata, Anda mungkin perlu menangani relasi dan validasi lebih lanjut
    await prisma.$transaction(async (tx) => {
      // Hapus data lama (opsional, tergantung kebijakan)
      // await tx.auditLog.deleteMany({});
      // await tx.transaction.deleteMany({});
      // await tx.sale.deleteMany({});
      // await tx.product.deleteMany({});
      // await tx.user.deleteMany({});
      // await tx.store.deleteMany({});

      // Restore data
      if (backupData.stores && backupData.stores.length > 0) {
        await tx.store.createMany({
          data: backupData.stores.map(store => ({
            id: store.id,
            code: store.code,
            name: store.name,
            description: store.description,
            address: store.address,
            phone: store.phone,
            email: store.email,
            status: store.status,
            createdAt: new Date(store.createdAt),
            updatedAt: new Date(store.updatedAt)
          }))
        });
      }

      if (backupData.users && backupData.users.length > 0) {
        await tx.user.createMany({
          data: backupData.users.map(user => ({
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email || null,
            password: user.password, // Perhatian: ini mungkin tidak aman
            role: user.role,
            status: user.status,
            employeeNumber: user.employeeNumber,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt)
          }))
        });
      }

      // Tambahkan restore untuk tabel lainnya sesuai kebutuhan
      // Contoh untuk produk:
      if (backupData.products && backupData.products.length > 0) {
        await tx.product.createMany({
          data: backupData.products.map(product => ({
            id: product.id,
            name: product.name,
            code: product.code,
            description: product.description,
            price: product.price,
            stock: product.stock,
            minStock: product.minStock,
            unit: product.unit,
            categoryId: product.categoryId,
            storeId: product.storeId,
            createdAt: new Date(product.createdAt),
            updatedAt: new Date(product.updatedAt)
          }))
        });
      }

      // Tambahkan restore untuk tabel lainnya (sales, transactions, dll)
      // Sesuaikan dengan struktur backup Anda
    });

    // Catat aktivitas restore
    await logActivity(
      session.user.id,
      'UPDATE', // Gunakan UPDATE karena ini adalah proses restore
      'BACKUP',
      backupFile.name,
      `Data dipulihkan dari backup: ${backupFile.name}`,
      null,
      { fileName: backupFile.name, restoredAt: new Date().toISOString() }
    );

    return new Response(JSON.stringify({
      message: 'Restore berhasil dilakukan',
      fileName: backupFile.name
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error restoring backup:', error);
    return new Response(JSON.stringify({ error: 'Gagal melakukan restore: ' + error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}