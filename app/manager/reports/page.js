'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { ROLES } from '@/lib/constants';
import { 
  BarChart3, 
  FileText, 
  Download, 
  Calendar,
  TrendingUp,
  ShoppingCart,
  Users,
  DollarSign,
  Package
} from 'lucide-react';
import { useUserTheme } from '../../../components/UserThemeContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import SalesChart from '@/components/charts/SalesChart';

export default function CombinedReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    globalStats: {},
    salesData: [],
    storePerformance: [],
    recentTransactions: []
  });
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d, 365d
  const [reportType, setReportType] = useState('sales'); // sales, inventory, financial

  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
      router.push('/unauthorized');
      return;
    }

    fetchReportData();
  }, [status, session, router, timeRange, reportType]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reports/combined?timeRange=${timeRange}&type=${reportType}`);
      const data = await response.json();
      
      if (response.ok) {
        setReportData(data);
      } else {
        console.error('Error fetching report data:', data.error);
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
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

  // Contoh data untuk grafik - akan diganti dengan data dari API
  const salesData = [
    { name: 'Sen', sales: 4000, revenue: 4000000 },
    { name: 'Sel', sales: 3000, revenue: 3000000 },
    { name: 'Rab', sales: 2000, revenue: 2000000 },
    { name: 'Kam', sales: 2780, revenue: 2780000 },
    { name: 'Jum', sales: 1890, revenue: 1890000 },
    { name: 'Sab', sales: 2390, revenue: 2390000 },
    { name: 'Min', sales: 3490, revenue: 3490000 },
  ];

  const storePerformanceData = [
    { name: 'Toko Pusat', sales: 150, revenue: 15000000 },
    { name: 'Toko Barat', sales: 120, revenue: 12000000 },
    { name: 'Toko Timur', sales: 90, revenue: 9000000 },
    { name: 'Toko Selatan', sales: 80, revenue: 8000000 },
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const globalStats = {
    totalRevenue: 45000000,
    totalSales: 500,
    activeStores: 4,
    totalProducts: 127
  };

  if (loading) {
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Laporan Gabungan</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Laporan komprehensif dari semua toko Anda
        </p>
        
        {/* Time Range and Report Type Selector */}
        <div className="mt-4 flex flex-wrap gap-4">
          <div className="flex flex-wrap gap-2">
            {['7d', '30d', '90d', '365d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-lg transition-colors text-sm ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {range === '7d' ? '7 Hari' : 
                 range === '30d' ? '30 Hari' : 
                 range === '90d' ? '90 Hari' : '1 Tahun'}
              </button>
            ))}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {['sales', 'inventory', 'financial'].map((type) => (
              <button
                key={type}
                onClick={() => setReportType(type)}
                className={`px-3 py-1 rounded-lg transition-colors text-sm capitalize ${
                  reportType === type
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {type === 'sales' ? 'Penjualan' : 
                 type === 'inventory' ? 'Inventaris' : 'Keuangan'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                {formatCurrency(globalStats.totalRevenue)}
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
                {globalStats.totalSales}
              </p>
            </div>
          </div>
        </div>

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
              }`}>Jumlah Toko</h3>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {globalStats.activeStores}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-xl shadow ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
              <Package className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <h3 className={`text-lg font-medium ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>Produk Tersedia</h3>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {globalStats.totalProducts}
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
          <SalesChart 
            data={salesData} 
            chartType="line"
            xAxisKey="name"
            yAxisKeys={['sales']}
            labels={['Jumlah Transaksi']}
          />
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
            yAxisKeys={['revenue']}
            labels={['Pendapatan']}
          />
        </div>
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue by Store */}
        <div className={`p-6 rounded-xl shadow ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <h3 className={`text-lg font-medium mb-4 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Pendapatan per Toko
          </h3>
          <div className="space-y-4">
            {storePerformanceData.map((store, index) => (
              <div key={index}>
                <div className="flex justify-between mb-1">
                  <span className={`text-sm font-medium ${
                    darkMode ? 'text-white' : 'text-gray-700'
                  }`}>
                    {store.name}
                  </span>
                  <span className="text-sm font-medium">{formatCurrency(store.revenue)}</span>
                </div>
                <div className={`w-full bg-gray-200 rounded-full h-2.5 ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${(store.revenue / Math.max(...storePerformanceData.map(s => s.revenue))) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className={`p-6 rounded-xl shadow ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <h3 className={`text-lg font-medium mb-4 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Transaksi Terbaru
          </h3>
          <div className="space-y-4">
            {[
              { id: 'INV-001', store: 'Toko Pusat', amount: 250000, date: '2023-06-15' },
              { id: 'INV-002', store: 'Toko Barat', amount: 180000, date: '2023-06-15' },
              { id: 'INV-003', store: 'Toko Timur', amount: 320000, date: '2023-06-14' },
              { id: 'INV-004', store: 'Toko Selatan', amount: 150000, date: '2023-06-14' },
              { id: 'INV-005', store: 'Toko Pusat', amount: 450000, date: '2023-06-13' },
            ].map((transaction, index) => (
              <div key={index} className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <p className={`font-medium ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {transaction.id}
                  </p>
                  <p className={`text-sm ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {transaction.store}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {formatCurrency(transaction.amount)}
                  </p>
                  <p className={`text-sm ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {transaction.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            // Implementasi ekspor laporan
            alert('Fitur ekspor laporan akan segera tersedia');
          }}
          className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <Download className="h-5 w-5 mr-2" />
          Ekspor Laporan
        </button>
      </div>
    </div>
  );
}