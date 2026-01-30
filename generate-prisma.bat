@echo off
echo Menghapus cache Prisma...
if exist "node_modules\.prisma" rmdir /s /q "node_modules\.prisma" 2>nul
if exist "node_modules\@prisma\client" rmdir /s /q "node_modules\@prisma\client" 2>nul

echo Menginstall ulang dependensi...
npm install

echo Generate klien Prisma...
npx prisma generate

echo Selesai!
pause