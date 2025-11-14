'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useDarkMode } from '@/components/DarkModeContext';
import { useSession } from 'next-auth/react';
import { useCategoryForm } from '@/lib/hooks/useCategoryForm';
import { useCategoryTable } from '@/lib/hooks/useCategoryTable';
import CategoryModal from '@/components/kategori/CategoryModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import { AlertTriangle, CheckCircle, Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import DataTable from '@/components/DataTable';
import Breadcrumb from '@/components/Breadcrumb';

export default function CategoryManagementPage() {
  const { darkMode } = useDarkMode();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  // Use the new category table hook
  const {
    categories,
    loading,
    error: tableError,
    searchTerm,
    setSearchTerm,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    totalCategories,
    fetchCategories,
    setError: setTableError,
  } = useCategoryTable();

  const {
    showModal,
    editingCategory,
    formData,
    setFormData, // Expose setFormData to handle icon change
    error: formError,
    setError: setFormError,
    handleInputChange,
    openModalForEdit,
    openModalForCreate,
    closeModal,
    handleSave: originalHandleSave,
  } = useCategoryForm(fetchCategories);

  const [success, setSuccess] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Wrapper to clear success message on save
  const handleSave = async () => {
    setSuccess(''); // Clear previous success message
    const result = await originalHandleSave();
    if (result.success) {
      setSuccess('Kategori berhasil disimpan!');
    }
  };

  // New handler for IconPicker
  const handleIconChange = (iconName) => {
    setFormData(prev => ({ ...prev, icon: iconName }));
  };

  const handleDelete = (id) => {
    if (!isAdmin) return;
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete || !isAdmin) return;
    setIsDeleting(true);
    setSuccess('');
    setTableError('');

    try {
      const response = await fetch(`/api/kategori?id=${itemToDelete}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal menghapus kategori');

      setSuccess('Kategori berhasil dihapus.');
      // Refresh data
      setCurrentPage(1);
      fetchCategories();
    } catch (err) {
      setTableError(err.message);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  // Clear messages after a delay
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
    if (tableError) {
      const timer = setTimeout(() => setTableError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success, tableError]);

  // Reset to first page when itemsPerPage changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Define columns for DataTable
  const columns = [
    {
      key: 'name',
      title: 'Nama',
      sortable: true
    },
    {
      key: 'description',
      title: 'Deskripsi',
      render: (value) => value || '-',
      sortable: true
    },
    {
      key: 'createdAt',
      title: 'Tanggal Dibuat',
      render: (value) => new Date(value).toLocaleDateString('id-ID'),
      sortable: true
    },
    {
      key: 'updatedAt',
      title: 'Tanggal Diubah',
      render: (value) => new Date(value).toLocaleDateString('id-ID'),
      sortable: true
    }
  ];

  // Enhanced data with action handlers
  const enhancedCategories = categories.map(category => ({
    ...category,
    onViewDetails: (cat) => console.log('View details', cat), // Placeholder for now
    onEdit: isAdmin ? () => openModalForEdit(category) : undefined,
    onDelete: isAdmin ? () => handleDelete(category.id) : undefined
  }));

  // Pagination data for DataTable
  const paginationData = {
    currentPage,
    totalPages,
    totalItems: totalCategories,
    startIndex: (currentPage - 1) * itemsPerPage + 1,
    endIndex: Math.min(currentPage * itemsPerPage, totalCategories),
    onPageChange: setCurrentPage,
    itemsPerPage: itemsPerPage
  };

  const error = tableError || formError;

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <main className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${darkMode ? 'bg-gray-900' : 'bg-gray-950'}`}>
        <Breadcrumb
          items={[{ title: 'Kategori', href: '/admin/kategori' }]}
          darkMode={darkMode}
        />

        <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Manajemen Kategori
        </h1>

        <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
          <DataTable
            data={enhancedCategories}
            columns={columns}
            loading={loading}
            selectedRows={[]}
            onSelectAll={undefined}
            onSelectRow={undefined}
            onAdd={isAdmin ? openModalForCreate : undefined}
            onSearch={setSearchTerm}
            onExport={undefined} // No export function yet
            onItemsPerPageChange={setItemsPerPage}
            darkMode={darkMode}
            actions={isAdmin}
            showToolbar={true}
            showAdd={isAdmin}
            showExport={false}
            showItemsPerPage={true}
            pagination={paginationData}
            mobileColumns={['name', 'description']} // Show key information on mobile
          />
        </div>

        {/* Alerts */}
        {error && (
          <div className="fixed bottom-4 right-4 z-50 flex items-center p-4 rounded-lg bg-red-500/10 text-red-400 shadow-lg">
            <AlertTriangle className="h-5 w-5 mr-3" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        {success && (
          <div className="fixed bottom-4 right-4 z-50 flex items-center p-4 rounded-lg bg-green-500/10 text-green-400 shadow-lg">
            <CheckCircle className="h-5 w-5 mr-3" />
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}

        {/* Modals */}
        {isAdmin && (
          <>
            <CategoryModal
              showModal={showModal}
              closeModal={closeModal}
              handleSave={handleSave}
              formData={formData}
              handleInputChange={handleInputChange}
              handleIconChange={handleIconChange} // Pass the new handler
              editingCategory={editingCategory}
              error={formError}
              setFormError={setFormError}
              darkMode={darkMode}
            />
            <ConfirmationModal
              isOpen={showDeleteModal}
              onClose={() => setShowDeleteModal(false)}
              onConfirm={handleConfirmDelete}
              title="Konfirmasi Hapus"
              message={`Apakah Anda yakin ingin menghapus kategori ini? Semua produk terkait harus dipindahkan terlebih dahulu.`}
              isLoading={isDeleting}
            />
          </>
        )}
      </main>
    </ProtectedRoute>
  );
}