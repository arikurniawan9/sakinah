// app/pelayan/statistik/history/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useUserTheme } from '../../../../components/UserThemeContext';
import { Search, Calendar, User, Package, Clock, CheckCircle, XCircle, AlertCircle, BarChart3, History, TrendingUp } from 'lucide-react';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import PelayanHistory from '../../../../components/pelayan/PelayanHistory';

export default function PelayanHistoryPage() {
  const { data: session } = useSession();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    customers: 0
  });
  const [historyData, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAllData = useCallback(async () => {
    if (!session?.user?.id || !session?.user?.storeId) return;

    setLoading(true);
    try {
      // 1. Fetch Suspended Sales
      const suspendedUrl = `/api/suspended-sales?attendantId=${session.user.id}&storeId=${session.user.storeId}`;
      const suspendedRes = await fetch(suspendedUrl);
      const suspendedData = await suspendedRes.json();
      const activeSales = (suspendedData.suspendedSales || []).map(s => ({ ...s, isCompleted: false, type: 'SUSPENDED' }));

      // 2. Fetch Completed Sales
      const completedUrl = `/api/kasir/transaksi?attendantId=${session.user.id}&storeId=${session.user.storeId}&limit=100`;
      const completedRes = await fetch(completedUrl);
      const completedData = await completedRes.json();
      const finishedSales = (completedData.transactions || []).map(s => ({
        id: s.id,
        name: s.invoiceNumber,
        customerName: s.member?.name || 'Pelanggan Umum',
        createdAt: s.date || s.createdAt,
        totalItems: (s.saleDetails || []).reduce((acc, item) => acc + (item.quantity || 0), 0),
        isCompleted: true,
        type: 'SALE'
      }));

      const combined = [...activeSales, ...finishedSales].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Calculate stats
      const uniqueCustomers = new Set(combined.map(s => s.customerName || 'Umum')).size;
      
      setStats({
        total: combined.length,
        active: activeSales.length,
        completed: finishedSales.length,
        customers: uniqueCustomers
      });
      setHistory(combined);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  if (!session) return <LoadingSpinner />;

  return (
    <main className={`flex-1 p-4 min-h-screen ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <div className="flex items-center mb-2">
            <History className="h-8 w-8 text-purple-600 mr-3" />
            <h1 className="text-3xl font-bold">Histori Transaksi Pelayan</h1>
          </div>
          <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Lihat dan kelola riwayat transaksi yang Anda tangani
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Transaksi" value={stats.total} icon={<Package className="h-6 w-6 text-blue-600" />} darkMode={darkMode} color="blue" />
          <StatCard title="Aktif" value={stats.active} icon={<Clock className="h-6 w-6 text-yellow-600" />} darkMode={darkMode} color="yellow" />
          <StatCard title="Selesai" value={stats.completed} icon={<CheckCircle className="h-6 w-6 text-green-600" />} darkMode={darkMode} color="green" />
          <StatCard title="Pelanggan" value={stats.customers} icon={<User className="h-6 w-6 text-purple-600" />} darkMode={darkMode} color="purple" />
        </div>

        <div className={`rounded-2xl shadow-xl ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} border overflow-hidden`}>
          <div className="p-6">
            <PelayanHistory 
              darkMode={darkMode} 
              attendantId={session.user.id} 
              externalData={historyData}
              isLoadingExternal={loading}
              onRefresh={fetchAllData}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ title, value, icon, darkMode, color }) {
  const bgColors = {
    blue: darkMode ? 'bg-blue-900/30' : 'bg-blue-100',
    yellow: darkMode ? 'bg-yellow-900/30' : 'bg-yellow-100',
    green: darkMode ? 'bg-green-900/30' : 'bg-green-100',
    purple: darkMode ? 'bg-purple-900/30' : 'bg-purple-100',
  };

  return (
    <div className={`p-5 rounded-2xl shadow-lg border ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{title}</h3>
          <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${bgColors[color]}`}>{icon}</div>
      </div>
    </div>
  );
}
