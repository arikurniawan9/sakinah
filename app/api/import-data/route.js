// app/api/import-data/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { ROLES } from '@/lib/constants';
import { importDataFromCSV } from '@/lib/importData';
import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';


export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.MANAGER) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse form data
    const form = formidable({
      multiples: true,
      // Upload file ke temporary directory
      uploadDir: path.join(process.cwd(), 'temp'),
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });

    // Pastikan direktori temp ada
    const tempDir = path.join(process.cwd(), 'temp');
    try {
      await fs.access(tempDir);
    } catch {
      await fs.mkdir(tempDir, { recursive: true });
    }

    // Parse request
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(request, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    // Validasi file
    if (!files.file) {
      return new Response(JSON.stringify({ 
        error: 'File tidak ditemukan dalam permintaan' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    
    // Validasi tipe file
    const allowedTypes = ['.csv'];
    const fileExtension = path.extname(file.originalFilename).toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      return new Response(JSON.stringify({ 
        error: `Tipe file tidak didukung. Hanya ${allowedTypes.join(', ')} yang diperbolehkan` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validasi tipe data
    const dataType = fields.dataType ? Array.isArray(fields.dataType) ? fields.dataType[0] : fields.dataType : 'stores';
    const validDataTypes = ['stores', 'users', 'products'];
    
    if (!validDataTypes.includes(dataType)) {
      return new Response(JSON.stringify({ 
        error: `Tipe data tidak valid. Pilihan: ${validDataTypes.join(', ')}` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Baca file CSV
    const csvData = await fs.readFile(file.filepath, 'utf-8');

    // Hapus file temporary setelah dibaca
    await fs.unlink(file.filepath);

    // Impor data
    const result = await importDataFromCSV(csvData, dataType);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error importing data:', error);
    
    // Bersihkan file temporary jika terjadi error
    try {
      const tempDir = path.join(process.cwd(), 'temp');
      const tempFiles = await fs.readdir(tempDir);
      for (const tempFile of tempFiles) {
        if (tempFile.startsWith('tmp-')) {
          await fs.unlink(path.join(tempDir, tempFile));
        }
      }
    } catch (cleanupError) {
      console.error('Error cleaning up temp files:', cleanupError);
    }
    
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}