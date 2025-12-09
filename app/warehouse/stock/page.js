'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useUserTheme } from '../../../components/UserThemeContext';
import { useSession } from 'next-auth/react';
import DataTable from '../../../components/DataTable';
import Breadcrumb from '../../../components/Breadcrumb';
import { Package, Search, Plus, Edit, Trash2, AlertTriangle, PlusCircle } from 'lucide-react';
import ConfirmationModal from '../../../components/ConfirmationModal';

export default function WarehouseStockPage() {
  const { data: session } = useSession();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pagination, setPagination] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);

  // Fetch warehouse stocks
  useEffect(() => {
    fetchWarehouseStocks();
  }, [currentPage, itemsPerPage, searchTerm]);

  const fetchWarehouseStocks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const response = await fetch(`/api/warehouse/stock?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch warehouse stocks');
      }

      setStocks(data.warehouseProducts || []);
      setPagination(data.pagination || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allRowIds = stocks.map(s => s.id);
      setSelectedRows(allRowIds);
    } else {
      setSelectedRows([]);
    }
  };

  const handleDelete = (id) => {
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      const response = await fetch(`/api/warehouse/stock/${itemToDelete}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (response.ok) {
        setShowDeleteModal(false);
        setItemToDelete(null);
        fetchWarehouseStocks(); // Refresh the list
      } else {
        throw new Error(result.error || 'Failed to delete warehouse stock');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const columns = [
    {
      key: 'no',
      title: 'No.',
      render: (_, __, index) => (currentPage - 1) * itemsPerPage + index + 1,
    },
    {
      key: 'product.id',
      title: 'ID Produk',
      sortable: true,
      render: (value) => value,
    },
    {
      key: 'product.name',
      title: 'Nama Produk',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {row.product.productCode}
          </div>
        </div>
      )
    },
    {
      key: 'quantity',
      title: 'Stok',
      render: (value) => value.toLocaleString('id-ID'),
      sortable: true
    },
    {
      key: 'product.purchasePrice',
      title: 'Harga Beli',
      render: (value) => `Rp ${value?.toLocaleString('id-ID') || '0'}`,
      sortable: true
    },
    {
      key: 'product.category.name',
      title: 'Kategori',
      sortable: true
    },
    {
      key: 'product.supplier.name',
      title: 'Supplier',
      sortable: true
    },
    {
      key: 'reserved',
      title: 'Reserved',
      render: (value) => value.toLocaleString('id-ID'),
      sortable: true
    },
    {
      key: 'createdAt',
      title: 'Tanggal Dibuat',
      render: (value) => new Date(value).toLocaleDateString('id-ID'),
      sortable: true
    },
  ];

  const renderRowActions = (row) => (
    <div className="flex space-x-2">
      <button
        onClick={() => {
          // Create a prompt for quantity to add
          const quantityToAdd = prompt('Masukkan jumlah stok yang akan ditambahkan:');
          if (quantityToAdd !== null) {
            const qty = parseInt(quantityToAdd);
            if (!isNaN(qty) && qty > 0) {
              handleAddStock(row.id, qty);
            } else {
              showNotification('Jumlah stok harus berupa angka positif', 'error');
            }
          }
        }}
        className="p-2 text-green-500 hover:text-green-700 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30"
        title="Tambah Stok"
      >
        <Plus size={20} />
      </button>
      <button
        onClick={() => handleDelete(row.id)}
        className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30"
        title="Hapus Stok"
      >
        <Trash2 size={20} />
      </button>
    </div>
  );

  const paginationData = {
    currentPage: pagination.currentPage || 1,
    totalPages: pagination.totalPages || 1,
    totalItems: pagination.total || 0,
    startIndex: pagination.startIndex || 1,
    endIndex: pagination.endIndex || 0,
    onPageChange: setCurrentPage,
    itemsPerPage: itemsPerPage
  };

  const statusCardData = [
    {
      title: "Total Produk",
      value: pagination.total || stocks.length || 0,
      icon: Package,
      color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    },
    {
      title: "Total Stok",
      value: stocks.reduce((sum, item) => sum + item.quantity, 0).toLocaleString('id-ID'),
      icon: Package,
      color: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    },
    {
      title: "Kategori Unik",
      value: [...new Set(stocks.map(item => item.product.category?.name))].length,
      icon: Package,
      color: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    },
  ];

  // Function to add stock directly
  const handleAddStock = async (warehouseProductId, quantityToAdd) => {
    if (!quantityToAdd || quantityToAdd <= 0) {
      showNotification('Jumlah stok harus lebih besar dari 0', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/warehouse/stock/${warehouseProductId}`, {
        method: 'PUT', // Using PUT to update stock
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addQuantity: quantityToAdd // This will be added to existing stock
        })
      });

      const result = await response.json();

      if (response.ok) {
        showNotification('Stok berhasil ditambahkan', 'success');
        fetchWarehouseStocks(); // Refresh the list
      } else {
        throw new Error(result.error || 'Gagal menambahkan stok');
      }
    } catch (error) {
      showNotification(`Gagal: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="WAREHOUSE">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb
          items={[
            { title: 'Dashboard Gudang', href: '/warehouse' },
            { title: 'Stok Gudang', href: '/warehouse/stock' }
          ]}
          darkMode={darkMode}
        />

        <div className="mb-6">
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Manajemen Stok Gudang
          </h1>
          <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Kelola stok produk di gudang pusat
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statusCardData.map((card, index) => (
            <div
              key={index}
              className={`rounded-xl shadow-lg p-6 flex items-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
            >
              <div className={`p-3 rounded-full ${card.color}`}>
                <card.icon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {card.title}
                </p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {card.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => window.location.href = '/warehouse/purchase'}
            className={`px-4 py-2 rounded-lg flex items-center ${
              darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Tambah Produk via Pembelian
          </button>
        </div>

        {/* Data Table */}
        <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
          <DataTable
            data={stocks}
            columns={columns}
            loading={loading}
            onSearch={setSearchTerm}
            onItemsPerPageChange={setItemsPerPage}
            darkMode={darkMode}
            pagination={paginationData}
            mobileColumns={['product.name', 'quantity', 'product.purchasePrice']}
            rowActions={renderRowActions}
            emptyMessage="Tidak ada stok gudang ditemukan"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 rounded-lg bg-red-100 border border-red-400 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setItemToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Konfirmasi Hapus Stok"
          message="Apakah Anda yakin ingin menghapus stok ini dari gudang? Tindakan ini tidak dapat dibatalkan."
        />
      </main>
    </ProtectedRoute>
  );
}