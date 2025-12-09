'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useUserTheme } from '../../components/UserThemeContext';
import { useSession } from 'next-auth/react';
import Breadcrumb from '../../components/Breadcrumb';
import {
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  AlertTriangle,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  Plus,
  PackagePlus,
  Move3D
} from 'lucide-react';

export default function WarehouseDashboard() {
  const { data: session } = useSession();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const [stats, setStats] = useState({
    totalUniqueProductsInWarehouse: 0,
    totalQuantityInWarehouse: 0,
    totalStoresLinked: 0,
    pendingDistributions: 0,
    lowStockItems: 0,
    totalDistributed: 0,
  });
  const [recentDistributions, setRecentDistributions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch warehouse statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/warehouse/stats');
        
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching warehouse stats:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchRecentDistributions = async () => {
      try {
        const response = await fetch('/api/warehouse/distribution?limit=5');
        
        if (response.ok) {
          const data = await response.json();
          setRecentDistributions(data.distributions || []);
        }
      } catch (error) {
        console.error('Error fetching recent distributions:', error);
      }
    };

    fetchStats();
    fetchRecentDistributions();
  }, []);

  const statusCardData = [
    {
      title: "Total Produk",
      value: stats.totalUniqueProductsInWarehouse,
      description: "Produk unik di gudang",
      icon: Package,
      color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    },
    {
      title: "Total Stok",
      value: stats.totalQuantityInWarehouse,
      description: "Jumlah keseluruhan barang",
      icon: PackagePlus,
      color: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    },
    {
      title: "Toko Terhubung",
      value: stats.totalStoresLinked,
      description: "Jumlah toko yang bisa didistribusi",
      icon: Users,
      color: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    },
    {
      title: "Distribusi Tertunda",
      value: stats.pendingDistributions,
      description: "Menunggu konfirmasi toko",
      icon: Clock,
      color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
    },
    {
      title: "Item Stok Rendah",
      value: stats.lowStockItems,
      description: "Produk perlu restock",
      icon: AlertTriangle,
      color: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    },
    {
      title: "Total Didistribusi",
      value: stats.totalDistributed,
      description: "Barang yang sudah didistribusi",
      icon: Move3D,
      color: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
    },
  ];

  const quickActions = [
    {
      title: "Pembelian Gudang",
      description: "Tambahkan produk baru ke gudang",
      href: "/warehouse/purchase",
      icon: ShoppingCart,
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      title: "Stok Gudang",
      description: "Lihat dan kelola stok produk",
      href: "/warehouse/stock",
      icon: Package,
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      title: "Distribusi ke Toko",
      description: "Distribusikan produk ke toko",
      href: "/warehouse/distribution",
      icon: TrendingUp,
      color: "bg-purple-600 hover:bg-purple-700",
    },
  ];

  return (
    <ProtectedRoute requiredRole="WAREHOUSE">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb
          items={[{ title: 'Dashboard Gudang', href: '/warehouse' }]}
          darkMode={darkMode}
        />

        <div className="mb-6">
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Dashboard Gudang
          </h1>
          <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Overview manajemen gudang pusat
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
                  {card.value?.toLocaleString('id-ID') || 0}
                </p>
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Akses Cepat
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <a
                key={index}
                href={action.href}
                className={`p-6 rounded-xl shadow-lg flex items-center justify-between transition-transform duration-200 hover:scale-[1.02] ${
                  darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
                }`}
              >
                <div>
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg ${action.color} text-white`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <h3 className={`ml-3 text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {action.title}
                    </h3>
                  </div>
                  <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {action.description}
                  </p>
                </div>
                <ArrowRight className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </a>
            ))}
          </div>
        </div>

        {/* Recent Distributions */}
        <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Distribusi Terbaru
            </h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : recentDistributions.length > 0 ? (
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
                    {recentDistributions.map((distribution) => (
                      <tr key={distribution.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className={`px-4 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          {distribution.product?.name || 'N/A'}
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          {distribution.store?.name || 'N/A'}
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          {distribution.quantity?.toLocaleString('id-ID') || 0}
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap text-sm`}>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
              <div className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                Tidak ada distribusi terbaru
              </div>
            )}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}