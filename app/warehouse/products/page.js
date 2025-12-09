'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useUserTheme } from '../../../components/UserThemeContext';
import { useSession } from 'next-auth/react';
import DataTable from '../../../components/DataTable';
import Breadcrumb from '../../../components/Breadcrumb';
import { Package, Search, Plus, Edit, Trash2, AlertTriangle, PlusCircle, User, Calendar } from 'lucide-react';
import ConfirmationModal from '../../../components/ConfirmationModal';

export default function WarehouseProductsPage() {
  const { data: session } = useSession();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pagination, setPagination] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Fetch warehouse products
  useEffect(() => {
    fetchWarehouseProducts();
  }, [currentPage, itemsPerPage, searchTerm]);

  const fetchWarehouseProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      // Fetch warehouse products - these are products created specifically in warehouse
      const response = await fetch(`/api/warehouse/products?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch warehouse products');
      }

      setProducts(data.products || []);
      setPagination(data.pagination || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    setItemToDelete(productId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      const response = await fetch(`/api/warehouse/products/${itemToDelete}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (response.ok) {
        setShowDeleteModal(false);
        setItemToDelete(null);
        fetchWarehouseProducts(); // Refresh the list
      } else {
        throw new Error(result.error || 'Failed to delete product');
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
      key: 'name',
      title: 'Nama Produk',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {row.productCode}
          </div>
        </div>
      )
    },
    {
      key: 'categoryId',
      title: 'Kategori',
      render: (value, row) => row.category?.name || 'N/A',
      sortable: true
    },
    {
      key: 'supplierId',
      title: 'Supplier',
      render: (value, row) => row.supplier?.name || 'N/A',
      sortable: true
    },
    {
      key: 'stock',
      title: 'Stok',
      render: (value) => value?.toLocaleString('id-ID'),
      sortable: true
    },
    {
      key: 'purchasePrice',
      title: 'Harga Beli',
      render: (value) => `Rp ${value?.toLocaleString('id-ID') || '0'}`,
      sortable: true
    },
    {
      key: 'createdBy',
      title: 'Dibuat Oleh',
      render: (value, row) => (
        <div className="flex items-center">
          <User className="h-4 w-4 mr-1" />
          <span>{row.user?.name || row.createdBy || 'N/A'}</span>
        </div>
      ),
      sortable: true
    },
    {
      key: 'storeId',
      title: 'Sumber',
      render: (value, row) => (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          {row.storeId === 'WAREHOUSE_MASTER_STORE' ? 'Gudang' : 'Toko Lain'}
        </span>
      )
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
        onClick={() => handleDelete(row.id)}
        className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30"
        title="Hapus Produk"
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
      value: pagination.total || products.length || 0,
      icon: Package,
      color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    },
    {
      title: "Total Stok",
      value: products.reduce((sum, item) => sum + (item.stock || 0), 0).toLocaleString('id-ID'),
      icon: Package,
      color: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    },
    {
      title: "Dibuat oleh Gudang",
      value: products.filter(p => p.storeId === 'WAREHOUSE_MASTER_STORE').length,
      icon: User,
      color: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <ProtectedRoute requiredRole="WAREHOUSE">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb
          items={[
            { title: 'Dashboard Gudang', href: '/warehouse' },
            { title: 'Produk Gudang', href: '/warehouse/products' }
          ]}
          darkMode={darkMode}
        />

        <div className="mb-6">
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Produk Ditambahkan oleh Gudang
          </h1>
          <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Daftar produk yang ditambahkan secara langsung oleh admin gudang
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

        {/* Data Table */}
        <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
          <DataTable
            data={products}
            columns={columns}
            loading={loading}
            onSearch={setSearchTerm}
            onItemsPerPageChange={setItemsPerPage}
            darkMode={darkMode}
            pagination={paginationData}
            mobileColumns={['name', 'stock', 'purchasePrice']}
            rowActions={renderRowActions}
            emptyMessage="Tidak ada produk yang ditambahkan oleh gudang"
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
          title="Konfirmasi Hapus Produk"
          message="Apakah Anda yakin ingin menghapus produk ini? Tindakan ini akan menghapus produk dan semua data terkait termasuk stok. Tindakan ini tidak dapat dibatalkan."
        />
      </main>
    </ProtectedRoute>
  );
}