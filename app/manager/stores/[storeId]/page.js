'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useUserTheme } from '../../../../components/UserThemeContext';
import { ROLES } from '@/lib/constants';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function StoreDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const response = await fetch(`/api/stores/${params.storeId}`);
        const data = await response.json();
        
        if (response.ok) {
          setStore(data.store);
        } else {
          toast.error(data.error || 'Gagal mengambil data toko');
          router.push('/manager/stores');
        }
      } catch (error) {
        console.error('Error fetching store:', error);
        toast.error('Terjadi kesalahan saat mengambil data toko');
        router.push('/manager/stores');
      } finally {
        setLoading(false);
      }
    };

    if (params.storeId) {
      fetchStore();
    }
  }, [params.storeId, router]);

  if (loading) {
    return (
      <ProtectedRoute requiredRole="MANAGER">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!store) {
    return (
      <ProtectedRoute requiredRole="MANAGER">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
              Toko tidak ditemukan
            </h2>
            <button
              onClick={() => router.push('/manager/stores')}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
            >
              Kembali ke Daftar Toko
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="MANAGER">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={darkMode ? 'dark' : 'light'}
        />

        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Detail Toko
            </h1>
            <button
              onClick={() => router.push('/manager/stores')}
              className={`px-4 py-2 rounded-md ${
                darkMode 
                  ? 'bg-gray-700 text-white hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Kembali
            </button>
          </div>
          <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Informasi lengkap tentang toko {store.name}
          </p>
        </div>

        <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 mb-6`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Informasi Toko
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Nama Toko
                  </label>
                  <p className={`mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                    {store.name}
                  </p>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Deskripsi
                  </label>
                  <p className={`mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                    {store.description || '-'}
                  </p>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Status
                  </label>
                  <span className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    store.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                      : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                  }`}>
                    {store.status}
                  </span>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Tanggal Dibuat
                  </label>
                  <p className={`mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                    {new Date(store.createdAt).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Kontak & Alamat
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Alamat
                  </label>
                  <p className={`mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                    {store.address || '-'}
                  </p>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    No. Telepon
                  </label>
                  <p className={`mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                    {store.phone || '-'}
                  </p>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email
                  </label>
                  <p className={`mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                    {store.email || '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={() => router.push(`/manager/stores/${store.id}/edit`)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          >
            Edit Toko
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}