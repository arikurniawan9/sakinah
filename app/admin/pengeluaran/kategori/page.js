// app/admin/pengeluaran/kategori/page.js
'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useDarkMode } from '@/components/DarkModeContext';
import { useSession } from 'next-auth/react';
import ExpenseCategoryTable from '@/components/admin/ExpenseCategoryTable';
import ExpenseCategoryModal from '@/components/admin/ExpenseCategoryModal';
import Breadcrumb from '@/components/Breadcrumb';
import { toast } from 'react-toastify';
import { AlertTriangle, Plus, Search, Folder } from 'lucide-react';

export default function ExpenseCategoryManagement() {
  const { data: session } = useSession();
  const { darkMode } = useDarkMode();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCategories, setTotalCategories] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);

  // Fetch expense categories with pagination and search
  const fetchCategories = async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm
      });

      const response = await fetch(`/api/pengeluaran/kategori?${queryParams.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengambil data kategori pengeluaran');
      }

      setCategories(data.categories || []);
      setTotalCategories(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching categories:', err);
      toast.error('Gagal mengambil data kategori: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load data when dependencies change
  useEffect(() => {
    const loadData = async () => {
      await fetchCategories();
    };
    loadData();
  }, [currentPage, itemsPerPage, searchTerm]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Handlers
  const handleSaveCategory = async (categoryData) => {
    setModalLoading(true);
    try {
      const method = categoryData.id ? 'PUT' : 'POST';
      const endpoint = categoryData.id ? `/api/pengeluaran/kategori` : `/api/pengeluaran/kategori`;

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Gagal ${categoryData.id ? 'memperbarui' : 'menyimpan'} kategori`);
      }

      toast.success(`Kategori berhasil ${categoryData.id ? 'diperbarui' : 'disimpan'}`);
      setShowModal(false);
      setEditingCategory(null);
      await fetchCategories(); // Refresh data
      return result;
    } catch (err) {
      console.error(`Error ${editingCategory ? 'updating' : 'creating'} category:`, err);
      toast.error('Gagal menyimpan kategori: ' + err.message);
      return null;
    } finally {
      setModalLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setShowModal(true);
  };

  const handleDelete = async (categoryIds) => {
    try {
      const deletePromises = categoryIds.map(id =>
        fetch(`/api/pengeluaran/kategori?id=${id}`, {
          method: 'DELETE',
        })
      );

      const results = await Promise.all(deletePromises);
      const failedDeletes = results.filter(res => !res.ok);

      if (failedDeletes.length > 0) {
        const errors = await Promise.all(failedDeletes.map(res => res.json()));
        throw new Error(errors[0]?.error || 'Gagal menghapus sebagian kategori');
      }

      toast.success(`Berhasil menghapus ${categoryIds.length} kategori`);
      
      // Refresh data
      await fetchCategories();
      setSelectedRows([]); // Clear selection after deletion
    } catch (err) {
      console.error('Error deleting categories:', err);
      toast.error('Gagal menghapus kategori: ' + err.message);
    }
  };

  const handleCancelModal = () => {
    setShowModal(false);
    setEditingCategory(null);
  };

  // Calculate pagination indices
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalCategories);

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <main className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Breadcrumb
          items={[
            { title: 'Keuangan', href: '/admin/keuangan' },
            { title: 'Pengeluaran', href: '/admin/pengeluaran' },
            { title: 'Kategori', href: '/admin/pengeluaran/kategori' }
          ]}
          darkMode={darkMode}
        />

        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Manajemen Kategori Pengeluaran
              </h1>
              <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Kelola kategori untuk pengeluaran operasional dan kebutuhan belanja
              </p>
            </div>
          </div>
        </div>

        {/* Alert for errors */}
        {error && (
          <div className={`mb-4 p-4 rounded-lg flex items-center ${
            darkMode ? 'bg-red-900/30 text-red-200' : 'bg-red-50 text-red-700'
          }`}>
            <AlertTriangle className="h-5 w-5 mr-3" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Table */}
        <ExpenseCategoryTable
          categories={categories}
          loading={loading}
          error={error}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          totalCategories={totalCategories}
          startIndex={startIndex}
          endIndex={endIndex}
          darkMode={darkMode}
          
          // Handlers
          onAdd={() => setShowModal(true)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          
          // Selection state
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
        />

        {/* Modal */}
        <ExpenseCategoryModal
          show={showModal}
          onClose={handleCancelModal}
          category={editingCategory}
          onSave={handleSaveCategory}
          loading={modalLoading}
          darkMode={darkMode}
        />
      </main>
    </ProtectedRoute>
  );
}