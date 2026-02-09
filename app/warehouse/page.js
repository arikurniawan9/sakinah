'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { subDays } from 'date-fns';

import ProtectedRoute from '../../components/ProtectedRoute';
import { useUserTheme } from '../../components/UserThemeContext';
import Breadcrumb from '../../components/Breadcrumb';
import StatCard from '../../components/warehouse/StatCard';
import { formatNumber } from '../../lib/utils';
import { useWarehouseStats, useRecentDistributions } from '../../lib/hooks/useWarehouseData';
import {
  Package,
  Users,
  Move3D,
  CalendarIcon,
  Clock,
  TrendingUp,
  Truck,
  Warehouse,
  ShoppingCart
} from 'lucide-react';

export default function WarehouseDashboard() {
  const { data: session } = useSession();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;

  const [startDate, setStartDate] = useState(subDays(new Date(), 6));
  const [endDate, setEndDate] = useState(new Date());
  const [dateError, setDateError] = useState('');

  // SWR hooks for data fetching
  const { stats, isLoading: isLoadingStats, isError: isErrorStats } = useWarehouseStats();
  const { distributions, isLoading: isLoadingDists, isError: isErrorDists } = useRecentDistributions(startDate, endDate);

  const isLoading = isLoadingStats || isLoadingDists;

  // Validate date range
  useEffect(() => {
    if (startDate && endDate && startDate > endDate) {
      setDateError('Tanggal mulai tidak boleh lebih besar dari tanggal akhir');
    } else {
      setDateError('');
    }
  }, [startDate, endDate]);

  const breadcrumbItems = [{ title: 'Dashboard Gudang', href: '/warehouse' }];

  const renderLoadingSkeleton = () => (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={breadcrumbItems} darkMode={darkMode} />

      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className={`h-8 w-64 bg-gray-300 dark:bg-gray-700 rounded mb-2 animate-pulse`}></div>
            <div className={`h-4 w-48 bg-gray-200 dark:bg-gray-600 rounded animate-pulse`}></div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`h-10 w-32 bg-gray-300 dark:bg-gray-700 rounded animate-pulse`}></div>
            <div className={`h-10 w-32 bg-gray-300 dark:bg-gray-700 rounded animate-pulse`}></div>
          </div>
        </div>
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`p-6 rounded-2xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} animate-pulse`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
              <div className="h-12 w-12 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent distributions skeleton */}
      <div className={`rounded-2xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} p-6`}>
        <div className="flex justify-between items-center mb-6">
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-40"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 animate-pulse">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
              <div className="w-16 h-6 bg-gray-300 dark:bg-gray-700 rounded"></div>
              <div className="w-16 h-6 bg-gray-300 dark:bg-gray-700 rounded"></div>
              <div className="w-20 h-6 bg-gray-300 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );

  if (isLoading && !stats) {
    return (
      <ProtectedRoute requiredRole={['WAREHOUSE', 'MANAGER']}>
        {renderLoadingSkeleton()}
      </ProtectedRoute>
    );
  }

  if (isErrorStats || isErrorDists) {
    return (
      <ProtectedRoute requiredRole={['WAREHOUSE', 'MANAGER']}>
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb items={breadcrumbItems} darkMode={darkMode} />
          <div className={`p-6 rounded-2xl shadow-lg ${darkMode ? 'bg-red-900/30 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center">
              <div className={`mr-4 flex-shrink-0 h-10 w-10 rounded-full ${darkMode ? 'bg-red-900/50' : 'bg-red-100'} flex items-center justify-center`}>
                <svg className={`h-6 w-6 ${darkMode ? 'text-red-400' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className={`text-lg font-medium ${darkMode ? 'text-red-400' : 'text-red-800'}`}>Gagal memuat data</h3>
                <p className={`mt-1 ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
                  Terjadi kesalahan saat mengambil data dasbor. Silakan coba lagi nanti.
                </p>
              </div>
            </div>
          </div>
        </main>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole={['WAREHOUSE', 'MANAGER']}>
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={breadcrumbItems} darkMode={darkMode} />

        {/* Header and Date Picker */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Dasbor Gudang
              </h2>
              <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Pantau dan kelola distribusi produk ke seluruh toko
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-1">
                <CalendarIcon className={`h-5 w-5 mx-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  className={`p-2 rounded-md border-0 outline-none w-32 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                  dateFormat="dd/MM/yyyy"
                />
                <span className={`mx-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>-</span>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  className={`p-2 rounded-md border-0 outline-none w-32 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                  dateFormat="dd/MM/yyyy"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Date Error Message */}
        {dateError && (
          <div className={`mb-6 p-4 rounded-xl ${darkMode ? 'bg-red-900/30 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center">
              <svg className={`h-5 w-5 mr-2 ${darkMode ? 'text-red-400' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={darkMode ? 'text-red-400' : 'text-red-700'}>{dateError}</span>
            </div>
          </div>
        )}

        {/* System Summary */}
        <div className="mb-8">
          <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-6`}>Ringkasan Sistem Gudang</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Produk Unik"
              value={stats?.totalUniqueProductsInWarehouse}
              icon={Package}
              darkMode={darkMode}
              href="/warehouse/products"
              loading={isLoading}
              color="from-blue-500 to-blue-600"
            />
            <StatCard
              title="Toko Terhubung"
              value={stats?.totalStoresLinked}
              icon={Users}
              darkMode={darkMode}
              href="/warehouse/stores"
              loading={isLoading}
              color="from-green-500 to-green-600"
            />
            <StatCard
              title="Distribusi Belum Dikonfirmasi"
              value={stats?.pendingDistributions}
              icon={Clock}
              darkMode={darkMode}
              href="/warehouse/distribution/history"
              loading={isLoading}
              warning={stats?.pendingDistributions > 0}
              color="from-yellow-500 to-yellow-600"
            />
            <StatCard
              title="Total Didistribusi"
              value={stats?.totalDistributed}
              icon={Move3D}
              darkMode={darkMode}
              href="/warehouse/distribution/history"
              loading={isLoading}
              color="from-purple-500 to-purple-600"
            />
          </div>
        </div>

        {/* Recent Distributions */}
        <div className={`rounded-2xl shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className={`p-6 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Distribusi Terbaru
              </h2>
              <a
                href="/warehouse/distribution/history"
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  darkMode
                    ? 'text-blue-400 hover:text-blue-300 bg-gray-700 hover:bg-gray-600'
                    : 'text-blue-600 hover:text-blue-800 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Lihat Semua Distribusi
                <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 animate-pulse">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                    <div className="w-16 h-6 bg-gray-300 dark:bg-gray-700 rounded"></div>
                    <div className="w-16 h-6 bg-gray-300 dark:bg-gray-700 rounded"></div>
                    <div className="w-20 h-6 bg-gray-300 dark:bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            ) : distributions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Produk
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Toko Tujuan
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Jumlah
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Status
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Tanggal
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {distributions.map((distribution) => (
                      <tr key={distribution.id} className={`hover:${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'} transition-colors`}>
                        <td className={`px-4 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-md bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                              {distribution.product?.name.charAt(0).toUpperCase() || 'N'}
                            </div>
                            <div className="ml-4">
                              <div className="font-medium">{distribution.product?.name || 'N/A'}</div>
                              <div className="text-gray-500 dark:text-gray-400 text-xs">{distribution.productId}</div>
                            </div>
                          </div>
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
                              {distribution.store?.name.charAt(0).toUpperCase() || 'N'}
                            </div>
                            <div className="ml-3">
                              <div>{distribution.store?.name || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          {distribution.quantity?.toLocaleString('id-ID') || 0}
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap text-sm`}>
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            distribution.status === 'DELIVERED' || distribution.status === 'ACCEPTED'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : distribution.status === 'PENDING_ACCEPTANCE'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : distribution.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                          }`}>
                            {distribution.status === 'PENDING_ACCEPTANCE' ? 'Menunggu Konfirmasi' :
                             distribution.status === 'ACCEPTED' ? 'Diterima' :
                             distribution.status === 'REJECTED' ? 'Ditolak' :
                             distribution.status}
                          </span>
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {new Date(distribution.distributedAt).toLocaleDateString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={`text-center py-12 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full">
                    <Truck className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                  </div>
                </div>
                <h3 className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'} mb-1`}>
                  Tidak ada distribusi terbaru
                </h3>
                <p className="text-sm">
                  Distribusi yang baru akan muncul di sini
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}