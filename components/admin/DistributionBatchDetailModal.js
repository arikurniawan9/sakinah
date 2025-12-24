// components/admin/DistributionBatchDetailModal.js
'use client';

import { useState, useEffect } from 'react';
import { useUserTheme } from '@/components/UserThemeContext';
import { X, Package, Tag, Hash, DollarSign, Calendar, User, Truck, Info, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import DataTable from '@/components/DataTable'; // Assuming a generic DataTable component exists
import ConfirmationModal from '@/components/ConfirmationModal'; // Assuming ConfirmationModal exists

export default function DistributionBatchDetailModal({
  isOpen,
  onClose,
  batch, // The selected batch summary object
  onBatchAccepted,
  onBatchRejected
}) {
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;

  const [batchDetails, setBatchDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen && batch) {
      fetchBatchDetails();
    } else {
      // Reset state when modal closes
      setBatchDetails(null);
      setError('');
      setReason('');
      setIsProcessing(false);
    }
  }, [isOpen, batch]);

  const fetchBatchDetails = async () => {
    setLoading(true);
    setError('');
    try {
      // Extract date part from batch.distributedAt for the API call
      const date = new Date(batch.distributedAt).toISOString().split('T')[0];
      const response = await fetch(
        `/api/admin/distributions/batch-details?date=${date}&distributedByUserId=${batch.distributedByUserId}&storeId=${batch.storeId}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch batch details');
      }
      setBatchDetails(data);
      console.log({ batchDetailsItems: data.items }); // Add this line
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBatch = () => {
    setShowAcceptConfirm(true);
  };

  const handleRejectBatch = () => {
    setShowRejectConfirm(true);
  };

  const confirmAcceptBatch = async () => {
    if (!batch) return;
    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/distribution/accept', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date(batch.distributedAt).toISOString().split('T')[0],
          distributedByUserId: batch.distributedByUserId,
          storeId: batch.storeId,
          reason: reason,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to accept batch');
      }
      onBatchAccepted(result.batchId); // Notify parent component
      setShowAcceptConfirm(false);
      onClose(); // Close the modal
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmRejectBatch = async () => {
    if (!batch) return;
    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/distribution/accept', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date(batch.distributedAt).toISOString().split('T')[0],
          distributedByUserId: batch.distributedByUserId,
          storeId: batch.storeId,
          reason: reason,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to reject batch');
      }
      onBatchRejected(result.batchId); // Notify parent component
      setShowRejectConfirm(false);
      onClose(); // Close the modal
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const productColumns = [
    {
      key: 'product.name',
      title: 'Nama Produk',
      sortable: true,
      render: (value) => value || 'N/A' // Fallback for null/undefined/empty
    },
    {
      key: 'product.productCode',
      title: 'Kode Produk',
      sortable: true,
      render: (value) => value || 'N/A' // Fallback for null/undefined/empty
    },
    {
      key: 'quantity',
      title: 'Jumlah',
      render: (value) => value.toLocaleString('id-ID'),
      sortable: true
    },
    {
      key: 'unitPrice',
      title: 'Harga Distribusi', // Clarified title
      render: (value) => value ? `Rp ${value.toLocaleString('id-ID')}` : 'Rp 0',
      sortable: true
    },
    {
      key: 'product.purchasePrice',
      title: 'Harga Beli',
      render: (value) => value ? `Rp ${value.toLocaleString('id-ID')}` : 'Rp 0',
      sortable: true
    },
    {
      key: 'product.retailPrice',
      title: 'Harga Jual/Eceran',
      render: (value) => value ? `Rp ${value.toLocaleString('id-ID')}` : 'Rp 0',
      sortable: true
    },
    {
      key: 'product.silverPrice',
      title: 'Harga Member Silver',
      render: (value) => value ? `Rp ${value.toLocaleString('id-ID')}` : 'Rp 0',
      sortable: true
    },
    {
      key: 'product.goldPrice',
      title: 'Harga Member Gold',
      render: (value) => value ? `Rp ${value.toLocaleString('id-ID')}` : 'Rp 0',
      sortable: true
    },
    {
      key: 'product.platinumPrice',
      title: 'Harga Member Platinum (Partai)',
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
      render: (value) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          value === 'PENDING_ACCEPTANCE' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : ''
        }`}>
          {value === 'PENDING_ACCEPTANCE' ? 'Menunggu' : value}
        </span>
      ),
      sortable: true
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className={`relative w-full max-w-4xl max-h-[90vh] rounded-lg shadow-xl overflow-hidden ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}>
        {/* Modal Header */}
        <div className={`flex justify-between items-center p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className="text-xl font-semibold">Detail Distribusi Batch</h2>
          <button onClick={onClose} className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2">Memuat detail batch...</span>
            </div>
          ) : error ? (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
              <p className="font-bold">Error:</p>
              <p>{error}</p>
            </div>
          ) : batchDetails ? (
            <>
              {/* Batch Summary */}
              <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-4 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center">
                  <Tag size={18} className="mr-2 text-blue-500" />
                  <p><strong className={darkMode ? 'text-gray-300' : 'text-gray-700'}>ID Batch:</strong> {batchDetails.batchId}</p>
                </div>
                <div className="flex items-center">
                  <User size={18} className="mr-2 text-blue-500" />
                  <p><strong className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Dikirim Oleh:</strong> {batchDetails.distributedBy?.name || 'N/A'}</p>
                </div>
                <div className="flex items-center">
                  <Calendar size={18} className="mr-2 text-blue-500" />
                  <p><strong className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Tanggal:</strong> {new Date(batchDetails.distributedAt).toLocaleDateString('id-ID')}</p>
                </div>
                <div className="flex items-center">
                  <Package size={18} className="mr-2 text-blue-500" />
                  <p><strong className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Total Produk:</strong> {batchDetails.totalItems}</p>
                </div>
                <div className="flex items-center">
                  <Hash size={18} className="mr-2 text-blue-500" />
                  <p><strong className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Total Kuantitas:</strong> {batchDetails.totalQuantity?.toLocaleString('id-ID')}</p>
                </div>
                <div className="flex items-center">
                  <DollarSign size={18} className="mr-2 text-blue-500" />
                  <p><strong className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Total Jumlah:</strong> Rp {batchDetails.totalAmount?.toLocaleString('id-ID')}</p>
                </div>
                <div className="flex items-center">
                  <Truck size={18} className="mr-2 text-blue-500" />
                  <p><strong className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Toko Tujuan:</strong> {batchDetails.storeName || 'N/A'}</p>
                </div>
              </div>

              {/* Products in Batch */}
              <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Produk dalam Batch Ini</h3>
              <DataTable
                data={batchDetails.items.map(item => ({
                  ...item,
                  'product.name': item.product?.name,
                  'product.productCode': item.product?.productCode,
                  'product.purchasePrice': item.product?.purchasePrice,
                  'product.retailPrice': item.product?.retailPrice,
                  'product.silverPrice': item.product?.silverPrice,
                  'product.goldPrice': item.product?.goldPrice,
                  'product.platinumPrice': item.product?.platinumPrice
                }))}
                columns={productColumns}
                loading={false} // Loading state managed by the modal itself
                darkMode={darkMode}
                emptyMessage="Tidak ada produk dalam batch ini."
              />
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className={`flex justify-end p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} space-x-2`}>
          <button
            onClick={handleAcceptBatch}
            className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
          >
            <CheckCircle size={18} className="mr-2" /> Terima Batch
          </button>
          <button
            onClick={handleRejectBatch}
            className="flex items-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
          >
            <XCircle size={18} className="mr-2" /> Tolak Batch
          </button>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-md ${darkMode ? 'bg-gray-600 text-white hover:bg-gray-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Accept Confirmation Modal */}
      <ConfirmationModal
        isOpen={showAcceptConfirm}
        onClose={() => setShowAcceptConfirm(false)}
        onConfirm={confirmAcceptBatch}
        title="Konfirmasi Terima Batch Distribusi"
        message={
          <div>
            <p>Apakah Anda yakin ingin menerima semua produk dalam batch distribusi ini?</p>
            <div className="mt-3">
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Catatan (opsional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={`mt-1 block w-full rounded-md shadow-sm ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'border-gray-300 text-gray-900'
                }`}
                rows="3"
                placeholder="Tambahkan catatan tambahan..."
              />
            </div>
          </div>
        }
        confirmText="Terima"
        isLoading={isProcessing}
      />

      {/* Reject Confirmation Modal */}
      <ConfirmationModal
        isOpen={showRejectConfirm}
        onClose={() => setShowRejectConfirm(false)}
        onConfirm={confirmRejectBatch}
        title="Konfirmasi Tolak Batch Distribusi"
        message={
          <div>
            <p>Apakah Anda yakin ingin menolak semua produk dalam batch distribusi ini?</p>
            <div className="mt-3">
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Alasan Penolakan *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={`mt-1 block w-full rounded-md shadow-sm ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'border-gray-300 text-gray-900'
                }`}
                rows="3"
                placeholder="Masukkan alasan penolakan..."
                required
              />
            </div>
          </div>
        }
        confirmText="Tolak"
        isLoading={isProcessing}
      />
    </div>
  );
}
