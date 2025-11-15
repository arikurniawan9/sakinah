// components/admin/ExpenseTable.js
import { useState } from 'react';
import { Search, Plus, Edit, Trash2, Folder, Download, Printer } from 'lucide-react';

export default function ExpenseTable({
  expenses = [],
  categories = [],
  loading = false,
  error = null,
  searchTerm = '',
  setSearchTerm = () => {},
  startDate = '',
  setStartDate = () => {},
  endDate = '',
  setEndDate = () => {},
  itemsPerPage = 10,
  setItemsPerPage = () => {},
  currentPage = 1,
  setCurrentPage = () => {},
  totalPages = 1,
  totalExpenses = 0,
  startIndex = 1,
  endIndex = 10,
  darkMode = false,
  onAdd = () => {},
  onEdit = () => {},
  onDelete = () => {},
  onManageCategories = () => {},
  selectedRows = [],
  setSelectedRows = () => {},
  onPrint = () => {}, // Handler for print functionality
  onExport = () => {} // Handler for export functionality
}) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const handleDeleteClick = (id) => {
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      await onDelete(Array.isArray(itemToDelete) ? itemToDelete : [itemToDelete]);
      setItemToDelete(null);
      setShowDeleteModal(false);
    }
  };

  const handleDeleteMultiple = () => {
    if (selectedRows.length > 0) {
      setItemToDelete(selectedRows);
      setShowDeleteModal(true);
    }
  };

  const handleSelectAll = () => {
    if (selectedRows.length === expenses.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(expenses.map(exp => exp.id));
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows(prev =>
      prev.includes(id)
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Kategori Tidak Dikenal';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const tableHeaderClass = `px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
    darkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'
  }`;

  const tableCellClass = `whitespace-nowrap px-6 py-4 text-sm ${
    darkMode ? 'text-gray-300' : 'text-gray-900'
  }`;

  return (
    <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
      {/* Filter Bar */}
      <div className={`p-4 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari pengeluaran..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 pr-4 py-2 border rounded-md w-full ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Tanggal Mulai
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Tanggal Akhir
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>

          <div className="flex items-end space-x-2">
            <button
              onClick={() => {
                // Apply filters
                setCurrentPage(1); // Reset to first page when applying filters
              }}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                darkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Filter
            </button>
            <button
              onClick={() => {
                // Reset all filters
                setSearchTerm('');
                setStartDate('');
                setEndDate('');
                setCurrentPage(1);
              }}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                darkMode
                  ? 'bg-gray-600 hover:bg-gray-500 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-grow">
            {selectedRows.length > 0 && (
              <button
                onClick={handleDeleteMultiple}
                className={`p-2 rounded-lg ${
                  darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-600 hover:bg-red-700'
                } text-white transition-all duration-200 hover:scale-105`}
                title={`Hapus (${selectedRows.length})`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex space-x-2">
            <button
              onClick={onPrint}
              className={`p-2 rounded-lg ${
                darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 hover:bg-green-700'
              } text-white transition-all duration-200 hover:scale-105`}
              title="Cetak Laporan"
            >
              <Printer className="h-4 w-4" />
            </button>
            <button
              onClick={onExport}
              className={`p-2 rounded-lg ${
                darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-600 hover:bg-red-700'
              } text-white transition-all duration-200 hover:scale-105`}
              title="Ekspor Laporan PDF"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={onManageCategories}
              className={`p-2 rounded-lg ${
                darkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-600 hover:bg-purple-700'
              } text-white transition-all duration-200 hover:scale-105`}
              title="Kelola Kategori"
            >
              <Folder className="h-4 w-4" />
            </button>
            <button
              onClick={onAdd}
              className={`p-2 rounded-lg ${
                darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
              } text-white transition-all duration-200 hover:scale-105`}
              title="Tambah Pengeluaran"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
            <tr>
              <th scope="col" className="w-12 px-6 py-3">
                <input
                  type="checkbox"
                  className={`rounded ${
                    darkMode ? 'border-gray-600 text-blue-600' : 'border-gray-300 text-blue-600'
                  } focus:ring-blue-500`}
                  checked={selectedRows.length > 0 && selectedRows.length === expenses.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th scope="col" className={`${tableHeaderClass}`}>Kategori</th>
              <th scope="col" className={`${tableHeaderClass}`}>Deskripsi</th>
              <th scope="col" className={`${tableHeaderClass}`}>Jumlah</th>
              <th scope="col" className={`${tableHeaderClass}`}>Tanggal</th>
              <th scope="col" className={`${tableHeaderClass}`}>Dibuat Oleh</th>
              <th scope="col" className={`${tableHeaderClass} text-right`}>Aksi</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${darkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}`}>
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center">
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                    <span className={`ml-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Memuat pengeluaran...</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center">
                  <div className={`p-4 rounded-lg ${
                    darkMode ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-700'
                  }`}>
                    {error}
                  </div>
                </td>
              </tr>
            ) : expenses && expenses.length > 0 ? (
              expenses.map((expense) => (
                <tr key={expense.id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className={`rounded ${
                        darkMode ? 'border-gray-600 text-blue-600' : 'border-gray-300 text-blue-600'
                      } focus:ring-blue-500`}
                      checked={selectedRows.includes(expense.id)}
                      onChange={() => handleSelectRow(expense.id)}
                    />
                  </td>
                  <td className={tableCellClass}>
                    <div className="flex items-center">
                      <Folder className="h-4 w-4 mr-2 text-blue-500" />
                      <span>{getCategoryName(expense.expenseCategoryId)}</span>
                    </div>
                  </td>
                  <td className={tableCellClass}>
                    <span>{expense.description || '-'}</span>
                  </td>
                  <td className={tableCellClass}>
                    <span className="font-medium">{formatCurrency(expense.amount)}</span>
                  </td>
                  <td className={tableCellClass}>
                    <span>{formatDate(expense.date)}</span>
                  </td>
                  <td className={tableCellClass}>
                    <span>{expense.user?.name || 'N/A'}</span>
                  </td>
                  <td className={`${tableCellClass} text-right`}>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => onEdit(expense)}
                        className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110 ${
                          darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-900'
                        }`}
                        title="Edit Pengeluaran"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(expense.id)}
                        className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110 ${
                          darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-900'
                        }`}
                        title="Hapus Pengeluaran"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className={`px-6 py-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Tidak ada pengeluaran ditemukan
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className={`px-6 py-3 border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Menampilkan {startIndex} - {endIndex} dari {totalExpenses} pengeluaran
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded ${
                currentPage === 1
                  ? 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Sebelumnya
            </button>
            <span className={`px-3 py-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {currentPage} dari {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded ${
                currentPage === totalPages
                  ? 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className={`rounded-xl shadow-lg w-full max-w-md ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`p-6 rounded-t-xl ${
              darkMode ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <div className="flex justify-between items-center">
                <h3 className={`text-lg font-semibold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Konfirmasi Hapus
                </h3>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setItemToDelete(null);
                  }}
                  className={`p-1 rounded-full ${
                    darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {Array.isArray(itemToDelete)
                  ? `Apakah Anda yakin ingin menghapus ${itemToDelete.length} pengeluaran ini?`
                  : 'Apakah Anda yakin ingin menghapus pengeluaran ini?'}
              </p>
            </div>

            <div className={`p-6 rounded-b-xl flex justify-end space-x-3 ${
              darkMode ? 'bg-gray-800 border-t border-gray-700' : 'bg-gray-50 border-t border-gray-200'
            }`}>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setItemToDelete(null);
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  darkMode
                    ? 'bg-gray-600 text-white hover:bg-gray-500'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}