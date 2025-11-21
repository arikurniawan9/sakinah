'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { ROLES } from '@/lib/constants';
import { 
  BarChart3, 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  Users, 
  AlertTriangle,
  Store,
  DollarSign,
  Clock
} from 'lucide-react';
import { useUserTheme } from '../../../components/UserThemeContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import SalesChart from '@/components/charts/SalesChart';

export default function MonitorAllStoresPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const [loading, setLoading] = useState(true);
  const [storesData, setStoresData] = useState([]);
  const [globalStats, setGlobalStats] = useState({
    totalStores: 0,
    totalSales: 0,
    totalRevenue: 0,
    totalActiveStores: 0
  });
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d

  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
      router.push('/unauthorized');
      return;
    }

    fetchMonitorData();
  }, [status, session, router, timeRange]);

  const fetchMonitorData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/monitor-all-stores?timeRange=${timeRange}`);
      const data = await response.json();
      
      if (response.ok) {
        setStoresData(data.stores || []);
        setGlobalStats(data.globalStats || {});
      } else {
        console.error('Error fetching monitor data:', data.error);
      }
    } catch (error) {
      console.error('Error fetching monitor data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Hydration-safe loading and authentication checks
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
    router.push('/unauthorized');
    return null;
  }

  // Contoh data untuk grafik penjualan keseluruhan
  const salesData = [
    { name: 'Sen', sales: 4000 },
    { name: 'Sel', sales: 3000 },
    { name: 'Rab', sales: 2000 },
    { name: 'Kam', sales: 2780 },
    { name: 'Jum', sales: 1890 },
    { name: 'Sab', sales: 2390 },
    { name: 'Min', sales: 3490 },
  ];

  // Contoh data untuk grafik per toko
  const storePerformanceData = storesData.map(store => ({
    name: store.name,
    sales: store.dailySales || 0,
    revenue: store.dailyRevenue || 0
  }));

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading && storesData.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Monitor Semua Toko</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Pantau aktivitas dan performa semua toko Anda secara real-time
        </p>
        
        {/* Time Range Selector */}
        <div className="mt-4 flex space-x-2">
          {['7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {range === '7d' ? '7 Hari' : range === '30d' ? '30 Hari' : '90 Hari'}
            </button>
          ))}
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className={`p-6 rounded-xl shadow ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Store className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <h3 className={`text-lg font-medium ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>Total Toko</h3>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {globalStats.totalStores || 0}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-xl shadow ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
              <ShoppingCart className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <h3 className={`text-lg font-medium ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>Total Transaksi</h3>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {globalStats.totalSales || 0}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-xl shadow ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
              <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <h3 className={`text-lg font-medium ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>Total Pendapatan</h3>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(globalStats.totalRevenue || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-xl shadow ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
              <Users className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <h3 className={`text-lg font-medium ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>Toko Aktif</h3>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {globalStats.totalActiveStores || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Overall Sales Chart */}
        <div className={`p-6 rounded-xl shadow ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <h3 className={`text-lg font-medium mb-4 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Grafik Penjualan Keseluruhan
          </h3>
          <SalesChart data={salesData} />
        </div>

        {/* Store Performance Chart */}
        <div className={`p-6 rounded-xl shadow ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <h3 className={`text-lg font-medium mb-4 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Performa Per Toko
          </h3>
          <SalesChart 
            data={storePerformanceData} 
            chartType="bar"
            xAxisKey="name"
            yAxisKeys={['sales']}
            labels={['Penjualan']}
          />
        </div>
      </div>

      {/* Store List */}
      <div className={`rounded-xl shadow ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className={`text-lg font-medium ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Daftar Toko
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Toko
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Penjualan Hari Ini
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Pendapatan Hari Ini
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Stok Rendah
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              {storesData.length > 0 ? (
                storesData.map((store, index) => (
                  <tr key={store.id} className={index % 2 === 0 ? (darkMode ? 'bg-gray-800' : 'bg-white') : (darkMode ? 'bg-gray-700' : 'bg-gray-50')}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <Store className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="ml-4">
                          <div className={`text-sm font-medium ${
                            darkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {store.name}
                          </div>
                          <div className={`text-sm ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {store.address}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${store.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'}`}>
                        {store.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {store.dailySales || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatCurrency(store.dailyRevenue || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {store.lowStockCount > 0 ? (
                        <span className="text-yellow-600 dark:text-yellow-400">
                          <AlertTriangle className="h-4 w-4 inline mr-1" />
                          {store.lowStockCount}
                        </span>
                      ) : (
                        <span className="text-green-600 dark:text-green-400">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => router.push(`/manager/edit-store/${store.id}`)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                      >
                        Detail
                      </button>
                      <button
                        onClick={() => router.push(`/admin?storeId=${store.id}`)}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                      >
                        Akses
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm">
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                      Tidak ada data toko
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}