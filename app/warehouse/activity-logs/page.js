'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ROLES } from '@/lib/constants';
import { useUserTheme } from '@/components/UserThemeContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import DataTable from '@/components/DataTable';
import Breadcrumb from '@/components/Breadcrumb';
import { Search, Calendar, User, Package, Move3D } from 'lucide-react';

export default function WarehouseActivityLogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    entity: '',
    startDate: '',
    endDate: ''
  });

  // Fetch warehouse activity logs
  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || session.user.role !== ROLES.WAREHOUSE) {
      router.push('/unauthorized');
      return;
    }

    const fetchLogs = async () => {
      setLoading(true);
      setError('');
      
      try {
        const params = new URLSearchParams({
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm,
          userId: filters.userId,
          action: filters.action,
          entity: filters.entity,
          startDate: filters.startDate,
          endDate: filters.endDate
        });

        // Menambahkan filter khusus untuk aktivitas gudang
        params.set('entity', 'WAREHOUSE'); // Filter untuk entitas gudang

        const response = await fetch(`/api/warehouse/activity-logs?${params.toString()}`);
        
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          } else if (response.status === 403) {
            router.push('/unauthorized');
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setLogs(data.logs || []);
        setTotalItems(data.total || 0);
      } catch (err) {
        console.error('Error fetching warehouse activity logs:', err);
        setError('Gagal mengambil log aktivitas gudang: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [status, session, currentPage, itemsPerPage, searchTerm, filters, router]);

  // Columns configuration for the DataTable
  const columns = [
    {
      key: 'no',
      title: 'No.',
      render: (_, __, index) => (currentPage - 1) * itemsPerPage + index + 1,
    },
    {
      key: 'user',
      title: 'Pengguna',
      render: (value, row) => (
        <div>
          <div className="font-medium">{row.user?.name || 'N/A'}</div>
          <div className="text-xs text-gray-500">{row.user?.username || 'N/A'}</div>
        </div>
      )
    },
    {
      key: 'action',
      title: 'Aksi',
      render: (value, row) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          row.action === 'CREATE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
          row.action === 'UPDATE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
          row.action === 'DELETE' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
          row.action === 'STOCK_IN' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
          row.action === 'STOCK_OUT' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        }`}>
          {row.action}
        </span>
      )
    },
    {
      key: 'entity',
      title: 'Entitas',
      render: (value, row) => (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400">
          {row.entity}
        </span>
      )
    },
    {
      key: 'description',
      title: 'Deskripsi',
      className: 'max-w-xs'
    },
    {
      key: 'store',
      title: 'Toko',
      render: (value, row) => row.store?.name || 'Gudang Pusat'
    },
    {
      key: 'createdAt',
      title: 'Waktu',
      render: (value) => new Date(value).toLocaleString('id-ID')
    }
  ];

  // Filter options
  const filterOptions = [
    {
      key: 'action',
      label: 'Aksi',
      type: 'select',
      options: [
        { value: '', label: 'Semua Aksi' },
        { value: 'CREATE', label: 'Buat' },
        { value: 'UPDATE', label: 'Perbarui' },
        { value: 'DELETE', label: 'Hapus' },
        { value: 'STOCK_IN', label: 'Tambah Stok' },
        { value: 'STOCK_OUT', label: 'Kurangi Stok' },
        { value: 'DISTRIBUTION', label: 'Distribusi' }
      ]
    },
    {
      key: 'startDate',
      label: 'Tanggal Awal',
      type: 'date'
    },
    {
      key: 'endDate',
      label: 'Tanggal Akhir',
      type: 'date'
    }
  ];

  // Hydration-safe loading and authentication checks
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (status !== 'authenticated' || session.user.role !== ROLES.WAREHOUSE) {
    router.push('/unauthorized');
    return null;
  }

  const paginationData = {
    currentPage,
    totalPages: Math.ceil(totalItems / itemsPerPage),
    totalItems,
    onPageChange: setCurrentPage,
  };

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
          { title: 'Dashboard', href: '/warehouse' },
          { title: 'Log Aktivitas', href: '/warehouse/activity-logs' },
        ]}
        darkMode={darkMode}
      >
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Log Aktivitas Gudang
        </h1>
        <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Pantau semua aktivitas penting dalam sistem gudang Anda
        </p>
      </Breadcrumb>

      {error && (
        <div className={`mb-4 p-4 rounded-lg ${darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'}`}>
          {error}
        </div>
      )}

      <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
        <DataTable
          data={logs}
          columns={columns}
          loading={loading}
          onSearch={setSearchTerm}
          darkMode={darkMode}
          showAdd={false}
          pagination={paginationData}
          mobileColumns={['user', 'action', 'description', 'createdAt']}
          filterOptions={filterOptions}
          filterValues={filters}
          onFilterChange={setFilters}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </div>
    </main>
  );
}