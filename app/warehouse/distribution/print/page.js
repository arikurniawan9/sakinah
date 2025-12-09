'use client';

import { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ROLES } from '@/lib/constants';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import DistributionReceipt from '../../../../components/warehouse/DistributionReceipt';
import { useUserTheme } from '../../../../components/UserThemeContext';

export default function PrintDistributionReceiptPage() {
  const { data: session } = useSession();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const searchParams = useSearchParams();
  const distributionId = searchParams.get('id');
  
  const [distributionData, setDistributionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const componentRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Struk Distribusi - ${distributionData?.id || 'N/A'}`,
    pageStyle: `
      @page {
        size: 80mm auto;
        margin: 0.25in 0.25in 0.25in 0.25in;
      }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `
  });

  useEffect(() => {
    const fetchDistribution = async () => {
      if (!distributionId) {
        setError('ID distribusi tidak ditemukan');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/warehouse/distribution?id=${distributionId}`);
        const data = await response.json();

        if (response.ok) {
          setDistributionData(data);
        } else {
          setError(data.error || 'Gagal mengambil data distribusi');
        }
      } catch (err) {
        setError('Terjadi kesalahan saat mengambil data distribusi');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDistribution();
  }, [distributionId]);

  useEffect(() => {
    if (distributionData && typeof window !== 'undefined') {
      // Auto-print when data is loaded
      const timer = setTimeout(() => {
        handlePrint();
      }, 1000); // Wait a bit for component to render

      return () => clearTimeout(timer);
    }
  }, [distributionData, handlePrint]);

  if (loading) {
    return (
      <ProtectedRoute requiredRole="WAREHOUSE">
        <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute requiredRole="WAREHOUSE">
        <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className={`p-6 rounded-lg ${darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'}`}>
            <p>{error}</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="WAREHOUSE">
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} p-8 print:p-0 print:bg-white`}>
        <div className="max-w-4xl mx-auto">
          <div className={`p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} print:hidden`}>
            <h1 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Cetak Struk Distribusi
            </h1>
            <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Distribusi #{distributionData?.id} - {distributionData?.store?.name}
            </p>
            
            <div className="flex space-x-4">
              <button
                onClick={handlePrint}
                className={`px-6 py-3 rounded-lg flex items-center ${
                  darkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                <span>Print Struk</span>
              </button>
              
              <button
                onClick={() => window.history.back()}
                className={`px-6 py-3 rounded-lg ${
                  darkMode ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                }`}
              >
                Kembali
              </button>
            </div>
          </div>

          {/* Receipt Component */}
          <div className="mt-6 print:mt-0">
            <DistributionReceipt 
              ref={componentRef} 
              distributionData={distributionData} 
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}