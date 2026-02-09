'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ROLES } from '@/lib/constants';
import { useUserTheme } from '@/components/UserThemeContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import DataTable from '@/components/DataTable';
import Breadcrumb from '@/components/Breadcrumb';
import UserModal from '@/components/admin/UserModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import { Search, Plus, Edit, Trash2, Filter, Download, Upload } from 'lucide-react';

export default function ManagerWarehouseUserManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [stores, setStores] = useState([]);

  // Cek apakah pengguna adalah MANAGER
  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
      router.push('/unauthorized');
      return;
    }
    
    fetchUsers();
    fetchStores();
  }, [status, session, currentPage, itemsPerPage, searchTerm, router]);

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        role: 'WAREHOUSE' // Hanya ambil pengguna dengan role WAREHOUSE
      });

      const response = await fetch(`/api/manager/users?${params.toString()}`, {
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
      setUsers(data.users || []);
      setTotalUsers(data.total || 0);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Gagal mengambil data pengguna: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stores
  const fetchStores = async () => {
    try {
      const response = await fetch('/api/stores', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.user?.token || ''}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setStores(data.stores || []);
    } catch (err) {
      console.error('Error fetching stores:', err);
      // Jangan tampilkan error karena ini hanya untuk referensi
    }
  };

  // Handlers
  const handleAddUser = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      const response = await fetch(`/api/manager/users/${userToDelete.id}`, {
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

      setSuccessMessage('Pengguna berhasil dihapus');
      setShowDeleteModal(false);
      setUserToDelete(null);
      fetchUsers(); // Refresh data
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Gagal menghapus pengguna: ' + err.message);
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const handleSaveUser = async (userData) => {
    try {
      const url = editingUser ? `/api/manager/users/${editingUser.id}` : '/api/manager/users';
      const method = editingUser ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.user?.token || ''}`
        },
        body: JSON.stringify({
          ...userData,
          role: 'WAREHOUSE' // Pastikan role tetap WAREHOUSE
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setSuccessMessage(editingUser ? 'Pengguna berhasil diperbarui' : 'Pengguna berhasil ditambahkan');
      setShowModal(false);
      fetchUsers(); // Refresh data
      return result;
    } catch (err) {
      console.error('Error saving user:', err);
      setError('Gagal menyimpan pengguna: ' + err.message);
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
      setSelectedRows(users.map(u => u.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleDeleteMultiple = async () => {
    if (selectedRows.length === 0) return;
    
    if (!window.confirm(`Apakah Anda yakin ingin menghapus ${selectedRows.length} pengguna?`)) {
      return;
    }
    
    try {
      const response = await fetch('/api/manager/users/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.user?.token || ''}`
        },
        body: JSON.stringify({ ids: selectedRows })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      setSuccessMessage(`Berhasil menghapus ${selectedRows.length} pengguna`);
      setSelectedRows([]);
      fetchUsers(); // Refresh data
    } catch (err) {
      console.error('Error deleting multiple users:', err);
      setError('Gagal menghapus pengguna: ' + err.message);
    }
  };

  // Columns configuration
  const columns = [
    {
      key: 'no',
      title: 'No.',
      render: (_, __, index) => (currentPage - 1) * itemsPerPage + index + 1,
    },
    { key: 'employeeNumber', title: 'Kode Karyawan', sortable: true },
    { key: 'name', title: 'Nama', sortable: true },
    { key: 'username', title: 'Username', sortable: true },
    {
      key: 'role',
      title: 'Role',
      render: (value) => (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          {value}
        </span>
      )
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
      )
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
    totalPages: Math.ceil(totalUsers / itemsPerPage),
    totalItems: totalUsers,
    onPageChange: setCurrentPage,
  };

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
          { title: 'Manajemen Pengguna', href: '/manager/users' },
          { title: 'Pengguna Gudang', href: '/manager/warehouse-users' },
        ]}
        basePath="/manager"
        darkMode={darkMode}
      />
      
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Manajemen Pengguna Gudang
        </h1>
        <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Kelola pengguna dengan role gudang
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
          data={users}
          columns={columns}
          loading={loading}
          onAdd={handleAddUser}
          onSearch={setSearchTerm}
          darkMode={darkMode}
          showAdd={true}
          pagination={paginationData}
          mobileColumns={['name', 'role', 'status']}
          selectedRows={selectedRows}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          isAllSelected={users.length > 0 && users.every(u => selectedRows.includes(u.id))}
          onDeleteMultiple={selectedRows.length > 0 ? handleDeleteMultiple : undefined}
          selectedRowsCount={selectedRows.length}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          rowActions={(user) => (
            <div className="flex space-x-2">
              <button
                onClick={() => handleEditUser(user)}
                className="p-1 text-blue-500 hover:text-blue-700"
                title="Edit"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={() => handleDeleteUser(user)}
                className="p-1 text-red-500 hover:text-red-700"
                title="Hapus"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}
        />
      </div>

      {/* User Modal */}
      <UserModal
        showModal={showModal}
        closeModal={() => setShowModal(false)}
        handleSave={handleSaveUser}
        formData={editingUser || {}}
        handleInputChange={() => {}} // Tidak digunakan karena kita menggunakan form bawaan
        editingUser={editingUser}
        error={error}
        setFormError={setError}
        darkMode={darkMode}
        stores={stores}
        isManagerContext={true}
        defaultRole="WAREHOUSE"
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Konfirmasi Hapus Pengguna"
        message={`Apakah Anda yakin ingin menghapus pengguna "${userToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
      />
    </main>
  );
}