'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ROLES } from '@/lib/constants';
import { useUserTheme } from '@/components/UserThemeContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import Breadcrumb from '@/components/Breadcrumb';
import { Trash2, AlertTriangle, Store, CheckCircle, XCircle } from 'lucide-react';

export default function DeleteStoreDataPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [password, setPassword] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState(null);

  // Fetch all stores
  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
      router.push('/unauthorized');
      return;
    }

    const fetchStores = async () => {
      try {
        const response = await fetch('/api/stores');
        
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          } else if (response.status === 403) {
            router.push('/unauthorized');
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setStores(data.stores || []);
      } catch (err) {
        console.error('Error fetching stores:', err);
        setError('Gagal mengambil data toko: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, [status, session, router]);

  // Handle delete confirmation
  const handleDeleteConfirmation = () => {
    if (!selectedStore) {
      setError('Silakan pilih toko terlebih dahulu');
      return;
    }

    if (confirmationText !== 'HAPUS DATA') {
      setError('Silakan ketik "HAPUS DATA" untuk mengonfirmasi');
      return;
    }

    if (!password.trim()) {
      setError('Silakan masukkan password Anda');
      return;
    }

    setShowConfirmation(true);
  };

  // Execute delete operation
  const executeDelete = async () => {
    setDeleting(true);
    setError('');
    setDeleteResult(null);

    try {
      const response = await fetch(`/api/manager/stores/${selectedStore}/delete-data`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.user?.token || ''}`,
          'X-Manager-Password': password
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      setDeleteResult({
        success: true,
        message: result.message || 'Data toko berhasil dihapus'
      });

      // Reset form after successful deletion
      setTimeout(() => {
        setSelectedStore('');
        setConfirmationText('');
        setPassword('');
        setShowConfirmation(false);
        setDeleting(false);
      }, 2000);
    } catch (err) {
      console.error('Error deleting store data:', err);
      setDeleteResult({
        success: false,
        message: 'Gagal menghapus data toko: ' + err.message
      });
      setDeleting(false);
    }
  };

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
          { title: 'Hapus Data Toko', href: '/manager/delete-store-data' },
        ]}
        basePath="/manager"
        darkMode={darkMode}
      />

      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Hapus Data Toko
        </h1>
        <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Hapus semua data untuk toko tertentu (transaksi, produk, pelanggan, dll)
        </p>
      </div>

      {error && (
        <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'}`}>
          <div className="flex items-center">
            <XCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        </div>
      )}

      {deleteResult && (
        <div className={`mb-6 p-4 rounded-lg ${
          deleteResult.success 
            ? (darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700')
            : (darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700')
        }`}>
          <div className="flex items-center">
            {deleteResult.success ? <CheckCircle className="h-5 w-5 mr-2" /> : <XCircle className="h-5 w-5 mr-2" />}
            {deleteResult.message}
          </div>
        </div>
      )}

      <div className={`rounded-xl shadow-lg p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
        <div className="space-y-6">
          {/* Store Selection */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Pilih Toko
            </label>
            <div className="relative">
              <select
                value={selectedStore}
                onChange={(e) => {
                  setSelectedStore(e.target.value);
                  setError('');
                }}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                disabled={loading || deleting}
              >
                <option value="">Pilih Toko</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>
                    {store.name} ({store.code})
                  </option>
                ))}
              </select>
              <Store className={`absolute right-3 top-3 h-5 w-5 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
            </div>
          </div>

          {/* Warning Message */}
          <div className={`p-4 rounded-lg ${
            darkMode ? 'bg-yellow-900/20 border border-yellow-800' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-start">
              <AlertTriangle className={`h-5 w-5 mr-2 mt-0.5 ${
                darkMode ? 'text-yellow-400' : 'text-yellow-600'
              }`} />
              <div>
                <h3 className={`font-medium ${
                  darkMode ? 'text-yellow-400' : 'text-yellow-800'
                }`}>
                  Peringatan Penting
                </h3>
                <p className={`mt-1 text-sm ${
                  darkMode ? 'text-yellow-200' : 'text-yellow-700'
                }`}>
                  Menghapus data toko akan menghapus SEMUA data terkait termasuk transaksi, produk, 
                  pelanggan, stok, dan riwayat aktivitas. Tindakan ini TIDAK DAPAT DIURUNGKAN.
                </p>
              </div>
            </div>
          </div>

          {/* Confirmation Input */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Ketik "HAPUS DATA" untuk mengonfirmasi
            </label>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder='Ketik "HAPUS DATA" untuk mengonfirmasi'
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              disabled={loading || deleting}
            />
          </div>
          
          {/* Password Input */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Password Anda
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password Anda"
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              disabled={loading || deleting}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={handleDeleteConfirmation}
              disabled={loading || deleting || !selectedStore || confirmationText !== 'HAPUS DATA'}
              className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${
                !selectedStore || confirmationText !== 'HAPUS DATA'
                  ? (darkMode 
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed')
                  : (darkMode
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white')
              }`}
            >
              <Trash2 className="h-5 w-5 mr-2" />
              Hapus Data Toko
            </button>
            
            <button
              onClick={() => {
                setShowConfirmation(false);
                setConfirmationText('');
              }}
              disabled={deleting}
              className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                darkMode
                  ? 'bg-gray-600 hover:bg-gray-700 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              Batal
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => !deleting && setShowConfirmation(false)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className={`inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="sm:flex sm:items-start">
                  <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${
                    darkMode ? 'bg-red-900/30' : 'bg-red-100'
                  }`}>
                    <AlertTriangle className={`h-6 w-6 ${
                      darkMode ? 'text-red-400' : 'text-red-600'
                    }`} />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className={`text-lg leading-6 font-medium ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Konfirmasi Hapus Data Toko
                    </h3>
                    <div className={`mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      <p>
                        Apakah Anda yakin ingin menghapus semua data untuk toko{' '}
                        <strong>
                          {stores.find(s => s.id === selectedStore)?.name || 'toko yang dipilih'}?
                        </strong>
                      </p>
                      <p className="mt-2">
                        <strong className={darkMode ? 'text-red-400' : 'text-red-600'}>
                          Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait!
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse ${
                darkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}>
                <button
                  type="button"
                  onClick={executeDelete}
                  disabled={deleting}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-base ${
                    deleting
                      ? (darkMode ? 'bg-gray-600' : 'bg-gray-400')
                      : (darkMode ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-red-600 hover:bg-red-700 focus:ring-red-500')
                  }`}
                >
                  {deleting ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Menghapus...
                    </span>
                  ) : (
                    'Ya, Hapus Data'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => !deleting && setShowConfirmation(false)}
                  disabled={deleting}
                  className={`mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-base ${
                    darkMode 
                      ? 'bg-gray-600 text-white border-gray-600 hover:bg-gray-700' 
                      : 'bg-white'
                  }`}
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}