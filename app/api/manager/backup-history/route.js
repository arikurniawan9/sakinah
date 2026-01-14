// app/api/manager/backup-history/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { ROLES } from '@/lib/constants';
import fs from 'fs';
import path from 'path';

// Direktori untuk menyimpan file backup
const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Buat direktori backup jika belum ada
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
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