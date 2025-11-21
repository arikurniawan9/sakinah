'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useReducer, useCallback, useMemo, useState } from 'react';
import { ROLES } from '@/lib/constants';
import { Search, Plus, Edit, Eye, Trash2, Filter, Download, Upload, Users, Store, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useUserTheme } from '@/components/UserThemeContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import DataTable from '@/components/DataTable';

// Initial state for the reducer
const initialState = {
  users: [],
  loading: true,
  searchTerm: '',
  currentPage: 1,
  itemsPerPage: 10,
  sortConfig: { key: 'createdAt', direction: 'desc' },
  totalItems: 0,
  filters: {
    role: '',
    storeId: '',
    status: ''
  },
  stores: []
};

// Reducer function to handle state updates
function userManagementReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USERS':
      return { ...state, users: action.payload };
    case 'SET_STORES':
      return { ...state, stores: action.payload };
    case 'SET_TOTAL_ITEMS':
      return { ...state, totalItems: action.payload };
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload, currentPage: 1 };
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };
    case 'SET_ITEMS_PER_PAGE':
      return { ...state, itemsPerPage: action.payload, currentPage: 1 };
    case 'SET_SORT_CONFIG':
      return { ...state, sortConfig: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload }, currentPage: 1 };
    case 'RESET_FILTERS':
      return { ...state, filters: { role: '', storeId: '', status: '' }, searchTerm: '', currentPage: 1 };
    default:
      return state;
  }
}

export default function UserManagerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [state, dispatch] = useReducer(userManagementReducer, initialState);
  const { userTheme } = useUserTheme();
  const [showFilters, setShowFilters] = useState(false);

  // Memoized fetch functions
  const fetchUsers = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const params = new URLSearchParams({
        page: state.currentPage,
        limit: state.itemsPerPage,
        search: state.searchTerm,
        sortKey: state.sortConfig.key,
        sortDirection: state.sortConfig.direction,
        role: state.filters.role,
        storeId: state.filters.storeId,
        status: state.filters.status
      });

      const response = await fetch(`/api/users?${params.toString()}`);
      const data = await response.json();
      
      if (response.ok) {
        dispatch({ type: 'SET_USERS', payload: data.users || [] });
        dispatch({ type: 'SET_TOTAL_ITEMS', payload: data.totalItems || 0 });
      } else {
        console.error('Error fetching users:', data.error);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.currentPage, state.itemsPerPage, state.searchTerm, state.sortConfig, state.filters]);

  const fetchStores = useCallback(async () => {
    try {
      const response = await fetch('/api/stores');
      const data = await response.json();
      
      if (response.ok) {
        dispatch({ type: 'SET_STORES', payload: data.stores || [] });
      } else {
        console.error('Error fetching stores:', data.error);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  }, []);

  // Memoized handler functions
  const handleSearch = useCallback((term) => {
    dispatch({ type: 'SET_SEARCH_TERM', payload: term });
  }, []);

  const handleItemsPerPageChange = useCallback((value) => {
    dispatch({ type: 'SET_ITEMS_PER_PAGE', payload: value });
  }, []);

  const handlePageChange = useCallback((page) => {
    dispatch({ type: 'SET_CURRENT_PAGE', payload: page });
  }, []);

  const handleSort = useCallback((config) => {
    dispatch({ type: 'SET_SORT_CONFIG', payload: config });
  }, []);

  const handleFilterChange = useCallback((filters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  // Effect to fetch data when search, pagination, or sort parameters change
  useEffect(() => {
    fetchUsers();
  }, [state.searchTerm, state.currentPage, state.itemsPerPage, state.sortConfig, state.filters, fetchUsers]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  // Initial data fetch
  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
      router.push('/unauthorized');
      return;
    }

    fetchUsers();
    fetchStores();
  }, [status, session, router, fetchUsers, fetchStores]);

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

  // Get store name by ID
  const getStoreName = useCallback((storeId) => {
    const store = state.stores.find(s => s.id === storeId);
    return store ? store.name : 'Toko Tidak Ditemukan';
  }, [state.stores]);

  // Columns configuration for the DataTable
  const columns = useMemo(() => [
    {
      key: 'number',
      title: 'No',
      render: (_, __, index) => (state.currentPage - 1) * state.itemsPerPage + index + 1
    },
    { 
      key: 'name', 
      title: 'Nama', 
      sortable: true,
      className: 'font-medium'
    },
    { 
      key: 'username', 
      title: 'Username', 
      sortable: true 
    },
    { 
      key: 'role', 
      title: 'Peran', 
      sortable: true,
      render: (role) => {
        const roleColors = {
          'MANAGER': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
          'WAREHOUSE': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
          'ADMIN': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
          'CASHIER': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
          'ATTENDANT': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100'
        };
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${roleColors[role] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'}`}>
            {role}
          </span>
        );
      }
    },
    { 
      key: 'storeName', 
      title: 'Toko', 
      render: (_, user) => user.store ? user.store.name : getStoreName(user.storeId)
    },
    { 
      key: 'status', 
      title: 'Status', 
      sortable: true,
      render: (status) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
          ${status === 'AKTIF' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'}`}>
          {status}
        </span>
      )
    },
    {
      key: 'createdAt',
      title: 'Dibuat',
      sortable: true,
      render: (date) => new Date(date).toLocaleDateString('id-ID')
    }
  ], [state.currentPage, state.itemsPerPage, router, getStoreName]);

  // Row actions for the DataTable
  const renderRowActions = useCallback((user) => (
    <div className="flex space-x-2">
      <button
        onClick={() => router.push(`/manager/users/${user.id}/edit`)}
        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg dark:text-blue-400 dark:hover:bg-gray-700"
        title="Edit Pengguna"
      >
        <Edit className="h-4 w-4" />
      </button>
      <button
        onClick={() => {
          if (confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
            // Implementasi penghapusan
          }
        }}
        className="p-2 text-red-600 hover:bg-red-100 rounded-lg dark:text-red-400 dark:hover:bg-gray-700"
        title="Hapus Pengguna"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  ), [router]);

  // Mobile columns configuration
  const mobileColumns = useMemo(() => [
    {
      key: 'name',
      title: 'Nama',
      render: (name, user) => (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</div>
          <div className="text-xs mt-1">
            <span className={`px-2 py-1 rounded-full ${
              user.status === 'AKTIF' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
            }`}>
              {user.status}
            </span>
            <span className="ml-2 px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
              {user.role}
            </span>
          </div>
        </div>
      )
    }
  ], []);

  // Additional actions for the DataTable
  const additionalActions = useMemo(() => [
    {
      label: 'Tambah Pengguna',
      icon: Plus,
      onClick: () => router.push('/manager/users/create'),
      className: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    {
      label: 'Ekspor',
      icon: Download,
      onClick: () => {
        // Implementasi ekspor
        alert('Fitur ekspor akan segera tersedia');
      },
      className: 'bg-green-600 hover:bg-green-700 text-white'
    },
    {
      label: 'Impor',
      icon: Upload,
      onClick: () => {
        // Implementasi impor
        alert('Fitur impor akan segera tersedia');
      },
      className: 'bg-purple-600 hover:bg-purple-700 text-white'
    }
  ], [router]);

  // Filter options
  const filterOptions = useMemo(() => [
    {
      key: 'role',
      label: 'Peran',
      type: 'select',
      options: [
        { value: '', label: 'Semua Peran' },
        { value: 'MANAGER', label: 'Manager' },
        { value: 'WAREHOUSE', label: 'Gudang' },
        { value: 'ADMIN', label: 'Admin' },
        { value: 'CASHIER', label: 'Kasir' },
        { value: 'ATTENDANT', label: 'Pelayan' }
      ]
    },
    {
      key: 'storeId',
      label: 'Toko',
      type: 'select',
      options: [
        { value: '', label: 'Semua Toko' },
        ...state.stores.map(store => ({ value: store.id, label: store.name }))
      ]
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: '', label: 'Semua Status' },
        { value: 'AKTIF', label: 'Aktif' },
        { value: 'TIDAK_AKTIF', label: 'Tidak Aktif' }
      ]
    }
  ], [state.stores]);

  if (state.loading && state.users.length === 0) {
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manajemen Pengguna</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Kelola semua pengguna di seluruh toko dalam sistem Anda
        </p>
      </div>

      {/* DataTable */}
      <DataTable
        data={state.users}
        columns={columns}
        mobileColumns={mobileColumns}
        loading={state.loading}
        searchTerm={state.searchTerm}
        onSearch={handleSearch}
        itemsPerPage={state.itemsPerPage}
        onItemsPerPageChange={handleItemsPerPageChange}
        currentPage={state.currentPage}
        onPageChange={handlePageChange}
        totalItems={state.totalItems}
        sortConfig={state.sortConfig}
        onSort={handleSort}
        additionalActions={additionalActions}
        showFilters={showFilters}
        filterOptions={filterOptions}
        filterValues={state.filters}
        onFilterChange={handleFilterChange}
        onToggleFilters={() => setShowFilters(!showFilters)}
        rowActions={renderRowActions}
        darkMode={userTheme.darkMode}
      />
    </div>
  );
}