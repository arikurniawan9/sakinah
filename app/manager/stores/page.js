'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useReducer, useCallback, useMemo, useState } from 'react';
import { ROLES } from '@/lib/constants';
import { Search, Plus, Edit, Eye, Trash2, Filter, Download, Upload } from 'lucide-react';
import { useUserTheme } from '@/components/UserThemeContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import DataTable from '@/components/DataTable';

// Initial state for the reducer
const initialState = {
  stores: [],
  loading: true,
  searchTerm: '',
  currentPage: 1,
  itemsPerPage: 10,
  sortConfig: { key: 'createdAt', direction: 'desc' },
  totalItems: 0,
  filters: {
    status: '',
    dateRange: null
  }
};

// Reducer function to handle state updates
function storeManagementReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
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
      return { ...state, filters: { status: '', dateRange: null }, searchTerm: '', currentPage: 1 };
    default:
      return state;
  }
}

export default function StoreManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [state, dispatch] = useReducer(storeManagementReducer, initialState);
  const { userTheme } = useUserTheme();
  const [showFilters, setShowFilters] = useState(false);

  // Memoized fetch function
  const fetchStores = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const params = new URLSearchParams({
        page: state.currentPage,
        limit: state.itemsPerPage,
        search: state.searchTerm,
        sortKey: state.sortConfig.key,
        sortDirection: state.sortConfig.direction,
        status: state.filters.status
      });

      const response = await fetch(`/api/stores?${params.toString()}`);

      if (!response.ok) {
        // Handle different status codes appropriately
        if (response.status === 401) {
          // Unauthorized - redirect to login
          router.push('/login');
          return;
        } else if (response.status === 403) {
          // Forbidden - redirect to unauthorized page
          router.push('/unauthorized');
          return;
        } else {
          // Other errors - display error message
          const errorData = await response.text();
          console.error('Error response from API:', errorData);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();

      dispatch({ type: 'SET_STORES', payload: data.stores || [] });
      dispatch({ type: 'SET_TOTAL_ITEMS', payload: data.totalItems || 0 });
    } catch (error) {
      console.error('Error fetching stores:', error);
      if (error.message.includes('401') || error.message.includes('403')) {
        router.push('/login');
      } else {
        alert(`Error mengambil data toko: ${error.message}`);
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.currentPage, state.itemsPerPage, state.searchTerm, state.sortConfig, state.filters, router]);

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
    fetchStores();
  }, [state.searchTerm, state.currentPage, state.itemsPerPage, state.sortConfig, state.filters, fetchStores]);

  // Initial data fetch
  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
      router.push('/unauthorized');
      return;
    }

    fetchStores();
  }, [status, session, router, fetchStores]);

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

  // Columns configuration for the DataTable
  const columns = useMemo(() => [
    {
      key: 'number',
      title: 'No',
      render: (_, __, index) => (state.currentPage - 1) * state.itemsPerPage + index + 1
    },
    { 
      key: 'name', 
      title: 'Nama Toko', 
      sortable: true,
      className: 'font-medium'
    },
    { 
      key: 'code', 
      title: 'Kode Toko', 
      sortable: true 
    },
    { 
      key: 'address', 
      title: 'Alamat' 
    },
    { 
      key: 'phone', 
      title: 'Telepon' 
    },
    { 
      key: 'email', 
      title: 'Email' 
    },
    { 
      key: 'status', 
      title: 'Status', 
      sortable: true,
      render: (status) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
          ${status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'}`}>
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
  ], [state.currentPage, state.itemsPerPage, router]);

  // Row actions for the DataTable
  const renderRowActions = useCallback((store) => (
    <div className="flex space-x-2">
      <button
        onClick={() => router.push(`/manager/edit-store/${store.id}`)}
        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg dark:text-blue-400 dark:hover:bg-gray-700"
        title="Edit Toko"
      >
        <Edit className="h-4 w-4" />
      </button>
      <button
        onClick={() => {
          if (confirm('Apakah Anda yakin ingin menghapus toko ini?')) {
            // Implementasi penghapusan
          }
        }}
        className="p-2 text-red-600 hover:bg-red-100 rounded-lg dark:text-red-400 dark:hover:bg-gray-700"
        title="Hapus Toko"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  ), [router]);

  // Mobile columns configuration
  const mobileColumns = useMemo(() => [
    {
      key: 'name',
      title: 'Nama Toko',
      render: (name, store) => (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{store.address}</div>
          <div className="text-xs mt-1">
            <span className={`px-2 py-1 rounded-full ${
              store.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
            }`}>
              {store.status}
            </span>
          </div>
        </div>
      )
    }
  ], []);

  // Additional actions for the DataTable
  const additionalActions = useMemo(() => [
    {
      label: 'Tambah Toko Baru',
      icon: Plus,
      onClick: () => router.push('/manager/create-store'),
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
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: '', label: 'Semua Status' },
        { value: 'ACTIVE', label: 'Aktif' },
        { value: 'INACTIVE', label: 'Tidak Aktif' },
        { value: 'SUSPENDED', label: 'Ditangguhkan' }
      ]
    }
  ], []);

  if (state.loading && state.stores.length === 0) {
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manajemen Toko</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Kelola semua toko dalam sistem multi-toko Anda
        </p>
      </div>

      {/* DataTable */}
      <DataTable
        data={state.stores}
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