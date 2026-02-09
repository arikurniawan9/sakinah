// app/admin/laporan/piutang/page.js
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useUserTheme } from '../../../../components/UserThemeContext';
import { useReceivableTable } from '@/lib/hooks/useReceivableTable';
import ReceivableToolbar from '@/components/laporan/piutang/ReceivableToolbar';
import ReceivableTable from '@/components/laporan/piutang/ReceivableTable';
import Pagination from '@/components/produk/Pagination'; // Re-using pagination component
import UniversalPrintPreview from '../../../../components/export/UniversalPrintPreview';
import { Printer } from 'lucide-react';

export default function ReceivablesPage() {
  const { userTheme } = useUserTheme();
  const { data: session } = useSession();
  const darkMode = userTheme.darkMode;
  const {
    receivables,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    totalReceivables,
    fetchReceivables
  } = useReceivableTable();

  // State untuk print preview
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);

  // Fungsi untuk membuka print preview dengan data laporan saat ini
  const openPrintPreview = () => {
    setIsPrintPreviewOpen(true);
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <main className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${darkMode ? 'bg-gray-900 text-gray-100' : ''}`}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Laporan Piutang
          </h1>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={openPrintPreview}
              className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                darkMode
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-w-[100px]`}
            >
              <Printer className="h-4 w-4 mr-1" />
              <span>Cetak</span>
            </button>
          </div>
        </div>

        <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
          <div className="p-4 sm:p-6">
            <ReceivableToolbar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              darkMode={darkMode}
            />

            {error && (
              <div className={`my-4 p-4 ${darkMode ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-red-50 border border-red-200 text-red-700'} rounded-md`}>
                {error}
              </div>
            )}

            <ReceivableTable
              receivables={receivables}
              loading={loading}
              darkMode={darkMode}
            />
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalProducts={totalReceivables} // Prop name is totalProducts, but we pass totalReceivables
            darkMode={darkMode}
          />
        </div>

        {/* Print Preview Modal */}
        <UniversalPrintPreview
          isOpen={isPrintPreviewOpen}
          onClose={() => setIsPrintPreviewOpen(false)}
          data={{
            receivables: receivables
          }}
          title="Laporan Piutang"
          reportType="receivable"
          darkMode={darkMode}
          storeName={{
            name: session?.user?.storeAccess?.name || 'SAKINAH',
            address: session?.user?.storeAccess?.address
          }}
        />
      </main>
    </ProtectedRoute>
  );
}
