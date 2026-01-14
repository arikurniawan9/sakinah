// app/api/manager/backup/[id]/download/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { ROLES } from '@/lib/constants';
import fs from 'fs';
import path from 'path';

// Direktori untuk menyimpan file backup
const BACKUP_DIR = path.join(process.cwd(), 'backups');

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.MANAGER) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const fileName = params.id + '.json';
    const filePath = path.join(BACKUP_DIR, fileName);

    // Periksa apakah file ada
    if (!fs.existsSync(filePath)) {
      return new Response(JSON.stringify({ error: 'File backup tidak ditemukan' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Baca file
    const fileBuffer = fs.readFileSync(filePath);

    // Kembalikan file sebagai download
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading backup:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}