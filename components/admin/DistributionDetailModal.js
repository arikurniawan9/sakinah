// components/admin/DistributionDetailModal.js
'use client';

import { useState, useEffect } from 'react';
import { useUserTheme } from '@/components/UserThemeContext';
import { X, Package, User, Calendar, Hash, DollarSign, Loader2 } from 'lucide-react';
import DataTable from '@/components/DataTable'; // Assuming a generic DataTable component exists

export default function DistributionDetailModal({
  isOpen,
  onClose,
  distribution
}) {
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const [batchDetails, setBatchDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle ESC key press to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  // Load batch details when modal opens
  useEffect(() => {
    if (isOpen && distribution) {
      fetchBatchDetails();
    } else {
      // Reset state when modal closes
      setBatchDetails(null);
      setError('');
    }
  }, [isOpen, distribution]);

  const fetchBatchDetails = async () => {
    if (!distribution) return;

    setLoading(true);
    setError('');
    try {
      // Extract the date from the distribution and get all distributions with same date, store, and distributedBy
      const date = new Date(distribution.distributedAt).toISOString().split('T')[0];

      // Call the grouped API to get all distributions in the same batch
      const response = await fetch(
        `/api/warehouse/distribution/grouped/${distribution.distributionId || distribution.id}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch batch details');
      }

      setBatchDetails(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching batch details:', err);
    } finally {
      setLoading(false);
    }
  };

  // Define columns as a constant outside the return statement
  const productColumns = [
    {
      key: 'no',
      title: 'No.',
      render: (_, __, index) => index + 1,
    },
    {
      key: 'product.name',
      title: 'Nama Produk',
      sortable: true,
      render: (value) => value || 'N/A'
    },
    {
      key: 'product.productCode',
      title: 'Kode Produk',
      sortable: true,
      render: (value) => value || 'N/A'
    },
    {
      key: 'quantity',
      title: 'Jumlah',
      render: (value) => value?.toLocaleString('id-ID') || '0',
      sortable: true
    },
    {
      key: 'unitPrice',
      title: 'Harga Distribusi',
      render: (value) => value ? `Rp ${value.toLocaleString('id-ID')}` : 'Rp 0',
      sortable: true
    },
    {
      key: 'totalAmount',
      title: 'Total',
      render: (value) => value ? `Rp ${value.toLocaleString('id-ID')}` : 'Rp 0',
      sortable: true
    },
  ];

  if (!isOpen) return null;

  const batchSummary = batchDetails || distribution; // Use batch details if available, otherwise use the single distribution

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100] print:flex print:items-center print:justify-center print:inset-0 print:bg-white">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto print:max-w-none print:w-full print:max-h-none print:m-0 print:p-0 print:shadow-none`}>
        <div className="p-6 print:p-0 print:overflow-visible">
          {/* Header */}
          <div className="flex justify-between items-center mb-4 print:hidden">
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Detail Distribusi
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Batch Summary */}
          {batchDetails && !loading && (
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="flex items-center">
                <Hash className="h-5 w-5 mr-2 text-blue-500" />
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>ID Batch:</p>
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{batchDetails.invoiceNumber || batchDetails.id}</p>
                </div>
              </div>
              <div className="flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-500" />
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Dikirim Oleh:</p>
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{batchDetails.distributedByUser?.name || batchDetails.distributedByUserName || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Tanggal:</p>
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {batchDetails.distributedAt ? new Date(batchDetails.distributedAt).toLocaleDateString('id-ID') : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <Package className="h-5 w-5 mr-2 text-blue-500" />
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Item:</p>
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {batchDetails.items ? batchDetails.items.length :
                     batchDetails.itemCount ? batchDetails.itemCount.toLocaleString('id-ID') : '1'}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <Hash className="h-5 w-5 mr-2 text-blue-500" />
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Kuantitas:</p>
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {batchDetails.items ?
                      batchDetails.items.reduce((sum, item) => sum + (item.quantity || 0), 0).toLocaleString('id-ID') :
                      batchDetails.totalQuantity ? batchDetails.totalQuantity.toLocaleString('id-ID') :
                      batchDetails.quantity?.toLocaleString('id-ID') || '0'}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-blue-500" />
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Jumlah:</p>
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {batchDetails.items ?
                      `Rp ${batchDetails.items.reduce((sum, item) => sum + (item.totalAmount || 0), 0).toLocaleString('id-ID')}` :
                      batchDetails.totalAmount ? `Rp ${batchDetails.totalAmount.toLocaleString('id-ID')}` :
                      `Rp ${(batchDetails.totalAmount || 0).toLocaleString('id-ID')}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Products Table */}
          <div className="mb-6">
            <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Daftar Produk dalam Batch Ini</h3>

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2">Memuat detail distribusi...</span>
              </div>
            ) : error ? (
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-red-900/30 border border-red-700' : 'bg-red-100 border border-red-400'} text-red-700 dark:text-red-300`}>
                <p>Error: {error}</p>
              </div>
            ) : batchDetails ? (
              <div className={`rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <DataTable
                  data={batchDetails.items || []} // Use items array if available
                  columns={productColumns}
                  loading={false}
                  darkMode={darkMode}
                  emptyMessage="Tidak ada produk dalam batch ini."
                  mobileColumns={['product.name', 'quantity', 'totalAmount']}
                />
              </div>
            ) : (
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Tidak ada detail produk tersedia.</p>
              </div>
            )}
          </div>

          {/* Action Buttons - Hidden during print */}
          <div className="flex justify-end space-x-3 print:hidden">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg ${
                darkMode ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
              }`}
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}