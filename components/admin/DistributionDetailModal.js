// components/admin/DistributionDetailModal.js
'use client';

import { useState, useEffect } from 'react';
import { useUserTheme } from '@/components/UserThemeContext';
import { X, Package, User, Calendar, Hash, DollarSign, Loader2, CheckCircle, XCircle } from 'lucide-react';
import DataTable from '@/components/DataTable'; // Assuming a generic DataTable component exists
import CustomNotification from '@/components/CustomNotification';

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
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

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

  // Load distribution details when modal opens
  useEffect(() => {
    if (isOpen && distribution) {
      fetchDistributionDetails();
    } else {
      // Reset state when modal closes
      setBatchDetails(null);
      setError('');
    }
  }, [isOpen, distribution]);

  const fetchDistributionDetails = async () => {
    if (!distribution) return;

    setLoading(true);
    setError('');
    try {
      // Call the grouped API to get all details for this distribution batch
      const response = await fetch(
        `/api/warehouse/distribution/grouped/${distribution.id}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch distribution details');
      }

      setBatchDetails(data); // Keep same state name for consistency
    } catch (err) {
      setError(err.message);
      console.error('Error fetching distribution details:', err);
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
      render: (value, row) => {
        // Handle case where product might be nested differently
        if (row.product && typeof row.product === 'object') {
          return row.product.name || 'N/A';
        }
        // Fallback to direct access
        return value || 'N/A';
      }
    },
    {
      key: 'product.productCode',
      title: 'Kode Produk',
      sortable: true,
      render: (value, row) => {
        // Handle case where product might be nested differently
        if (row.product && typeof row.product === 'object') {
          return row.product.productCode || 'N/A';
        }
        // Fallback to direct access
        return value || 'N/A';
      }
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
    {
      key: 'status',
      title: 'Status',
      render: (value, row) => {
        // Determine status based on the distribution item's status
        const itemStatus = row.status || 'PENDING_ACCEPTANCE';
        let statusText = 'Menunggu';
        let statusClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';

        if (itemStatus === 'ACCEPTED') {
          statusText = 'Diterima';
          statusClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
        } else if (itemStatus === 'REJECTED') {
          statusText = 'Ditolak';
          statusClass = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
        }

        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}>
            {statusText}
          </span>
        );
      },
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
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No. Invoice Distribusi:</p>
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{batchDetails.invoiceNumber || batchDetails.distributionId || batchDetails.id || 'N/A'}</p>
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
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Jumlah Produk:</p>
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {batchDetails.items ? batchDetails.items.length : '1'}
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
                      batchDetails.totalQuantity?.toLocaleString('id-ID') || '0'}
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
                      `Rp ${batchDetails.totalAmount?.toLocaleString('id-ID') || '0'}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Products Table */}
          <div className="mb-6">
            <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Detail Produk dalam Distribusi Ini</h3>

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
                  data={batchDetails.items || []} // Use items array from grouped distribution
                  columns={productColumns}
                  loading={false}
                  darkMode={darkMode}
                  emptyMessage="Tidak ada produk dalam distribusi ini."
                  mobileColumns={['productName', 'quantity', 'totalAmount', 'status']}
                  rowActions={(row) => (
                    <div className="flex space-x-2">
                      <button
                        onClick={async () => {
                          // Accept individual item
                          try {
                            const response = await fetch('/api/admin/distribution/item-accept', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                distributionId: row.id
                              })
                            });

                            if (response.ok) {
                              setNotification({ show: true, message: 'Item distribusi berhasil diterima', type: 'success' });
                              // Refresh the details to update status
                              fetchDistributionDetails();
                            } else {
                              const result = await response.json();
                              setNotification({ show: true, message: `Gagal menerima item distribusi: ${result.error || 'Unknown error'}`, type: 'error' });
                            }
                          } catch (error) {
                            setNotification({ show: true, message: `Error saat menerima item distribusi: ${error.message}`, type: 'error' });
                          }
                        }}
                        disabled={row.status === 'ACCEPTED'}
                        className={`p-1.5 rounded ${
                          row.status === 'ACCEPTED'
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                            : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-800/50'
                        }`}
                        title="Terima Item"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={async () => {
                          // Reject individual item
                          try {
                            const response = await fetch('/api/admin/distribution/item-reject', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                distributionId: row.id,
                                reason: 'Ditolak oleh admin (per item)'
                              })
                            });

                            if (response.ok) {
                              setNotification({ show: true, message: 'Item distribusi berhasil ditolak', type: 'success' });
                              // Refresh the details to update status
                              fetchDistributionDetails();
                            } else {
                              const result = await response.json();
                              setNotification({ show: true, message: `Gagal menolak item distribusi: ${result.error || 'Unknown error'}`, type: 'error' });
                            }
                          } catch (error) {
                            setNotification({ show: true, message: `Error saat menolak item distribusi: ${error.message}`, type: 'error' });
                          }
                        }}
                        disabled={row.status === 'REJECTED'}
                        className={`p-1.5 rounded ${
                          row.status === 'REJECTED'
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                            : 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-800/50'
                        }`}
                        title="Tolak Item"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  )}
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
              onClick={async () => {
                // Reject the entire batch based on the distribution's date, store, and distributor
                try {
                  const response = await fetch('/api/admin/distribution/batch-reject', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      distributionId: distribution.id
                    })
                  });

                  if (response.ok) {
                    const result = await response.json();
                    setNotification({ show: true, message: result.message, type: 'success' });
                    onClose(); // Close the modal after rejection
                  } else {
                    const result = await response.json();
                    setNotification({ show: true, message: `Gagal menolak batch distribusi: ${result.error || 'Unknown error'}`, type: 'error' });
                  }
                } catch (error) {
                  setNotification({ show: true, message: `Error saat menolak batch distribusi: ${error.message}`, type: 'error' });
                }
              }}
              className={`px-4 py-2 rounded-lg ${
                darkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              Tolak Batch
            </button>
            <button
              onClick={async () => {
                // Accept the entire batch based on the distribution's date, store, and distributor
                try {
                  const response = await fetch('/api/admin/distribution/batch-accept', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      distributionId: distribution.id
                    })
                  });

                  if (response.ok) {
                    const result = await response.json();
                    setNotification({ show: true, message: result.message, type: 'success' });
                    onClose(); // Close the modal after acceptance
                  } else {
                    const result = await response.json();
                    setNotification({ show: true, message: `Gagal menerima batch distribusi: ${result.error || 'Unknown error'}`, type: 'error' });
                  }
                } catch (error) {
                  setNotification({ show: true, message: `Error saat menerima batch distribusi: ${error.message}`, type: 'error' });
                }
              }}
              className={`px-4 py-2 rounded-lg ${
                darkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              Terima Batch
            </button>
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

        {/* Notification */}
        {notification.show && (
          <CustomNotification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification({ show: false, message: '', type: '' })}
          />
        )}
      </div>
    </div>
  );
}