'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import Breadcrumb from '@/components/Breadcrumb';
import { useRouter } from 'next/navigation';
import { useUserTheme } from '@/components/UserThemeContext';
import ReturnProductForm from '../Form';
import { PackageX } from 'lucide-react';

export default function AddReturnProductPage() {
  const { userTheme } = useUserTheme();
  const router = useRouter();
  
  const breadcrumbItems = [
    { title: 'Admin', href: '/admin' },
    { title: 'Retur Produk', href: '/admin/retur-produk' },
    { title: 'Tambah Retur', href: '/admin/retur-produk/tambah' }
  ];

  const handleSubmit = async (data) => {
    // Redirect back to the returns list after successful submission
    router.push('/admin/retur-produk');
    router.refresh(); // Refresh to show the new return
  };

  const handleCancel = () => {
    router.push('/admin/retur-produk');
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${userTheme.darkMode ? 'dark' : ''}`}>
        <Breadcrumb items={breadcrumbItems} darkMode={userTheme.darkMode} />
        
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full ${userTheme.darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <PackageX className={`h-8 w-8 ${userTheme.darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                Tambah Retur Produk Baru
              </h1>
              <p className={`mt-2 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Buat permintaan retur produk baru untuk ditinjau
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl">
          <ReturnProductForm 
            onSubmit={handleSubmit} 
            onCancel={handleCancel} 
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}