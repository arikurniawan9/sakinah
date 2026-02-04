'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ROLES } from '@/lib/constants';
import { useUserTheme } from '@/components/UserThemeContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import Breadcrumb from '@/components/Breadcrumb';
import InteractiveTable from '@/components/InteractiveTable';
import StatCard from '@/components/StatCard';
import { 
  Store, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Package,
  Calendar,
  Eye,
  Download,
  Filter,
  Search,
  Plus,
  MoreHorizontal
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Komponen Recent Activities
const RecentActivities = ({ activities, isLoading }) => {
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;

  if (isLoading) {
    return (
      <div className={`rounded-xl p-6 shadow-lg ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 w-32 bg-gray-300 dark:bg-gray-600 rounded shimmer" />
          <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex items-start">
              <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded-full" />
              <div className="ml-3 flex-1">
                <div className="h-4 w-48 bg-gray-300 dark:bg-gray-600 rounded mb-2" />
                <div className="h-3 w-24 bg-gray-300 dark:bg-gray-600 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl p-6 shadow-lg ${
      darkMode ? 'bg-gray-800' : 'bg-white'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Aktivitas Terbaru
        </h3>
        <button className={`p-2 rounded-lg ${
          darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
        }`}>
          <Eye className="h-5 w-5" />
        </button>
      </div>
      
      <div className="space-y-4">
        {activities.slice(0, 5).map((activity, index) => (
          <div key={index} className="flex items-start">
            <div className={`p-2 rounded-full ${
              darkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <Activity className="h-4 w-4" />
            </div>
            <div className="ml-3 flex-1">
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {activity.action} {activity.entity}
              </p>
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {activity.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Komponen Sales Chart
const SalesChart = ({ data, isLoading }) => {
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;

  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

  if (isLoading) {
    return (
      <div className={`rounded-xl p-6 shadow-lg ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 w-32 bg-gray-300 dark:bg-gray-600 rounded" />
          <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>
        <div className="h-80 flex items-center justify-center">
          <div className="h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl p-6 shadow-lg ${
      darkMode ? 'bg-gray-800' : 'bg-white'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Penjualan Harian
        </h3>
        <button className={`p-2 rounded-lg ${
          darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
        }`}>
          <Download className="h-5 w-5" />
        </button>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#4b5563' : '#e5e7eb'} />
            <XAxis 
              dataKey="name" 
              stroke={darkMode ? '#9ca3af' : '#6b7280'}
            />
            <YAxis 
              stroke={darkMode ? '#9ca3af' : '#6b7280'}
            />
            <Tooltip 
              contentStyle={darkMode ? { 
                backgroundColor: '#1f2937', 
                border: '1px solid #374151',
                borderRadius: '0.5rem'
              } : {}}
            />
            <Bar dataKey="sales">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Komponen Quick Actions
const QuickActions = () => {
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  
  const actions = [
    { title: 'Tambah Toko', icon: Store, color: 'blue' },
    { title: 'Tambah Member', icon: Users, color: 'green' },
    { title: 'Tambah Produk', icon: ShoppingBag, color: 'purple' },
    { title: 'Laporan', icon: TrendingUp, color: 'yellow' },
  ];

  const colorClasses = {
    blue: darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600',
    green: darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600',
    purple: darkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600',
    yellow: darkMode ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-yellow-500 hover:bg-yellow-600',
  };

  return (
    <div className={`rounded-xl p-6 shadow-lg ${
      darkMode ? 'bg-gray-800' : 'bg-white'
    }`}>
      <h3 className={`text-lg font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Aksi Cepat
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action, index) => (
          <button
            key={index}
            className={`flex flex-col items-center justify-center p-4 rounded-lg text-white transition-colors ${
              colorClasses[action.color]
            }`}
          >
            <action.icon className="h-8 w-8 mb-2" />
            <span className="text-sm font-medium">{action.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default function ManagerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  
  const [stats, setStats] = useState({
    totalStores: 0,
    totalMembers: 0,
    totalProducts: 0,
    todaySales: 0,
  });
  
  const [recentActivities, setRecentActivities] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [storesData, setStoresData] = useState([]);
  const [loading, setLoading] = useState({
    stats: true,
    activities: true,
    sales: true,
    stores: true
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
      router.push('/unauthorized');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch stats
        const statsResponse = await fetch('/api/manager/stores/summary');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        } else {
          console.error('Error fetching stats:', statsResponse.statusText);
        }
        setLoading(prev => ({ ...prev, stats: false }));

        // Fetch recent activities
        const activitiesResponse = await fetch('/api/manager/activity-logs?limit=10');
        if (activitiesResponse.ok) {
          const activitiesData = await activitiesResponse.json();
          setRecentActivities(activitiesData.logs || []);
        } else {
          console.error('Error fetching activities:', activitiesResponse.statusText);
        }
        setLoading(prev => ({ ...prev, activities: false }));

        // Fetch sales data - bisa diambil dari API jika tersedia
        // Untuk sementara, gunakan data mock
        setSalesData([
          { name: 'Sen', sales: 4000 },
          { name: 'Sel', sales: 3000 },
          { name: 'Rab', sales: 2000 },
          { name: 'Kam', sales: 2780 },
          { name: 'Jum', sales: 1890 },
          { name: 'Sab', sales: 2390 },
          { name: 'Min', sales: 3490 },
        ]);
        setLoading(prev => ({ ...prev, sales: false }));

        // Fetch stores data
        const storesResponse = await fetch('/api/manager/stores');
        if (storesResponse.ok) {
          const storesData = await storesResponse.json();
          setStoresData(storesData.stores || []);
        } else {
          console.error('Error fetching stores:', storesResponse.statusText);
        }
        setLoading(prev => ({ ...prev, stores: false }));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading({
          stats: false,
          activities: false,
          sales: false,
          stores: false
        });
      }
    };

    fetchData();
  }, [status, session, router]);

  if (status === 'loading' || Object.values(loading).some(val => val)) {
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

  // Columns for the stores table
  const storesColumns = [
    {
      key: 'name',
      title: 'Nama Toko',
      sortable: true,
    },
    {
      key: 'address',
      title: 'Alamat',
      sortable: true,
    },
    {
      key: 'status',
      title: 'Status',
      render: (value) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          value === 'AKTIF' || value === 'ACTIVE'
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {value}
        </span>
      ),
      sortable: true,
    },
  ];

  // Actions for the stores table
  const storesActions = [
    {
      icon: Eye,
      onClick: (row) => router.push(`/manager/stores/${row.id}`),
      color: 'blue'
    },
    {
      icon: MoreHorizontal,
      onClick: (row) => console.log('More options for', row),
      color: 'gray'
    }
  ];

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
          { title: 'Dashboard', href: '/manager' },
        ]}
        darkMode={darkMode}
      />

      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Selamat Datang, {session.user.name}
        </h1>
        <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Ringkasan aktivitas dan statistik toko Anda
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Toko" 
          value={stats.totalStores} 
          icon={Store} 
          trend="+5%" 
          color="blue"
          isLoading={loading.stats}
        />
        <StatCard 
          title="Total Member" 
          value={stats.totalMembers} 
          icon={Users} 
          trend="+12%" 
          color="green"
          isLoading={loading.stats}
        />
        <StatCard 
          title="Total Produk" 
          value={stats.totalProducts} 
          icon={ShoppingBag} 
          trend="+8%" 
          color="purple"
          isLoading={loading.stats}
        />
        <StatCard 
          title="Penjualan Hari Ini" 
          value={`Rp ${stats.todaySales.toLocaleString()}`} 
          icon={DollarSign} 
          trend="+3%" 
          color="yellow"
          isLoading={loading.stats}
        />
      </div>

      {/* Charts and Activities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <SalesChart data={salesData} isLoading={loading.sales} />
        </div>
        <div>
          <RecentActivities activities={recentActivities} isLoading={loading.activities} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <QuickActions />
      </div>

      {/* Recent Stores Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Toko Terbaru
          </h3>
        </div>
        
        <InteractiveTable
          columns={storesColumns}
          data={storesData}
          actions={storesActions}
          searchable={true}
          filterable={true}
          exportable={true}
          pagination={true}
          itemsPerPage={5}
          onRowClick={(row) => router.push(`/manager/stores/${row.id}`)}
        />
      </div>
    </main>
  );
}