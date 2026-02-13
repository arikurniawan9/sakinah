'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import Breadcrumb from '@/components/Breadcrumb';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useUserTheme } from '@/components/UserThemeContext';
import ReturnProductForm from '../../Form';
import { PackageX, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function EditReturnProductPage() {
  const { userTheme } = useUserTheme();
  const router = useRouter();
  const params = useParams();
  
  const [returnData, setReturnData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const breadcrumbItems = [
    { title: 'Admin', href: '/admin' },
    { title: 'Retur Produk', href: '/admin/retur-produk' },
    { title: `Edit #${params.id}`, href: `/admin/retur-produk/${params.id}/edit` }
  ];

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const response = await fetch(`/api/return-products/${params.id}`);
        const result = await response.json();

        if (result.success) {
          setReturnData(result.data);
        } else {
          console.error('Failed to fetch return data:', result.message);
        }
      } catch (error) {
        console.error('Error fetching return data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const handleSubmit = async (data) => {
    try {
      const response = await fetch(`/api/return-products/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        alert('Retur produk berhasil diperbarui');
        // Redirect back to the returns detail page
        router.push(`/admin/retur-produk/${params.id}`);
        router.refresh(); // Refresh to show updated data
      } else {
        console.error('Failed to update return:', result.message);
        alert(`Gagal memperbarui retur: ${result.message}`);
      }
    } catch (error) {
      console.error('Error updating return:', error);
      alert('Terjadi kesalahan saat memperbarui retur');
    }
  };

  const handleCancel = () => {
    router.push(`/admin/retur-produk/${params.id}`);
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <div className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${userTheme.darkMode ? 'dark' : ''}`}>
          <div className="flex items-center justify-center h-64">
            <div className={`text-center ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <PackageX className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Loading data retur produk...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!returnData) {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <div className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${userTheme.darkMode ? 'dark' : ''}`}>
          <div className="flex items-center justify-center h-64">
            <div className={`text-center ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <PackageX className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Data retur produk tidak ditemukan</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${userTheme.darkMode ? 'dark' : ''}`}>
        <Breadcrumb items={breadcrumbItems} darkMode={userTheme.darkMode} />
        
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => router.push(`/admin/retur-produk/${params.id}`)}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className={`text-3xl font-bold ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                Edit Retur Produk #{returnData.id}
              </h1>
              <p className={`mt-2 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Perbarui informasi permintaan retur produk
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl">
          <ReturnProductForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialData={returnData}
            isEditing={true}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}