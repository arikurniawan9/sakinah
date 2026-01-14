'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ROLES } from '@/lib/constants';
import { useUserTheme } from '@/components/UserThemeContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import Breadcrumb from '@/components/Breadcrumb';
import { Database, Upload, Download, AlertTriangle, CheckCircle, RotateCcw } from 'lucide-react';

export default function BackupRestorePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [backupProgress, setBackupProgress] = useState(null);
  const [restoreProgress, setRestoreProgress] = useState(null);
  const [backupHistory, setBackupHistory] = useState([]);

  // Cek apakah pengguna adalah MANAGER
  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
      router.push('/unauthorized');
      return;
    }
  }, [status, session, router]);

  // Fungsi untuk membuat backup
  const handleCreateBackup = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    setBackupProgress({ status: 'starting', message: 'Memulai proses backup...' });

    try {
      const response = await fetch('/api/manager/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.user?.token || ''}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setMessage(result.message || 'Backup berhasil dibuat');
      setBackupProgress(null);
    } catch (err) {
      console.error('Error creating backup:', err);
      setError('Gagal membuat backup: ' + err.message);
      setBackupProgress(null);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk mengunggah file backup
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setMessage('');
    setError('');
    setRestoreProgress({ status: 'uploading', message: 'Mengunggah file...' });

    try {
      const formData = new FormData();
      formData.append('backupFile', file);

      const response = await fetch('/api/manager/restore', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${session?.user?.token || ''}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setMessage(result.message || 'Restore berhasil dilakukan');
      setRestoreProgress(null);
    } catch (err) {
      console.error('Error restoring backup:', err);
      setError('Gagal melakukan restore: ' + err.message);
      setRestoreProgress(null);
    } finally {
      setLoading(false);
      // Reset input file
      event.target.value = '';
    }
  };

  // Fungsi untuk mendapatkan riwayat backup
  const fetchBackupHistory = async () => {
    try {
      const response = await fetch('/api/manager/backup-history', {
        headers: {
          'Authorization': `Bearer ${session?.user?.token || ''}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setBackupHistory(data.history || []);
    } catch (err) {
      console.error('Error fetching backup history:', err);
      setError('Gagal mengambil riwayat backup: ' + err.message);
    }
  };

  // Ambil riwayat backup saat komponen dimuat
  useEffect(() => {
    if (status === 'authenticated' && session.user.role === ROLES.MANAGER) {
      fetchBackupHistory();
    }
  }, [status, session]);

  // Hydration-safe loading and authentication checks
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
    router.push('/unauthorized');
    return null;
  }

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
          { title: 'Dashboard', href: '/manager' },
          { title: 'Backup & Restore', href: '/manager/backup-restore' },
        ]}
        darkMode={darkMode}
      />
      
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Backup & Restore Data
        </h1>
        <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Kelola backup dan restore data sistem Anda
        </p>
      </div>

      {(message || error) && (
        <div className={`mb-6 p-4 rounded-lg ${
          error 
            ? (darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700') 
            : (darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700')
        }`}>
          {error ? (
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              {error}
            </div>
          ) : (
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              {message}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Backup Section */}
        <div className={`rounded-xl shadow-lg p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
          <div className="flex items-center mb-4">
            <Database className={`h-6 w-6 mr-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Buat Backup
            </h2>
          </div>
          
          <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Buat cadangan data sistem Anda untuk mencegah kehilangan informasi penting.
          </p>
          
          {backupProgress && (
            <div className={`mb-4 p-3 rounded-lg ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
              <div className="flex items-center">
                <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                {backupProgress.message}
              </div>
            </div>
          )}
          
          <button
            onClick={handleCreateBackup}
            disabled={loading}
            className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium ${
              loading 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : (darkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white')
            } transition duration-200`}
          >
            <Download className="h-5 w-5 mr-2" />
            Buat Backup Baru
          </button>
        </div>

        {/* Restore Section */}
        <div className={`rounded-xl shadow-lg p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
          <div className="flex items-center mb-4">
            <Upload className={`h-6 w-6 mr-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Restore Data
            </h2>
          </div>
          
          <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Kembalikan data dari file backup yang telah Anda simpan sebelumnya.
          </p>
          
          {restoreProgress && (
            <div className={`mb-4 p-3 rounded-lg ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
              <div className="flex items-center">
                <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                {restoreProgress.message}
              </div>
            </div>
          )}
          
          <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-200">
            <input
              type="file"
              id="restore-file"
              className="hidden"
              accept=".json,.sql,.zip,.bak"
              onChange={handleFileUpload}
              disabled={loading}
            />
            <label htmlFor="restore-file" className="cursor-pointer">
              <Upload className={`h-10 w-10 mx-auto mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <p className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Klik untuk mengunggah file backup
              </p>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Format yang didukung: JSON, SQL, ZIP
              </p>
            </label>
          </div>
        </div>
      </div>

      {/* Backup History */}
      <div className={`mt-8 rounded-xl shadow-lg p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
        <div className="flex items-center mb-4">
          <Database className={`h-6 w-6 mr-2 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Riwayat Backup
          </h2>
        </div>
        
        {backupHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>
                    Tanggal
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>
                    Nama File
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>
                    Ukuran
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                {backupHistory.map((backup, index) => (
                  <tr key={index} className={index % 2 === 0 ? (darkMode ? 'bg-gray-800' : 'bg-white') : (darkMode ? 'bg-gray-900/20' : 'bg-gray-50')}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {new Date(backup.createdAt).toLocaleString('id-ID')}
                    </td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {backup.fileName}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {backup.size ? `${(backup.size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => {
                          // Implementasi download backup
                          const link = document.createElement('a');
                          link.href = `/api/manager/backup/${backup.id}/download`;
                          link.download = backup.fileName;
                          link.click();
                        }}
                        className={`px-3 py-1 rounded ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                      >
                        Unduh
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-center py-4`}>
            Belum ada riwayat backup
          </p>
        )}
      </div>
    </main>
  );
}