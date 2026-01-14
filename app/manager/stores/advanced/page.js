'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ROLES } from '@/lib/constants';
import { useUserTheme } from '@/components/UserThemeContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import DataTable from '@/components/DataTable';
import Breadcrumb from '@/components/Breadcrumb';
import { Search, Plus, Edit, Trash2, Filter, Download, Upload, MapPin, Phone, Mail, Users } from 'lucide-react';

export default function AdvancedStoreManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalStores, setTotalStores] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    dateRange: null
  });
  const [showFilters, setShowFilters] = useState(false);

  // Cek apakah pengguna adalah MANAGER
  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
      router.push('/unauthorized');
      return;
    }
    
    fetchStores();
  }, [status, session, currentPage, itemsPerPage, searchTerm, filters, router]);

  // Fetch stores
  const fetchStores = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        status: filters.status
      });

      const response = await fetch(`/api/manager/stores?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.user?.token || ''}`
        }
      });
      
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
      setStores(data.stores || []);
      setTotalStores(data.total || 0);
    } catch (err) {
      console.error('Error fetching stores:', err);
      setError('Gagal mengambil data toko: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleAddStore = () => {
    setSelectedStore(null);
    setShowCreateModal(true);
  };

  const handleEditStore = (store) => {
    setSelectedStore(store);
    setShowEditModal(true);
  };

  const handleDeleteStore = (store) => {
    setStoreToDelete(store);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!storeToDelete) return;
    
    try {
      const response = await fetch(`/api/manager/stores/${storeToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.user?.token || ''}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      setSuccessMessage('Toko berhasil dihapus');
      setShowDeleteModal(false);
      setStoreToDelete(null);
      fetchStores(); // Refresh data
    } catch (err) {
      console.error('Error deleting store:', err);
      setError('Gagal menghapus toko: ' + err.message);
      setShowDeleteModal(false);
      setStoreToDelete(null);
    }
  };

  const handleSaveStore = async (storeData) => {
    try {
      const url = selectedStore ? `/api/manager/stores/${selectedStore.id}` : '/api/manager/stores';
      const method = selectedStore ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.user?.token || ''}`
        },
        body: JSON.stringify(storeData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setSuccessMessage(selectedStore ? 'Toko berhasil diperbarui' : 'Toko berhasil ditambahkan');
      setShowCreateModal(false);
      setShowEditModal(false);
      fetchStores(); // Refresh data
      return result;
    } catch (err) {
      console.error('Error saving store:', err);
      setError('Gagal menyimpan toko: ' + err.message);
      throw err;
    }
  };

  // Select handlers
  const handleSelectRow = (id) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(stores.map(s => s.id));
    } else {
      setSelectedRows([]);
    }
  };

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

  // Columns configuration
  const columns = [
    {
      key: 'no',
      title: 'No.',
      render: (_, __, index) => (currentPage - 1) * itemsPerPage + index + 1,
    },
    { 
      key: 'code', 
      title: 'Kode Toko', 
      sortable: true,
      render: (value) => (
        <span className="font-mono text-sm">{value}</span>
      )
    },
    { 
      key: 'name', 
      title: 'Nama Toko', 
      sortable: true,
      className: 'font-medium'
    },
    {
      key: 'address',
      title: 'Alamat',
      render: (value) => (
        <div className="flex items-center">
          <MapPin className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
          <span className="text-sm">{value}</span>
        </div>
      )
    },
    {
      key: 'contact',
      title: 'Kontak',
      render: (_, store) => (
        <div className="space-y-1">
          {store.phone && (
            <div className="flex items-center text-sm">
              <Phone className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
              <span>{store.phone}</span>
            </div>
          )}
          {store.email && (
            <div className="flex items-center text-sm">
              <Mail className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
              <span>{store.email}</span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (value) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          value === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
          value === 'INACTIVE' ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' :
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'userCount',
      title: 'Pengguna',
      render: (_, store) => (
        <div className="flex items-center">
          <Users className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
          <span>{store.userCount || 0}</span>
        </div>
      )
    },
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
    totalPages: Math.ceil(totalStores / itemsPerPage),
    totalItems: totalStores,
    onPageChange: setCurrentPage,
  };

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
          { title: 'Dashboard', href: '/manager' },
          { title: 'Manajemen Toko', href: '/manager/stores' },
          { title: 'Toko Lanjutan', href: '/manager/stores/advanced' },
        ]}
        darkMode={darkMode}
      />
      
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Manajemen Toko Lanjutan
        </h1>
        <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Kelola toko dengan fitur pencarian dan filter lanjutan
        </p>
      </div>

      {(error || successMessage) && (
        <div className={`mb-6 p-4 rounded-lg ${
          error 
            ? (darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700') 
            : (darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700')
        }`}>
          {error || successMessage}
        </div>
      )}

      <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
        <DataTable
          data={stores}
          columns={columns}
          loading={loading}
          onAdd={handleAddStore}
          onSearch={setSearchTerm}
          darkMode={darkMode}
          showAdd={true}
          pagination={paginationData}
          mobileColumns={['name', 'status']}
          selectedRows={selectedRows}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          isAllSelected={stores.length > 0 && stores.every(s => selectedRows.includes(s.id))}
          filterOptions={filterOptions}
          filterValues={filters}
          onFilterChange={setFilters}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          rowActions={(store) => (
            <div className="flex space-x-2">
              <button
                onClick={() => handleEditStore(store)}
                className="p-1 text-blue-500 hover:text-blue-700"
                title="Edit"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={() => handleDeleteStore(store)}
                className="p-1 text-red-500 hover:text-red-700"
                title="Hapus"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}
        />
      </div>

      {/* Modal untuk tambah/edit toko akan ditambahkan di sini */}
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-11/12 max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Konfirmasi Hapus Toko
            </h3>
            <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Apakah Anda yakin ingin menghapus toko <strong>"{storeToDelete?.name}"</strong>? 
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}