'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ROLES } from '@/lib/constants';
import { useUserTheme } from '@/components/UserThemeContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import DataTable from '@/components/DataTable';
import Breadcrumb from '@/components/Breadcrumb';
import { Search, Calendar, User, Activity, Eye } from 'lucide-react';

export default function ActivityLogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;

  // Fungsi untuk menerjemahkan label aksi ke dalam bahasa Indonesia
  const translateActionLabel = (action, entity) => {
    // Fungsi untuk menentukan action type dan entity dari string kombinasi
    const parseActionAndEntity = (actionStr, entityStr) => {
      let actionType = actionStr;
      let entityType = entityStr;

      if (actionStr.includes('_')) {
        const parts = actionStr.split('_');

        // Cari bagian yang merupakan action type (CREATE, UPDATE, DELETE, dll)
        const actionTypes = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'DEACTIVATE', 'ACTIVATE', 'TRANSFER'];
        const actionIndex = parts.findIndex(part => actionTypes.includes(part));

        if (actionIndex !== -1) {
          actionType = parts[actionIndex];

          // Gabungkan bagian-bagian sebelum action type sebagai entity
          if (actionIndex > 0) {
            entityType = parts.slice(0, actionIndex).join('_');
          }
        } else {
          // Jika tidak ditemukan action type standar, coba pola lama
          if (parts.length >= 2) {
            entityType = parts[0];
            actionType = parts[1];
          }
        }
      }

      return { actionType, entityType };
    };

    const { actionType, entityType } = parseActionAndEntity(action, entity);

    const actionMap = {
      'CREATE': {
        'SALE': 'Penjualan Baru',
        'PRODUCT': 'Produk Baru',
        'USER': 'Pengguna Baru',
        'STORE': 'Toko Baru',
        'CATEGORY': 'Kategori Baru',
        'SUPPLIER': 'Supplier Baru',
        'WAREHOUSE': 'Gudang Baru',
        'MEMBER': 'Member Baru',
        'EXPENSE': 'Pengeluaran Baru',
        'DISTRIBUTION': 'Distribusi Baru',
        'WAREHOUSE_DISTRIBUTION': 'Distribusi Gudang Baru',
        'default': 'Dibuat'
      },
      'UPDATE': {
        'SALE': 'Perbarui Penjualan',
        'PRODUCT': 'Perbarui Produk',
        'USER': 'Perbarui Pengguna',
        'STORE': 'Perbarui Toko',
        'CATEGORY': 'Perbarui Kategori',
        'SUPPLIER': 'Perbarui Supplier',
        'WAREHOUSE': 'Perbarui Gudang',
        'MEMBER': 'Perbarui Member',
        'EXPENSE': 'Perbarui Pengeluaran',
        'DISTRIBUTION': 'Perbarui Distribusi',
        'WAREHOUSE_DISTRIBUTION': 'Perbarui Distribusi Gudang',
        'default': 'Diperbarui'
      },
      'DELETE': {
        'SALE': 'Hapus Penjualan',
        'PRODUCT': 'Hapus Produk',
        'USER': 'Hapus Pengguna',
        'STORE': 'Hapus Toko',
        'CATEGORY': 'Hapus Kategori',
        'SUPPLIER': 'Hapus Supplier',
        'WAREHOUSE': 'Hapus Gudang',
        'MEMBER': 'Hapus Member',
        'EXPENSE': 'Hapus Pengeluaran',
        'DISTRIBUTION': 'Hapus Distribusi',
        'WAREHOUSE_DISTRIBUTION': 'Hapus Distribusi Gudang',
        'default': 'Dihapus'
      },
      'LOGIN': {
        'default': 'Masuk'
      },
      'LOGOUT': {
        'default': 'Keluar'
      },
      'DEACTIVATE': {
        'USER': 'Nonaktifkan Pengguna',
        'PRODUCT': 'Nonaktifkan Produk',
        'default': 'Dinonaktifkan'
      },
      'ACTIVATE': {
        'USER': 'Aktifkan Pengguna',
        'PRODUCT': 'Aktifkan Produk',
        'default': 'Diaktifkan'
      },
      'TRANSFER': {
        'PRODUCT': 'Transfer Produk',
        'DISTRIBUTION': 'Transfer Distribusi',
        'WAREHOUSE_DISTRIBUTION': 'Transfer Distribusi Gudang',
        'default': 'Transfer'
      }
    };

    // Cek apakah kombinasi actionType dan entityType ada dalam map
    if (actionMap[actionType] && actionMap[actionType][entityType]) {
      return actionMap[actionType][entityType];
    }

    // Jika tidak ditemukan, coba cari dengan entity yang lebih umum
    const commonEntities = ['SALE', 'PRODUCT', 'USER', 'STORE', 'CATEGORY', 'SUPPLIER', 'WAREHOUSE', 'MEMBER', 'EXPENSE'];
    for (const commonEntity of commonEntities) {
      if (entityType.includes(commonEntity)) {
        if (actionMap[actionType] && actionMap[actionType][commonEntity]) {
          return actionMap[actionType][commonEntity];
        }
      }
    }

    // Jika masih tidak ditemukan, kembalikan action type default
    return actionMap[actionType]?.default || action;
  };

  // Fungsi untuk menerjemahkan label entitas ke dalam bahasa Indonesia
  const translateEntityLabel = (entity) => {
    const entityMap = {
      'SALE': 'Penjualan',
      'PRODUCT': 'Produk',
      'USER': 'Pengguna',
      'STORE': 'Toko',
      'CATEGORY': 'Kategori',
      'SUPPLIER': 'Supplier',
      'WAREHOUSE': 'Gudang',
      'MEMBER': 'Member',
      'EXPENSE': 'Pengeluaran',
      'DISTRIBUTION': 'Distribusi',
      'WAREHOUSE_DISTRIBUTION': 'Distribusi Gudang'
    };

    // Cek apakah entity ada dalam map
    if (entityMap[entity]) {
      return entityMap[entity];
    }

    // Jika tidak ditemukan, coba cari bagian-bagian dari entity yang mungkin kompleks
    const parts = entity.split('_');
    if (parts.length > 1) {
      // Gabungkan kembali bagian-bagian dengan spasi dan kapitalisasi
      return parts.map(part => {
        if (entityMap[part]) {
          return entityMap[part];
        }
        // Jika tidak ditemukan dalam map, kapitalisasi huruf pertama
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      }).join(' ');
    }

    // Jika tetap tidak ditemukan, kembalikan entity asli
    return entity;
  };

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

  // Fetch activity logs
  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
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

        const response = await fetch(`/api/manager/activity-logs?${params.toString()}`);
        
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
        console.error('Error fetching activity logs:', err);
        setError('Gagal mengambil log aktivitas: ' + err.message);
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
          <div className="font-medium">{row.user?.name || row.userId || 'N/A'}</div>
          <div className="text-xs text-gray-500">{row.user?.username || 'N/A'}</div>
        </div>
      )
    },
    {
      key: 'action',
      title: 'Jenis Aksi',
      render: (value, row) => {
        // Menentukan action type untuk warna badge
        const determineActionType = () => {
          if (row.action.includes('_')) {
            const parts = row.action.split('_');

            // Cari action type (CREATE, UPDATE, dll) dalam parts
            const actionTypes = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'DEACTIVATE', 'ACTIVATE', 'TRANSFER'];
            const actionIndex = parts.findIndex(part => actionTypes.includes(part));

            if (actionIndex !== -1) {
              return parts[actionIndex]; // Kembalikan action type yang ditemukan
            }

            // Jika tidak ditemukan action type standar, coba pola lama
            if (parts.length >= 2) {
              return parts[1]; // Gunakan bagian kedua sebagai action type
            }
          }

          // Jika tidak ada pola khusus, kembalikan action asli
          return row.action;
        };

        const actionType = determineActionType();

        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            actionType === 'CREATE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
            actionType === 'UPDATE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
            actionType === 'DELETE' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
            actionType === 'LOGIN' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
          }`}>
            {translateActionLabel(row.action, row.entity)}
          </span>
        );
      }
    },
    {
      key: 'entity',
      title: 'Entitas',
      render: (value, row) => {
        // Fungsi untuk menentukan entity type dari action atau entity
        const determineEntityType = () => {
          // Jika row.action adalah kombinasi seperti "SALE_CREATE", ambil bagian sebelum action type
          if (row.action.includes('_')) {
            const parts = row.action.split('_');

            // Cari action type (CREATE, UPDATE, dll) dalam parts
            const actionTypes = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'DEACTIVATE', 'ACTIVATE', 'TRANSFER'];
            const actionIndex = parts.findIndex(part => actionTypes.includes(part));

            if (actionIndex !== -1) {
              // Ambil bagian sebelum action type sebagai entity
              if (actionIndex > 0) {
                return parts.slice(0, actionIndex).join('_');
              }
            }

            // Jika tidak ditemukan action type, coba pola lama
            if (parts.length >= 2) {
              return parts[0];
            }
          }

          // Jika tidak ada pola khusus, gunakan entity dari row.entity
          return row.entity;
        };

        const entityType = determineEntityType();

        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            {translateEntityLabel(entityType)}
          </span>
        );
      }
    },
    {
      key: 'createdAt',
      title: 'Waktu',
      render: (value) => new Date(value).toLocaleString('id-ID')
    },
    {
      key: 'actions',
      title: 'Aksi',
      render: (value, row) => (
        <button
          onClick={() => row.id && router.push(`/manager/activity-log/${row.id}`)}
          disabled={!row.id}
          className={`p-1 rounded-full ${
            row.id
              ? (darkMode
                  ? 'text-blue-400 hover:bg-blue-700/30 cursor-pointer'
                  : 'text-blue-500 hover:bg-blue-100 cursor-pointer')
              : (darkMode
                  ? 'text-gray-500 cursor-not-allowed'
                  : 'text-gray-300 cursor-not-allowed')
          }`}
        >
          <Eye className="h-4 w-4" />
        </button>
      )
    }
  ];

  // Filter options
  const filterOptions = [
    {
      key: 'action',
      label: 'Jenis Aksi',
      type: 'select',
      options: [
        { value: '', label: 'Semua Aksi' },
        { value: 'CREATE', label: 'Buat' },
        { value: 'UPDATE', label: 'Perbarui' },
        { value: 'DELETE', label: 'Hapus' },
        { value: 'LOGIN', label: 'Masuk' },
        { value: 'LOGOUT', label: 'Keluar' }
      ]
    },
    {
      key: 'entity',
      label: 'Entitas',
      type: 'select',
      options: [
        { value: '', label: 'Semua Entitas' },
        { value: 'STORE', label: 'Toko' },
        { value: 'USER', label: 'Pengguna' },
        { value: 'PRODUCT', label: 'Produk' },
        { value: 'SALE', label: 'Penjualan' },
        { value: 'WAREHOUSE', label: 'Gudang' },
        { value: 'CATEGORY', label: 'Kategori' },
        { value: 'SUPPLIER', label: 'Supplier' },
        { value: 'MEMBER', label: 'Member' },
        { value: 'EXPENSE', label: 'Pengeluaran' }
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

  if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
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
          { title: 'Log Aktivitas', href: '/manager/activity-log' },
        ]}
        basePath="/manager"
        darkMode={darkMode}
      />
      
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Log Aktivitas Sistem
        </h1>
        <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Pantau semua aktivitas penting dalam sistem Anda
        </p>
      </div>

      {error && (
        <div className={`mb-4 p-4 rounded-lg ${darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'}`}>
          {error}
        </div>
      )}

      <div className={`rounded-xl shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
          {/* Table Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Cari aktivitas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500'
                      : 'border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                {/* Filter Controls */}
                {filterOptions.map((filter) => (
                  <div key={filter.key} className="flex-1 min-w-[150px]">
                    {filter.type === 'select' ? (
                      <select
                        value={filters[filter.key]}
                        onChange={(e) =>
                          setFilters({ ...filters, [filter.key]: e.target.value })
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500'
                            : 'border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                      >
                        {filter.options.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={filter.type}
                        value={filters[filter.key]}
                        onChange={(e) =>
                          setFilters({ ...filters, [filter.key]: e.target.value })
                        }
                        placeholder={filter.label}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500'
                            : 'border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    >
                      <div className={darkMode ? 'text-gray-300' : 'text-gray-500'}>
                        {column.title}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                {loading ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      Tidak ada data aktivitas ditemukan
                    </td>
                  </tr>
                ) : (
                  logs.map((row, index) => (
                    <tr key={row.id || index} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      {columns.map((column) => (
                        <td
                          key={`${row.id || index}-${column.key}`}
                          className="px-6 py-4 whitespace-nowrap text-sm"
                        >
                          <div className={darkMode ? 'text-gray-300' : 'text-gray-900'}>
                            {column.render ? column.render(row[column.key], row, index) : row[column.key]}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Menampilkan{' '}
                <span className="font-medium">
                  {logs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
                </span>{' '}
                sampai{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, totalItems)}
                </span>{' '}
                dari <span className="font-medium">{totalItems}</span> hasil
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1); // Reset to first page when changing items per page
                  }}
                  className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500'
                      : 'border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                >
                  {[30, 50, 100, 300, 500].map((size) => (
                    <option key={size} value={size}>
                      {size} per halaman
                    </option>
                  ))}
                </select>

                <div className="flex items-center space-x-1">
                  {(() => {
                    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
                    return (
                      <>
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className={`px-3 py-2 rounded-md text-sm font-medium ${
                            currentPage === 1
                              ? 'opacity-50 cursor-not-allowed'
                              : darkMode
                              ? 'bg-gray-700 text-white hover:bg-gray-600'
                              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                          }`}
                        >
                          Sebelumnya
                        </button>

                        <span className={`px-3 py-2 text-sm font-medium ${
                          darkMode ? 'text-white' : 'text-gray-800'
                        }`}>
                          Halaman {currentPage} dari {totalPages}
                        </span>

                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages || totalPages === 0}
                          className={`px-3 py-2 rounded-md text-sm font-medium ${
                            currentPage === totalPages || totalPages === 0
                              ? 'opacity-50 cursor-not-allowed'
                              : darkMode
                              ? 'bg-gray-700 text-white hover:bg-gray-600'
                              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                          }`}
                        >
                          Berikutnya
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
      </div>
    </main>
  );
}