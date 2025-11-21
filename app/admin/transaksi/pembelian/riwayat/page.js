// app/admin/transaksi/pembelian/riwayat/page.js
'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '../../../../../components/ProtectedRoute';
import { useUserTheme } from '../../../../../components/UserThemeContext';
import { useSession } from 'next-auth/react';
import { Calendar, Search, Package, User, CreditCard, Filter, Plus, Eye, Download } from 'lucide-react';
import DataTable from '../../../../../components/DataTable';
import Breadcrumb from '../../../../../components/Breadcrumb';
import Link from 'next/link';

export default function PurchaseHistoryPage() {
  const { data: session } = useSession();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');

  // Suppliers for filter dropdown
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const suppliersRes = await fetch('/api/supplier');
        const suppliersData = await suppliersRes.json();
        setSuppliers(suppliersData.suppliers || []);
      } catch (error) {
        console.error('Error fetching suppliers for filtering:', error);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchPurchases = async () => {
      setLoading(true);
      setError('');
      try {
        const queryParams = new URLSearchParams({
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm,
          startDate,
          endDate,
          supplierId: selectedSupplier
        });

        const response = await fetch(`/api/purchase?${queryParams.toString()}`);
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error || 'Gagal mengambil data pembelian');
        
        setPurchases(data.purchases || []);
        setTotalPurchases(data.pagination?.total || 0);
        setTotalPages(data.pagination?.totalPages || 1);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching purchases:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPurchases();
  }, [currentPage, itemsPerPage, searchTerm, startDate, endDate, selectedSupplier]);

  // Define columns for DataTable
  const columns = [
    {
      key: 'purchaseDate',
      title: 'Tanggal',
      render: (value) => new Date(value).toLocaleDateString('id-ID'),
      sortable: true
    },
    {
      key: 'supplier',
      title: 'Supplier',
      render: (value) => value?.name || '-',
      sortable: true
    },
    {
      key: 'totalAmount',
      title: 'Total',
      render: (value) => `Rp ${value?.toLocaleString('id-ID')}`,
      sortable: true
    },
    {
      key: 'user',
      title: 'Dibuat Oleh',
      render: (value) => value?.name || '-',
      sortable: true
    },
    {
      key: 'status',
      title: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'COMPLETED' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
            : value === 'PENDING' 
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' 
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
        }`}>
          {value === 'COMPLETED' ? 'Selesai' : value === 'PENDING' ? 'Tertunda' : 'Dibatalkan'}
        </span>
      ),
      sortable: true
    }
  ];

  // Enhanced data with action handlers
  const enhancedPurchases = purchases.map(purchase => ({
    ...purchase,
    onViewDetails: (p) => console.log('View details', p), // Placeholder for now
    onEdit: undefined, // Pembelian tidak bisa diedit
    onDelete: undefined // Pembelian tidak bisa dihapus
  }));

  // Pagination data
  const paginationData = {
    currentPage,
    totalPages,
    totalItems: totalPurchases,
    startIndex: (currentPage - 1) * itemsPerPage + 1,
    endIndex: Math.min(currentPage * itemsPerPage, totalPurchases),
    onPageChange: setCurrentPage,
    itemsPerPage
  };

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate, selectedSupplier]);

  // Function to download purchase report
  const handleDownloadReport = async () => {
    try {
      const response = await fetch('/api/purchase/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          supplierId: selectedSupplier
        })
      });

      if (!response.ok) {
        throw new Error('Gagal mengunduh laporan pembelian');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `riwayat_pembelian_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading report:', error);
      setError('Gagal mengunduh laporan: ' + error.message);
    }
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <main className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50'}`}>
        <Breadcrumb 
          items={[
            { title: 'Transaksi', href: '/admin/transaksi' },
            { title: 'Pembelian', href: '/admin/transaksi/pembelian' },
            { title: 'Riwayat Pembelian', href: '/admin/transaksi/pembelian/riwayat' }
          ]} 
          darkMode={darkMode} 
        />
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Riwayat Transaksi Pembelian</h1>
          <Link href="/admin/transaksi/pembelian">
            <button className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              darkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-600 hover:bg-purple-700'
            }`}>
              <Plus className="h-4 w-4 mr-2" />
              Transaksi Baru
            </button>
          </Link>
        </div>

        <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
          <DataTable
            data={enhancedPurchases}
            columns={columns}
            loading={loading}
            selectedRows={[]}
            onSelectAll={undefined}
            onSelectRow={undefined}
            onAdd={undefined}
            onSearch={setSearchTerm}
            onExport={handleDownloadReport}
            onItemsPerPageChange={setItemsPerPage}
            darkMode={darkMode}
            actions={true}
            showToolbar={true}
            showAdd={false}
            showExport={true}
            showItemsPerPage={true}
            pagination={paginationData}
            mobileColumns={['purchaseDate', 'totalAmount', 'supplier']} // Show key information on mobile
          />
        </div>

        {/* Error notification */}
        {error && (
          <div className={`fixed bottom-4 right-4 z-50 flex items-center p-4 rounded-lg bg-red-500/10 text-red-400 shadow-lg`}>
            <div className="flex items-center">
              <div className="h-6 w-6 mr-3">
                <Search className="h-4 w-4" />
              </div>
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}