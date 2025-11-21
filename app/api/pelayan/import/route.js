// app/api/pelayan/import/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import bcrypt from 'bcryptjs';
import { generateShortCode } from '@/lib/utils';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    // Get the form data
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json(
        { error: 'File tidak ditemukan dalam permintaan' }, 
        { status: 400 }
      );
    }
    
    // Read the file content
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileContent = buffer.toString('utf-8');
    
    // Parse CSV
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });
    
    let importedCount = 0;
    const errors = [];
    
    // Process each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      try {
        // Validate required fields
        if (!record['Nama'] && !record['Name']) {
          errors.push(`Baris ${i + 2}: Nama wajib diisi`);
          continue;
        }
        
        if (!record['Username'] && !record['User']) {
          errors.push(`Baris ${i + 2}: Username wajib diisi`);
          continue;
        }
        
        if (!record['Password'] && !record['Pass']) {
          errors.push(`Baris ${i + 2}: Password wajib diisi`);
          continue;
        }
        
        // Determine field names (support both English and Indonesian)
        const name = record['Nama'] || record['Name'];
        const username = record['Username'] || record['User'];
        const password = record['Password'] || record['Pass'];
        
        // Check if username already exists
        const existingUser = await prisma.user.findUnique({
          where: { username: username.trim() }
        });
        
        if (existingUser) {
          errors.push(`Baris ${i + 2}: Username "${username}" sudah ada`);
          continue;
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Check if code is provided in the import file
        let userCode = null;
        if (record['Kode'] || record['Code']) {
          userCode = (record['Kode'] || record['Code']).trim();

          // Check if code already exists
          const existingCode = await prisma.user.findUnique({
            where: { code: userCode }
          });

          if (existingCode) {
            errors.push(`Baris ${i + 2}: Kode "${userCode}" sudah digunakan oleh pengguna lain`);
            continue;
          }
        } else {
          // Generate a unique code if not provided
          let uniqueCode;
          let attempt = 0;
          const maxAttempts = 10;

          do {
            uniqueCode = generateShortCode('USR');
            attempt++;

            // Check if code already exists
            const existingCode = await prisma.user.findUnique({
              where: { code: uniqueCode }
            });

            if (!existingCode) {
              break; // Found unique code
            }
          } while (attempt < maxAttempts);

          if (attempt >= maxAttempts) {
            errors.push(`Baris ${i + 2}: Gagal membuat kode unik, silakan coba lagi`);
            continue;
          }

          userCode = uniqueCode;
        }

        // Create user with ATTENDANT role
        await prisma.user.create({
          data: {
            name: name.trim(),
            username: username.trim(),
            password: hashedPassword,
            role: 'ATTENDANT',
            code: userCode // Add the code
          }
        });
        
        importedCount++;
      } catch (error) {
        errors.push(`Baris ${i + 2}: Gagal memproses - ${error.message}`);
      }
    }
    
    let message = `Berhasil mengimport ${importedCount} pelayan`;
    if (errors.length > 0) {
      message += `. Terdapat ${errors.length} error.`;
    }
    
    return NextResponse.json({ 
      message,
      importedCount,
      errors
    });
  } catch (error) {
    console.error('Error importing attendants:', error);
    return NextResponse.json(
      { error: 'Gagal mengimport pelayan: ' + error.message }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}