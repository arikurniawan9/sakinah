'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useUserTheme } from '../../../components/UserThemeContext';
import Breadcrumb from '../../../components/Breadcrumb';
import { Package, Users, Clock, CheckCircle, XCircle, AlertTriangle, Download, Printer } from 'lucide-react';
import { toast } from 'react-toastify';

const formatNumber = (value) => {
  return new Intl.NumberFormat('id-ID').format(value);
};

export default function DistributionNotificationsPage() {
  const { data: session, status } = useSession();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;

  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch pending distributions for this store
  useEffect(() => {
    const fetchPendingDistributions = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(`/api/warehouse/distribution?storeId=${session?.user?.storeId}&status=PENDING_ACCEPTANCE`);

        if (!response.ok) {
          throw new Error('Gagal mengambil data distribusi pending');
        }

        const data = await response.json();
        setDistributions(data.distributions || []);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching pending distributions:', err);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.storeId) {
      fetchPendingDistributions();
    }
  }, [session?.user?.storeId]);

  const handleAcceptDistribution = async (distributionId) => {
    try {
      const response = await fetch(`/api/warehouse/distribution/${distributionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'ACCEPTED',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menerima distribusi');
      }

      const result = await response.json();
      toast.success('Distribusi diterima dan stok toko telah diperbarui');
      
      // Refresh the list
      setDistributions(distributions.filter(d => d.id !== distributionId));
    } catch (err) {
      toast.error('Error: ' + err.message);
      console.error('Error accepting distribution:', err);
    }
  };

  const handleRejectDistribution = async (distributionId) => {
    try {
      const response = await fetch(`/api/warehouse/distribution/${distributionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'REJECTED',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menolak distribusi');
      }

      const result = await response.json();
      toast.success('Distribusi ditolak');

      // Refresh the list
      setDistributions(distributions.filter(d => d.id !== distributionId));
    } catch (err) {
      toast.error('Error: ' + err.message);
      console.error('Error rejecting distribution:', err);
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 inline-flex text-xs leading-5 font-semibold rounded-full";

    switch (status) {
      case 'PENDING_ACCEPTANCE':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400`;
      case 'ACCEPTED':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400`;
      case 'REJECTED':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300`;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING_ACCEPTANCE':
        return <Clock className="h-4 w-4" />;
      case 'ACCEPTED':
        return <CheckCircle className="h-4 w-4" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING_ACCEPTANCE':
        return 'Menunggu Konfirmasi';
      case 'ACCEPTED':
        return 'Diterima';
      case 'REJECTED':
        return 'Ditolak';
      default:
        return status;
    }
  };

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/admin' },
    { title: 'Notifikasi Distribusi', href: '/admin/distribution-notifications' }
  ];

  return (
    <ProtectedRoute requiredRole={['ADMIN', 'MANAGER', 'CASHIER', 'ATTENDANT']}>
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={breadcrumbItems} darkMode={darkMode} />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Notifikasi Distribusi dari Gudang
          </h1>
        </div>

        {loading && (
          <div className={`rounded-xl shadow ${darkMode ? 'bg-gray-800' : 'bg-white'} p-8`}>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className={`rounded-xl shadow ${darkMode ? 'bg-gray-800' : 'bg-white'} p-8`}>
            <div className="text-center text-red-500">{error}</div>
          </div>
        )}

        {!loading && !error && (
          <div className={`rounded-xl shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {distributions.length === 0 ? (
              <div className="p-8 text-center">
                <Package className={`h-12 w-12 mx-auto ${darkMode ? 'text-gray-400' : 'text-gray-300'}`} />
                <h3 className={`mt-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                  Tidak ada distribusi pending
                </h3>
                <p className={`mt-1 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Tidak ada permintaan distribusi dari gudang saat ini.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Produk
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Jumlah
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Dikirim Oleh
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Tanggal
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Status
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {distributions.map((distribution) => (
                      <tr key={distribution.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          <div className="flex items-center">
                            <Package className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                            <span>{distribution.product?.name || 'N/A'}</span>
                          </div>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          {formatNumber(distribution.quantity || 0)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          {distribution.distributedByUser?.name || 'Gudang'}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {distribution.distributedAt ? new Date(distribution.distributedAt).toLocaleDateString('id-ID') : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center">
                            {getStatusIcon(distribution.status)}
                            <span className={`ml-2 ${getStatusBadge(distribution.status)}`}>
                              {getStatusText(distribution.status)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleAcceptDistribution(distribution.id)}
                              className="px-3 py-1 rounded-md text-xs font-medium text-white bg-green-600 hover:bg-green-700"
                            >
                              Terima
                            </button>
                            <button
                              onClick={() => handleRejectDistribution(distribution.id)}
                              className="px-3 py-1 rounded-md text-xs font-medium text-white bg-red-600 hover:bg-red-700"
                            >
                              Tolak
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}