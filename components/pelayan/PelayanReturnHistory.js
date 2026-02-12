// components/pelayan/PelayanReturnHistory.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Search, Calendar, PackageX, User, Clock, CheckCircle, XCircle, AlertCircle, Package, Eye } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';
import Link from 'next/link';

const PelayanReturnHistory = ({ darkMode, attendantId, onDataLoad }) => {
  const { data: session } = useSession();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchReturnHistory = useCallback(async () => {
    if (!attendantId) return;

    setLoading(true);
    setError(null);
    try {
      // Ambil semua retur produk yang dibuat oleh pelayan ini
      const url = `/api/return-products?userId=${attendantId}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Gagal memuat histori retur produk');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setReturns(data.data || []);
        if (onDataLoad) {
          onDataLoad(data.data || []); // Callback untuk memberi tahu parent komponen tentang data
        }
      } else {
        throw new Error(data.message || 'Gagal memuat histori retur produk');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching return history:', err);
    } finally {
      setLoading(false);
    }
  }, [attendantId, onDataLoad]);

  useEffect(() => {
    fetchReturnHistory();
  }, [fetchReturnHistory]);

  // Filter data berdasarkan pencarian dan filter
  const filteredReturns = returns.filter(item => {
    const matchesSearch = !searchTerm ||
      (item.product?.name && item.product.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.transactionId && item.transactionId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.reason && item.reason.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDate = !dateFilter ||
      new Date(item.createdAt).toDateString() === new Date(dateFilter).toDateString();

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'PENDING' && item.status === 'PENDING') ||
      (statusFilter === 'APPROVED' && item.status === 'APPROVED') ||
      (statusFilter === 'REJECTED' && item.status === 'REJECTED');

    return matchesSearch && matchesDate && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'Disetujui';
      case 'REJECTED':
        return 'Ditolak';
      case 'PENDING':
        return 'Menunggu';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-red-900/30 text-red-200' : 'bg-red-50 text-red-700'}`}>
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari produk, transaksi, atau alasan..."
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-600 border-gray-500 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="date"
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-600 border-gray-500 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>

          <select
            className={`w-full px-4 py-2 rounded-lg border ${
              darkMode
                ? 'bg-gray-600 border-gray-500 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Semua Status</option>
            <option value="PENDING">Menunggu</option>
            <option value="APPROVED">Disetujui</option>
            <option value="REJECTED">Ditolak</option>
          </select>
        </div>
      </div>

      {/* Return History List */}
      <div className="space-y-4">
        {filteredReturns.length === 0 ? (
          <div className={`text-center py-12 rounded-xl ${
            darkMode ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <PackageX className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className={`text-lg font-medium ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Tidak ada histori retur produk
            </h3>
            <p className={`mt-1 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {searchTerm || dateFilter || statusFilter !== 'all'
                ? 'Tidak ditemukan histori dengan filter yang dipilih'
                : 'Belum ada permintaan retur produk yang diajukan'}
            </p>
          </div>
        ) : (
          filteredReturns.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                darkMode
                  ? 'bg-gray-800 border-gray-700 hover:bg-gray-750'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className={`font-semibold ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {item.product?.name || item.productName || 'Produk tidak dikenali'}
                    </h3>
                    <span className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {getStatusIcon(item.status)}
                      <span className="ml-1">{getStatusLabel(item.status)}</span>
                    </span>
                  </div>

                  <div className="flex items-center text-sm mb-1">
                    <Package className="h-4 w-4 mr-2 text-gray-400" />
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                      Transaksi: {item.transactionId}
                    </span>
                  </div>

                  <div className="flex items-center text-sm mb-1">
                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                      {formatDate(item.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center text-sm mb-2">
                    <User className="h-4 w-4 mr-2 text-gray-400" />
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                      Kategori: {item.category === 'PRODUCT_DEFECT' ? 'Produk Cacat' : 
                                item.category === 'WRONG_SELECTION' ? 'Salah Pilih' : 
                                item.category === 'ERROR_BY_ATTENDANT' ? 'Kesalahan Pelayan' : 
                                'Lainnya'}
                    </span>
                  </div>

                  <div className={`text-sm p-2 rounded ${
                    darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <span className="font-medium">Alasan:</span> {item.reason}
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  <Link href={`/pelayan/retur-produk/${item.id}`} className="self-end">
                    <button
                      className={`p-2 rounded-lg text-sm font-medium flex items-center ${
                        darkMode
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Lihat
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PelayanReturnHistory;