// app/api/manager/backup/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logActivity } from '@/lib/auditTrail';

const execPromise = promisify(exec);

// Direktori untuk menyimpan file backup
const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Buat direktori backup jika belum ada
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.MANAGER) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Buat nama file backup berdasarkan timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup-${timestamp}.json`;
    const filePath = path.join(BACKUP_DIR, fileName);

    // Ambil semua data penting dari database
    const backupData = {
      timestamp: new Date().toISOString(),
      user: session.user.id,
      stores: await prisma.store.findMany(),
      users: await prisma.user.findMany(),
      products: await prisma.product.findMany(),
      sales: await prisma.sale.findMany(),
      transactions: await prisma.transaction.findMany(),
      auditLogs: await prisma.auditLog.findMany(),
      // Tambahkan tabel lain sesuai kebutuhan
    };

    // Simpan data backup ke file
    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));

    // Catat aktivitas backup
    await logActivity(
      session.user.id,
      'CREATE',
      'BACKUP',
      fileName,
      `Backup data dibuat: ${fileName}`,
      null,
      { fileName, size: backupData.length }
    );

    return new Response(JSON.stringify({
      message: 'Backup berhasil dibuat',
      fileName,
      filePath
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.MANAGER) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Dapatkan daftar file backup
    const files = fs.readdirSync(BACKUP_DIR).filter(file => file.endsWith('.json'));
    
    const backupHistory = files.map(file => {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      
      return {
        id: file.replace('.json', ''),
        fileName: file,
        createdAt: stats.birthtime,
        size: stats.size
      };
    });

    // Urutkan berdasarkan tanggal pembuatan (terbaru dulu)
    backupHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return new Response(JSON.stringify({
      history: backupHistory
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching backup history:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}