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

  // Mock data loading
  useEffect(() => {
    // In a real application, this would fetch from an API
    const fetchData = async () => {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock data for the specific return
      const mockReturn = {
        id: params.id,
        transactionId: 'INV-001',
        productId: 'PROD-001',
        productName: 'Sabun Mandi Lux',
        customerName: 'Budi Santoso',
        attendantId: 'ATT-001',
        attendantName: 'Ahmad Kurniawan',
        reason: 'Produk rusak saat diterima, kemasan penyok dan sabun mulai mencair',
        category: 'PRODUCT_DEFECT'
      };
      
      setReturnData(mockReturn);
      setLoading(false);
    };
    
    fetchData();
  }, [params.id]);

  const handleSubmit = async (data) => {
    // In a real application, this would be an API call to update the return
    console.log('Updating return data:', data);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Redirect back to the returns detail page
    router.push(`/admin/retur-produk/${params.id}`);
    router.refresh(); // Refresh to show updated data
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
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}