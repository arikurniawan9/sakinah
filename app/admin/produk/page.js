// app/admin/produk/page.js
'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useUserTheme } from '../../../components/UserThemeContext';
import { useSession } from 'next-auth/react'; // Import useSession
import { toast } from 'react-toastify';
import useSWR from 'swr';

import { useProductTable } from '../../../lib/hooks/useProductTable';
import { useProductForm } from '../../../lib/hooks/useProductForm';
import { useTableSelection } from '../../../lib/hooks/useTableSelection';
import { useCachedCategories, useCachedSuppliers } from '../../../lib/hooks/useCachedData';

import DataTable from '../../../components/DataTable';
import ProductModal from '../../../components/produk/ProductModal';
import ProductDetailModal from '../../../components/produk/ProductDetailModal';
import Toolbar from '../../../components/produk/Toolbar';
import ConfirmationModal from '../../../components/ConfirmationModal';
import Breadcrumb from '../../../components/Breadcrumb';

export default function ProductManagement() {
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const { data: session } = useSession(); // Get session data
  const isAdmin = session?.user?.role === 'ADMIN'; // Determine if user is admin

  const {
    products,
    loading,
    error: tableError,
    searchTerm,
    setSearchTerm,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    totalProducts,
    fetchProducts,
    setError: setTableError,
  } = useProductTable();

  const {
    showModal,
    editingProduct,
    formData,
    error: formError,
    success,
    handleInputChange,
    handleTierChange,
    addTier,
    removeTier,
    openModalForEdit,
    openModalForCreate,
    closeModal,
    handleSave,
    setError: setFormError,
    setSuccess,
  } = useProductForm(fetchProducts);

  const { selectedRows, handleSelectAll, handleSelectRow, clearSelection, setSelectedRows } = useTableSelection(products);

  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState(null);

  // Gunakan hook SWR yang baru untuk mengambil data kategori dan supplier
  const { categories: cachedCategories, loading: categoriesLoading, error: categoriesError } = useCachedCategories();
  const { suppliers: cachedSuppliers, loading: suppliersLoading, error: suppliersError } = useCachedSuppliers();

  // Gunakan data dari cache jika tersedia
  useEffect(() => {
    setCategories(cachedCategories);
  }, [cachedCategories]);

  useEffect(() => {
    setSuppliers(cachedSuppliers);
  }, [cachedSuppliers]);

  // Tampilkan error jika terjadi
  useEffect(() => {
    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      setTableError('Gagal memuat data kategori.');
    }
    if (suppliersError) {
      console.error('Error fetching suppliers:', suppliersError);
      setTableError('Gagal memuat data supplier.');
    }
  }, [categoriesError, suppliersError, setTableError]);

  const handleDelete = (id) => {
    if (!isAdmin) return; // Prevent delete if not admin
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDeleteMultiple = () => {
    if (!isAdmin || selectedRows.length === 0) return; // Prevent delete if not admin or no rows selected
    setItemToDelete(selectedRows);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete || !isAdmin) return; // Ensure admin role before confirming delete
    setIsDeleting(true);

    const isMultiple = Array.isArray(itemToDelete);
    let url = '/api/produk';
    let options = {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    };

    if (isMultiple) {
      options.body = JSON.stringify({ ids: itemToDelete });
    } else {
      url += `?id=${itemToDelete}`;
    }

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menghapus produk');
      }

      fetchProducts();
      if (isMultiple) {
        clearSelection();
        setSuccess(`Berhasil menghapus ${itemToDelete.length} produk`);
      } else {
        setSelectedRows(prev => prev.filter(rowId => rowId !== itemToDelete));
        setSuccess('Produk berhasil dihapus');
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setTableError('Terjadi kesalahan saat menghapus: ' + err.message);
      setTimeout(() => setTableError(''), 5000);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const handleViewDetails = (product) => {
    setSelectedProductForDetail(product);
    setShowDetailModal(true);
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const response = await fetch('/api/produk');
      if (!response.ok) throw new Error('Gagal mengambil data untuk export');
      const data = await response.json();

      let csvContent = 'Nama,Kode,Harga,Stok,Kategori,Supplier,Deskripsi,Tanggal Dibuat,Tanggal Diubah\n';
      data.products.forEach(product => {
        const basePrice = product.priceTiers?.sort((a, b) => a.minQty - b.minQty)[0]?.price || 0;
        const category = categories.find(cat => cat.id === product.categoryId);
        const supplier = suppliers.find(supp => supp.id === product.supplierId);
        const row = [
          `"${product.name.replace(/"/g, '""')}"`,
          `"${product.productCode.replace(/"/g, '""')}"`,
          basePrice,
          product.stock,
          `"${category?.name || ''}"`,
          `"${supplier?.name || ''}"`,
          `"${product.description ? product.description.replace(/"/g, '""') : ''}"`,
          `"${new Date(product.createdAt).toLocaleDateString('id-ID')}"`,
          `"${new Date(product.updatedAt).toLocaleDateString('id-ID')}"`
        ].join(',');
        csvContent += row + '\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `produk-${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccess('Data produk berhasil diekspor');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setTableError('Terjadi kesalahan saat export: ' + err.message);
      setTimeout(() => setTableError(''), 5000);
    } finally {
      setExportLoading(false);
    }
  };

  const handleImport = async (e) => {
    if (!isAdmin) return; // Prevent import if not admin
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls') && !file.name.toLowerCase().endsWith('.csv')) {
      setTableError('Silakan pilih file Excel (.xlsx, .xls) atau CSV (.csv)');
      setTimeout(() => setTableError(''), 5000);
      e.target.value = '';
      return;
    }

    setImportLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      toast.info(`Memproses file ${file.name}...`);
      const response = await fetch('/api/produk/import', { method: 'POST', body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal mengimport produk');
      fetchProducts();
      toast.success(result.message || `Berhasil mengimport ${result.importedCount || 0} produk`);
      e.target.value = '';
    } catch (err) {
      toast.error('Terjadi kesalahan saat import: ' + err.message);
      e.target.value = '';
    } finally {
      setImportLoading(false);
    }
  };

  // Reset to first page when itemsPerPage changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const error = tableError || formError;

  // Define columns for DataTable
  const columns = [
    {
      key: 'productCode',
      title: 'Kode',
      sortable: true
    },
    {
      key: 'name',
      title: 'Nama',
      sortable: true
    },
    {
      key: 'price',
      title: 'Harga',
      render: (value, row) => {
        const basePrice = row.priceTiers?.sort((a, b) => a.minQty - b.minQty)[0]?.price || 0;
        return `Rp ${basePrice.toLocaleString('id-ID')}`;
      },
      sortable: true
    },
    {
      key: 'stock',
      title: 'Stok',
      sortable: true
    },
    {
      key: 'category',
      title: 'Kategori',
      render: (value, row) => row.category?.name || '-',
      sortable: true
    },
    {
      key: 'supplier',
      title: 'Supplier',
      render: (value, row) => row.supplier?.name || '-',
      sortable: true
    }
  ];

  // Enhanced data with action handlers
  const enhancedProducts = products.map(product => ({
    ...product,
    onViewDetails: handleViewDetails,
    onEdit: isAdmin ? openModalForEdit : undefined,
    onDelete: isAdmin ? handleDelete : undefined
  }));

  // Pagination data
  const paginationData = {
    currentPage,
    totalPages,
    totalItems: totalProducts,
    startIndex: (currentPage - 1) * itemsPerPage + 1,
    endIndex: Math.min(currentPage * itemsPerPage, totalProducts),
    onPageChange: setCurrentPage,
    itemsPerPage: itemsPerPage
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <main className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${darkMode ? 'bg-gray-900 text-gray-100' : ''}`}>
        <Breadcrumb
          items={[{ title: 'Produk', href: '/admin/produk' }]}
          darkMode={darkMode}
        />

        <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Manajemen Produk
        </h1>

        <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-pastel-purple-700' : 'bg-white border-gray-200'} border`}>
          <DataTable
            data={enhancedProducts}
            columns={columns}
            loading={loading}
            selectedRows={selectedRows}
            onSelectAll={isAdmin ? handleSelectAll : undefined}
            onSelectRow={isAdmin ? handleSelectRow : undefined}
            onAdd={isAdmin ? openModalForCreate : undefined}
            onSearch={setSearchTerm}
            onExport={handleExport}
            onItemsPerPageChange={setItemsPerPage}
            onDeleteMultiple={handleDeleteMultiple}
            selectedRowsCount={selectedRows.length}
            darkMode={darkMode}
            actions={isAdmin}
            showToolbar={isAdmin}
            showAdd={isAdmin}
            showExport={true}
            showItemsPerPage={true}
            pagination={paginationData}
            mobileColumns={['productCode', 'name', 'price', 'stock']} // Show key information on mobile
          />
        </div>

        {isAdmin && ( // Only show modal for admin
          <ProductModal
            showModal={showModal}
            closeModal={closeModal}
            editingProduct={editingProduct}
            formData={formData}
            handleInputChange={handleInputChange}
            handleTierChange={handleTierChange}
            addTier={addTier}
            removeTier={removeTier}
            handleSave={handleSave}
            darkMode={darkMode}
            categories={categories}
            suppliers={suppliers}
          />
        )}

        {isAdmin && ( // Only show confirmation modal for admin
          <ConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleConfirmDelete}
            title="Konfirmasi Hapus"
            message={`Apakah Anda yakin ingin menghapus ${
              Array.isArray(itemToDelete) ? itemToDelete.length + ' produk' : 'produk ini'
            }?`}
            darkMode={darkMode}
            isLoading={isDeleting}
          />
        )}

        {/* Product Detail Modal is always available for viewing */}
        <ProductDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          product={selectedProductForDetail}
          darkMode={darkMode}
        />
      </main>
    </ProtectedRoute>
  );
}