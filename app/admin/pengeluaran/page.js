// app/admin/pengeluaran/page.js
'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useDarkMode } from '@/components/DarkModeContext';
import { useSession } from 'next-auth/react';
import ExpenseTable from '@/components/admin/ExpenseTable';
import ExpenseForm from '@/components/admin/ExpenseForm';
import ExpenseCategoryModal from '@/components/admin/ExpenseCategoryModal';
import Breadcrumb from '@/components/Breadcrumb';
import { toast } from 'react-toastify';
import { AlertTriangle, Plus } from 'lucide-react';

export default function ExpenseManagement() {
  const { data: session } = useSession();
  const { darkMode } = useDarkMode();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);

  // Fetch expenses with pagination and search
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm
      });

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/pengeluaran?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengambil data pengeluaran');
      }

      setExpenses(data.expenses || []);
      setTotalExpenses(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching expenses:', err);
      toast.error('Gagal mengambil data pengeluaran: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch expense categories
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/pengeluaran/kategori');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengambil kategori pengeluaran');
      }

      setCategories(data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      toast.error('Gagal mengambil kategori pengeluaran: ' + err.message);
    }
  };

  // Initial data loading
  useEffect(() => {
    const loadData = async () => {
      await Promise.allSettled([
        fetchExpenses(),
        fetchCategories()
      ]);
    };
    loadData();
  }, [currentPage, itemsPerPage, searchTerm, startDate, endDate]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate]);

  // Handler for saving expense
  const handleSaveExpense = async (expenseData) => {
    setFormLoading(true);
    try {
      const method = expenseData.id ? 'PUT' : 'POST';
      const endpoint = expenseData.id ? `/api/pengeluaran` : `/api/pengeluaran`;

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...expenseData, amount: parseInt(expenseData.amount) }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Gagal ${expenseData.id ? 'memperbarui' : 'menyimpan'} pengeluaran`);
      }

      toast.success(`Pengeluaran berhasil ${expenseData.id ? 'diperbarui' : 'disimpan'}`);
      setShowForm(false);
      setEditingExpense(null);
      await fetchExpenses();
      await fetchCategories();
      return result;
    } catch (err) {
      console.error('Error saving expense:', err);
      toast.error('Gagal menyimpan pengeluaran: ' + err.message);
      return null;
    } finally {
      setFormLoading(false);
    }
  };

  // Handler for editing expense
  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  // Handler for deleting expenses
  const handleDelete = async (ids) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus ${ids.length > 1 ? 'pengeluaran-pengeluaran' : 'pengeluaran'} ini?`)) {
      return;
    }

    try {
      const deletePromises = ids.map(id =>
        fetch(`/api/pengeluaran?id=${id}`, {
          method: 'DELETE',
        })
      );

      const results = await Promise.all(deletePromises);
      const failedDeletes = results.filter(res => !res.ok);

      if (failedDeletes.length > 0) {
        const errors = await Promise.all(failedDeletes.map(res => res.json()));
        throw new Error(errors[0]?.error || 'Gagal menghapus sebagian pengeluaran');
      }

      toast.success(`Berhasil menghapus ${ids.length} pengeluaran`);

      // Refresh data
      await fetchExpenses();
      await fetchCategories();
    } catch (err) {
      console.error('Error deleting expenses:', err);
      toast.error('Gagal menghapus pengeluaran: ' + err.message);
    }
  };

  // Calculate pagination indices
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalExpenses);

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <main className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Breadcrumb
          items={[{ title: 'Pengeluaran', href: '/admin/pengeluaran' }]}
          darkMode={darkMode}
        />

        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Manajemen Pengeluaran
              </h1>
              <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Kelola pengeluaran operasional dan kebutuhan belanja lainnya
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Pengeluaran
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className={`mb-4 p-4 rounded-lg flex items-center ${
            darkMode ? 'bg-red-900/30 text-red-200' : 'bg-red-50 text-red-700'
          }`}>
            <AlertTriangle className="h-5 w-5 mr-3" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Conditional Rendering: Form or Table */}
        {showForm ? (
          <ExpenseForm
            expense={editingExpense}
            onSave={handleSaveExpense}
            onCancel={() => {
              setShowForm(false);
              setEditingExpense(null);
            }}
            loading={formLoading}
            darkMode={darkMode}
            expenseCategories={categories}
          />
        ) : (
          <ExpenseTable
            expenses={expenses}
            categories={categories}
            loading={loading}
            error={error}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            totalExpenses={totalExpenses}
            startIndex={startIndex}
            endIndex={endIndex}
            darkMode={darkMode}
            onAdd={() => setShowForm(true)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onManageCategories={() => setCategoryModalOpen(true)}
          />
        )}

        <ExpenseCategoryModal
          isOpen={isCategoryModalOpen}
          onClose={() => {
            setCategoryModalOpen(false);
            fetchCategories(); // Refresh categories when modal closes
            fetchExpenses(); // Refresh expenses in case category names changed
          }}
          darkMode={darkMode}
        />
      </main>
    </ProtectedRoute>
  );
}