'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ROLES } from '@/lib/constants';
import { useUserTheme } from '@/components/UserThemeContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import DataTable from '@/components/DataTable';
import Breadcrumb from '@/components/Breadcrumb';
import SupplierModal from '@/components/warehouse/SupplierModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import { Search, Plus, Edit, Trash2, Package, Phone, Mail, MapPin } from 'lucide-react';

export default function SupplierManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch suppliers
  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || session.user.role !== ROLES.WAREHOUSE) {
      router.push('/unauthorized');
      return;
    }

    const fetchSuppliers = async () => {
      setLoading(true);
      setError('');
      
      try {
        const params = new URLSearchParams({
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm
        });

        const response = await fetch(`/api/warehouse/suppliers?${params.toString()}`);
        
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
        setSuppliers(data.suppliers || []);
        setTotalItems(data.total || 0);
      } catch (err) {
        console.error('Error fetching suppliers:', err);
        setError('Gagal mengambil data supplier: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, [status, session, currentPage, itemsPerPage, searchTerm, router]);

  // Handlers
  const handleAddSupplier = () => {
    setEditingSupplier(null);
    setShowModal(true);
  };

  const handleEditSupplier = (supplier) => {
    setEditingSupplier(supplier);
    setShowModal(true);
  };

  const handleDeleteSupplier = (supplier) => {
    setSupplierToDelete(supplier);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!supplierToDelete) return;
    
    try {
      const response = await fetch(`/api/warehouse/suppliers/${supplierToDelete.id}`, {
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

      setSuccessMessage('Supplier berhasil dihapus');
      setShowDeleteModal(false);
      setSupplierToDelete(null);
      // Refresh data
      const fetchSuppliers = async () => {
        setLoading(true);
        try {
          const params = new URLSearchParams({
            page: currentPage,
            limit: itemsPerPage,
            search: searchTerm
          });

          const response = await fetch(`/api/warehouse/suppliers?${params.toString()}`);
          const data = await response.json();
          setSuppliers(data.suppliers || []);
          setTotalItems(data.total || 0);
        } catch (err) {
          setError('Gagal mengambil data supplier: ' + err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchSuppliers();
    } catch (err) {
      console.error('Error deleting supplier:', err);
      setError('Gagal menghapus supplier: ' + err.message);
      setShowDeleteModal(false);
      setSupplierToDelete(null);
    }
  };

  const handleSaveSupplier = async (supplierData) => {
    try {
      const url = editingSupplier ? `/api/warehouse/suppliers/${editingSupplier.id}` : '/api/warehouse/suppliers';
      const method = editingSupplier ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.user?.token || ''}`
        },
        body: JSON.stringify(supplierData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setSuccessMessage(editingSupplier ? 'Supplier berhasil diperbarui' : 'Supplier berhasil ditambahkan');
      setShowModal(false);
      // Refresh data
      const fetchSuppliers = async () => {
        setLoading(true);
        try {
          const params = new URLSearchParams({
            page: currentPage,
            limit: itemsPerPage,
            search: searchTerm
          });

          const response = await fetch(`/api/warehouse/suppliers?${params.toString()}`);
          const data = await response.json();
          setSuppliers(data.suppliers || []);
          setTotalItems(data.total || 0);
        } catch (err) {
          setError('Gagal mengambil data supplier: ' + err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchSuppliers();
      return result;
    } catch (err) {
      console.error('Error saving supplier:', err);
      setError('Gagal menyimpan supplier: ' + err.message);
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
      setSelectedRows(suppliers.map(s => s.id));
    } else {
      setSelectedRows([]);
    }
  };

  // Columns configuration for the DataTable
  const columns = [
    {
      key: 'no',
      title: 'No.',
      render: (_, __, index) => (currentPage - 1) * itemsPerPage + index + 1,
    },
    { 
      key: 'name', 
      title: 'Nama Supplier', 
      sortable: true,
      className: 'font-medium'
    },
    {
      key: 'contactPerson',
      title: 'Kontak',
      render: (value, supplier) => (
        <div>
          <div>{value || '-'}</div>
          <div className="text-xs text-gray-500">{supplier.position || '-'}</div>
        </div>
      )
    },
    {
      key: 'phone',
      title: 'Telepon',
      render: (value) => (
        <div className="flex items-center">
          <Phone className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
          <span>{value || '-'}</span>
        </div>
      )
    },
    {
      key: 'email',
      title: 'Email',
      render: (value) => (
        <div className="flex items-center">
          <Mail className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
          <span>{value || '-'}</span>
        </div>
      )
    },
    {
      key: 'address',
      title: 'Alamat',
      render: (value) => (
        <div className="flex items-start">
          <MapPin className="h-4 w-4 mr-1 mt-0.5 text-gray-500 dark:text-gray-400" />
          <span className="text-sm">{value || '-'}</span>
        </div>
      )
    }
  ];

  // Row actions
  const rowActions = (supplier) => (
    <div className="flex space-x-2">
      <button
        onClick={() => handleEditSupplier(supplier)}
        className={`p-1.5 rounded-md ${darkMode ? 'text-yellow-400 hover:bg-gray-700' : 'text-yellow-600 hover:bg-gray-200'}`}
        title="Edit"
      >
        <Edit className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleDeleteSupplier(supplier)}
        className={`p-1.5 rounded-md ${darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-gray-200'}`}
        title="Hapus"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

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
          { title: 'Manajemen Supplier', href: '/warehouse/suppliers' },
        ]}
        darkMode={darkMode}
      >
        <div className="flex items-center">
          <Package className={`h-8 w-8 mr-3 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Manajemen Supplier
            </h1>
            <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Kelola informasi supplier dan hubungan bisnis
            </p>
          </div>
        </div>
      </Breadcrumb>

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
          data={suppliers}
          columns={columns}
          loading={loading}
          onAdd={handleAddSupplier}
          onSearch={setSearchTerm}
          darkMode={darkMode}
          showAdd={true}
          pagination={paginationData}
          mobileColumns={['name', 'phone', 'email']}
          selectedRows={selectedRows}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          isAllSelected={suppliers.length > 0 && suppliers.every(s => selectedRows.includes(s.id))}
          rowActions={rowActions}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </div>

      {/* Supplier Modal */}
      <SupplierModal
        showModal={showModal}
        closeModal={() => setShowModal(false)}
        handleSave={handleSaveSupplier}
        formData={editingSupplier || {}}
        handleInputChange={() => {}} // Tidak digunakan karena kita menggunakan form bawaan
        editingSupplier={editingSupplier}
        error={error}
        setFormError={setError}
        darkMode={darkMode}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Konfirmasi Hapus Supplier"
        message={`Apakah Anda yakin ingin menghapus supplier "${supplierToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
      />
    </main>
  );
}