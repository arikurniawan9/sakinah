'use client';

import { useState, useEffect } from 'react';
import { useUserTheme } from '../../../../components/UserThemeContext';
import { useSession } from 'next-auth/react';
import DataTable from '../../../../components/DataTable';
import Breadcrumb from '../../../../components/Breadcrumb';
import ConfirmationModal from '../../../../components/ConfirmationModal';
import { AlertTriangle, CheckCircle, XCircle, Package, Clock, Search } from 'lucide-react';

export default function PendingDistributions() {
  const { data: session } = useSession();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedDistribution, setSelectedDistribution] = useState(null);
  const [acceptReason, setAcceptReason] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pagination, setPagination] = useState({});

  // Fetch pending distributions
  useEffect(() => {
    fetchPendingDistributions();
  }, [currentPage, itemsPerPage, searchTerm]);

  const fetchPendingDistributions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const response = await fetch(`/api/admin/distributions/pending?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch pending distributions');
      }

      setDistributions(data.distributions);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = (distribution) => {
    setSelectedDistribution(distribution);
    setShowAcceptModal(true);
    setAcceptReason('');
  };

  const handleReject = (distribution) => {
    setSelectedDistribution(distribution);
    setShowRejectModal(true);
    setRejectReason('');
  };

  const confirmAccept = async () => {
    if (!selectedDistribution) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/distribution/accept', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          distributionId: selectedDistribution.id,
          reason: acceptReason
        })
      });

      const result = await response.json();

      if (response.ok) {
        setShowAcceptModal(false);
        setSelectedDistribution(null);
        fetchPendingDistributions(); // Refresh the list
      } else {
        throw new Error(result.error || 'Failed to accept distribution');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmReject = async () => {
    if (!selectedDistribution) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/distribution/accept', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          distributionId: selectedDistribution.id,
          reason: rejectReason
        })
      });

      const result = await response.json();

      if (response.ok) {
        setShowRejectModal(false);
        setSelectedDistribution(null);
        fetchPendingDistributions(); // Refresh the list
      } else {
        throw new Error(result.error || 'Failed to reject distribution');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const columns = [
    {
      key: 'no',
      title: 'No.',
      render: (_, __, index) => (currentPage - 1) * itemsPerPage + index + 1,
    },
    { key: 'product.name', title: 'Nama Produk', sortable: true },
    { key: 'product.productCode', title: 'Kode Produk', sortable: true },
    { 
      key: 'quantity', 
      title: 'Jumlah', 
      render: (value) => value.toLocaleString('id-ID'),
      sortable: true 
    },
    { 
      key: 'unitPrice', 
      title: 'Harga Satuan', 
      render: (value) => `Rp ${value.toLocaleString('id-ID')}`,
      sortable: true 
    },
    { 
      key: 'totalAmount', 
      title: 'Total', 
      render: (value) => `Rp ${value.toLocaleString('id-ID')}`,
      sortable: true 
    },
    { 
      key: 'distributedByUser.name', 
      title: 'Dikirim Oleh', 
      sortable: true 
    },
    {
      key: 'distributedAt',
      title: 'Tanggal Distribusi',
      render: (value) => new Date(value).toLocaleDateString('id-ID'),
      sortable: true
    },
  ];

  const renderRowActions = (row) => (
    <div className="flex space-x-2">
      <button
        onClick={() => handleAccept(row)}
        className="p-2 text-green-500 hover:text-green-700 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30"
        title="Terima Distribusi"
      >
        <CheckCircle size={20} />
      </button>
      <button
        onClick={() => handleReject(row)}
        className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30"
        title="Tolak Distribusi"
      >
        <XCircle size={20} />
      </button>
    </div>
  );

  const paginationData = {
    currentPage: pagination.currentPage || 1,
    totalPages: pagination.totalPages || 1,
    totalItems: pagination.total || 0,
    startIndex: pagination.startIndex || 1,
    endIndex: pagination.endIndex || 0,
    onPageChange: setCurrentPage,
    itemsPerPage: itemsPerPage
  };

  const statusCardData = [
    {
      title: "Distribusi Menunggu",
      value: pagination.total || 0,
      icon: Clock,
      color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    },
  ];

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
          { title: 'Admin', href: '/admin' },
          { title: 'Distribusi Menunggu', href: '/admin/distributions/pending' }
        ]}
        darkMode={darkMode}
      />

      <div className="mb-6">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Distribusi Menunggu Konfirmasi
        </h1>
        <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Daftar distribusi dari gudang pusat yang menunggu konfirmasi dari admin toko
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statusCardData.map((card, index) => (
          <div
            key={index}
            className={`rounded-xl shadow-lg p-6 flex items-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
          >
            <div className={`p-3 rounded-full ${card.color}`}>
              <card.icon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {card.title}
              </p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Data Table */}
      <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
        <DataTable
          data={distributions}
          columns={columns}
          loading={loading}
          onSearch={setSearchTerm}
          onItemsPerPageChange={setItemsPerPage}
          darkMode={darkMode}
          pagination={paginationData}
          mobileColumns={['product.name', 'quantity', 'totalAmount']}
          rowActions={renderRowActions}
          emptyMessage="Tidak ada distribusi menunggu konfirmasi"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 rounded-lg bg-red-100 border border-red-400 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Accept Confirmation Modal */}
      <ConfirmationModal
        isOpen={showAcceptModal}
        onClose={() => {
          setShowAcceptModal(false);
          setSelectedDistribution(null);
          setAcceptReason('');
        }}
        onConfirm={confirmAccept}
        title="Konfirmasi Terima Distribusi"
        message={
          selectedDistribution ? (
            <div>
              <p>Apakah Anda yakin ingin menerima distribusi berikut?</p>
              <div className={`mt-4 p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p><strong>Produk:</strong> {selectedDistribution.product?.name}</p>
                <p><strong>Kode Produk:</strong> {selectedDistribution.product?.productCode}</p>
                <p><strong>Jumlah:</strong> {selectedDistribution.quantity?.toLocaleString('id-ID')}</p>
                <p><strong>Dikirim oleh:</strong> {selectedDistribution.distributedByUser?.name}</p>
                <p><strong>Tanggal:</strong> {new Date(selectedDistribution.distributedAt).toLocaleDateString('id-ID')}</p>
              </div>

              {acceptReason && (
                <div className="mt-3">
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Catatan (opsional)
                  </label>
                  <textarea
                    value={acceptReason}
                    onChange={(e) => setAcceptReason(e.target.value)}
                    className={`mt-1 block w-full rounded-md shadow-sm ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'border-gray-300 text-gray-900'
                    }`}
                    rows="3"
                    placeholder="Tambahkan catatan tambahan..."
                  />
                </div>
              )}
            </div>
          ) : null
        }
        confirmText="Terima"
        isLoading={isProcessing}
      />

      {/* Reject Confirmation Modal */}
      <ConfirmationModal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedDistribution(null);
          setRejectReason('');
        }}
        onConfirm={confirmReject}
        title="Konfirmasi Tolak Distribusi"
        message={
          selectedDistribution ? (
            <div>
              <p>Apakah Anda yakin ingin menolak distribusi berikut?</p>
              <div className={`mt-4 p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p><strong>Produk:</strong> {selectedDistribution.product?.name}</p>
                <p><strong>Kode Produk:</strong> {selectedDistribution.product?.productCode}</p>
                <p><strong>Jumlah:</strong> {selectedDistribution.quantity?.toLocaleString('id-ID')}</p>
                <p><strong>Dikirim oleh:</strong> {selectedDistribution.distributedByUser?.name}</p>
                <p><strong>Tanggal:</strong> {new Date(selectedDistribution.distributedAt).toLocaleDateString('id-ID')}</p>
              </div>

              <div className="mt-3">
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Alasan Penolakan *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
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
          ) : null
        }
        confirmText="Tolak"
        isLoading={isProcessing}
      />
    </main>
  );
}