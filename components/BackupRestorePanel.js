// components/BackupRestorePanel.js
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-toastify';
import { RotateCcw, Upload, Download, Trash2, AlertCircle } from 'lucide-react';

export default function BackupRestorePanel() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  // Ambil daftar backup
  const fetchBackups = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/backup-restore/backup');
      const data = await response.json();
      
      if (data.success) {
        setBackups(data.backups);
      } else {
        toast.error(data.error || 'Gagal mengambil daftar backup');
      }
    } catch (error) {
      console.error('Error fetching backups:', error);
      toast.error('Terjadi kesalahan saat mengambil daftar backup');
    } finally {
      setLoading(false);
    }
  };

  // Buat backup baru
  const createBackup = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/backup-restore/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'selective' }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Backup berhasil dibuat');
        fetchBackups(); // Refresh daftar backup
      } else {
        toast.error(data.error || 'Gagal membuat backup');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Terjadi kesalahan saat membuat backup');
    } finally {
      setLoading(false);
    }
  };

  // Restore backup
  const restoreBackup = async (fileName) => {
    if (!window.confirm(`Anda yakin ingin mengembalikan data dari backup ${fileName}? Proses ini akan menggantikan data saat ini.`)) {
      return;
    }

    setRestoreLoading(true);
    try {
      const response = await fetch('/api/backup-restore/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileName }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Backup berhasil dikembalikan');
      } else {
        toast.error(data.error || 'Gagal mengembalikan backup');
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast.error('Terjadi kesalahan saat mengembalikan backup');
    } finally {
      setRestoreLoading(false);
    }
  };

  // Hapus backup
  const deleteBackup = async (fileName) => {
    if (!window.confirm(`Anda yakin ingin menghapus backup ${fileName}?`)) {
      return;
    }

    try {
      // Kita tidak membuat endpoint khusus untuk menghapus, jadi kita hanya memperbarui daftar lokal
      // Untuk implementasi lengkap, perlu dibuat endpoint DELETE di backend
      toast.info('Fitur hapus backup akan segera tersedia');
    } catch (error) {
      console.error('Error deleting backup:', error);
      toast.error('Terjadi kesalahan saat menghapus backup');
    }
  };

  // Tangani upload file untuk impor data
  const handleImportFile = async (event, dataType) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validasi tipe file
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Hanya file CSV yang didukung');
      return;
    }

    setImportLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dataType', dataType);

    try {
      const response = await fetch('/api/import-data', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Data ${dataType} berhasil diimpor. ${data.importedCount} item diproses.`);
      } else {
        toast.error(data.error || `Gagal mengimpor data: ${data.message}`);
      }
    } catch (error) {
      console.error('Error importing data:', error);
      toast.error('Terjadi kesalahan saat mengimpor data');
    } finally {
      setImportLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  return (
    <div className="space-y-6">
      {/* Backup Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Sistem Backup
          </CardTitle>
          <CardDescription>
            Buat dan kelola backup data sistem Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Button 
              onClick={createBackup} 
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {loading ? 'Membuat...' : 'Buat Backup Baru'}
            </Button>
          </div>

          {loading && backups.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              Memuat daftar backup...
            </div>
          )}

          {backups.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Nama File
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Ukuran
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tipe
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {backups.map((backup, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200 max-w-xs truncate">
                        {backup.fileName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(backup.timestamp).toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {(backup.size / (1024 * 1024)).toFixed(2)} MB
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          backup.type === 'full' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' 
                            : 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                        }`}>
                          {backup.type === 'full' ? 'Penuh' : 'Selektif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => restoreBackup(backup.fileName)}
                            disabled={restoreLoading}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Kembalikan
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteBackup(backup.fileName)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : !loading && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Belum ada backup tersedia
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Data Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Impor Data
          </CardTitle>
          <CardDescription>
            Impor data toko, pengguna, atau produk dari file CSV
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Impor Toko */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Impor Toko</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Impor data toko dari file CSV
              </p>
              <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm inline-flex items-center">
                <Upload className="h-4 w-4 mr-2" />
                Pilih File
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => handleImportFile(e, 'stores')}
                  disabled={importLoading}
                />
              </label>
            </div>

            {/* Impor Pengguna */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Impor Pengguna</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Impor data pengguna dari file CSV
              </p>
              <label className="cursor-pointer bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded text-sm inline-flex items-center">
                <Upload className="h-4 w-4 mr-2" />
                Pilih File
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => handleImportFile(e, 'users')}
                  disabled={importLoading}
                />
              </label>
            </div>

            {/* Impor Produk */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Impor Produk</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Impor data produk dari file CSV
              </p>
              <label className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded text-sm inline-flex items-center">
                <Upload className="h-4 w-4 mr-2" />
                Pilih File
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => handleImportFile(e, 'products')}
                  disabled={importLoading}
                />
              </label>
            </div>
          </div>
          
          {importLoading && (
            <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400">
              <AlertCircle className="h-4 w-4 mr-2 animate-spin" />
              Memproses file impor...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}