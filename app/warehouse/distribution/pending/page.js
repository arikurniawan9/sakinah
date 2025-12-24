'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import { useUserTheme } from '../../../../components/UserThemeContext';
import Breadcrumb from '../../../../components/Breadcrumb';
import {
  Package,
  PackagePlus,
  Users,
  AlertTriangle,
  TrendingUp,
  Move3D,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Download
} from 'lucide-react';
import Link from 'next/link';

export default function PendingDistributionsPage() {
  const { data: session } = useSession();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({});

  // Fetch pending distributions
  useEffect(() => {
    const fetchDistributions = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          status: 'PENDING_ACCEPTANCE',
          page: currentPage,
          limit: 10,
          search: searchTerm
        });
        
        const response = await fetch(`/api/warehouse/distribution?${params}`);
        
        if (response.ok) {
          const data = await response.json();
          setDistributions(data.distributions || []);
          setTotalPages(data.pagination?.totalPages || 1);
        }
      } catch (error) {
        console.error('Error fetching pending distributions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDistributions();
  }, [currentPage, searchTerm]);

  const breadcrumbItems = [
    { title: 'Dashboard Gudang', href: '/warehouse' },
    { title: 'Distribusi ke Toko', href: '/warehouse/distribution' },
    { title: 'Distribusi Tertunda', href: '/warehouse/distribution/pending' }
  ];

  const handleRefresh = () => {
    const fetchDistributions = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          status: 'PENDING_ACCEPTANCE',
          page: currentPage,
          limit: 10,
          search: searchTerm
        });
        
        const response = await fetch(`/api/warehouse/distribution?${params}`);
        
        if (response.ok) {
          const data = await response.json();
          setDistributions(data.distributions || []);
          setTotalPages(data.pagination?.totalPages || 1);
        }
      } catch (error) {
        console.error('Error fetching pending distributions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDistributions();
  };

  const handleAccept = async (distributionId) => {
    try {
      const response = await fetch(`/api/warehouse/distribution/${distributionId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accepted: true }),
      });

      if (response.ok) {
        handleRefresh(); // Refresh the list
      }
    } catch (error) {
      console.error('Error accepting distribution:', error);
    }
  };

  const handleReject = async (distributionId) => {
    try {
      const response = await fetch(`/api/warehouse/distribution/${distributionId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejected: true }),
      });

      if (response.ok) {
        handleRefresh(); // Refresh the list
      }
    } catch (error) {
      console.error('Error rejecting distribution:', error);
    }
  };

  // Filter distributions based on search term
  const filteredDistributions = distributions.filter(distribution => 
    distribution.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    distribution.store?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    distribution.distributor?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute requiredRole="WAREHOUSE">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={breadcrumbItems} darkMode={darkMode} />

        <div className="mb-6">
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Distribusi Tertunda
          </h1>
          <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Daftar distribusi yang menunggu konfirmasi dari toko
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder="Cari produk atau toko..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 pr-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <button
              onClick={handleRefresh}
              className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              <RefreshCw className={`h-5 w-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </button>
          </div>
          
          <div className="flex space-x-2">
            <Link 
              href="/warehouse/distribution" 
              className={`px-4 py-2 rounded-lg flex items-center ${
                darkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <TrendingUp className="h-5 w-5 mr-2" />
              Buat Distribusi
            </Link>
          </div>
        </div>

        {/* Pending Distributions Table */}
        <div className={`rounded-xl shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className={`mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Memuat distribusi tertunda...</p>
            </div>
          ) : filteredDistributions.length === 0 ? (
            <div className="p-8 text-center">
              <Package className={`h-12 w-12 mx-auto ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <h3 className={`mt-4 text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Tidak ada distribusi tertunda
              </h3>
              <p className={`mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                Tidak ada distribusi yang saat ini menunggu konfirmasi dari toko.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Produk
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Toko Tujuan
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Jumlah
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Tanggal Distribusi
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Distributor
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {filteredDistributions.map((distribution) => (
                      <tr key={distribution.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          {distribution.product?.name || 'N/A'}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          {distribution.store?.name || 'N/A'}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          {distribution.quantity?.toLocaleString('id-ID') || 0}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {new Date(distribution.distributedAt).toLocaleDateString('id-ID')}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          {distribution.distributor || session?.user?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleAccept(distribution.id)}
                              className="p-2 rounded-lg bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-800/50"
                              title="Terima Distribusi"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleReject(distribution.id)}
                              className="p-2 rounded-lg bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-800/50"
                              title="Tolak Distribusi"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Menampilkan {(currentPage - 1) * 10 + 1} - {Math.min(currentPage * 10, distributions.length)} dari {distributions.length} distribusi
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded ${
                          currentPage === 1
                            ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                            : `bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600`
                        }`}
                      >
                        Sebelumnya
                      </button>
                      <span className={`px-3 py-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {currentPage} dari {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded ${
                          currentPage === totalPages
                            ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                            : `bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600`
                        }`}
                      >
                        Berikutnya
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}