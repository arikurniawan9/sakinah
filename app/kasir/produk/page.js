// app/kasir/produk/page.js
'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Sidebar from '../../../components/Sidebar';
import { useUserTheme } from '../../../components/UserThemeContext';
import { useSession } from 'next-auth/react';
import { Home, Package, Search, ShoppingCart, TrendingUp } from 'lucide-react';

import { useProductTable } from '../../../lib/hooks/useProductTable';

import ProductTable from '../../../components/produk/ProductTable';
import KasirProductToolbar from '../../../components/kasir/KasirProductToolbar';
import Pagination from '../../../components/produk/Pagination';
import ProductDetailModal from '../../../components/produk/ProductDetailModal';

export default function KasirProductView() {
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const { data: session } = useSession();
  const isCashier = session?.user?.role === 'CASHIER';

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

  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalValue: 0
  });

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [catResponse, supResponse] = await Promise.all([
          fetch('/api/kategori'),
          fetch('/api/supplier'),
        ]);
        const catData = await catResponse.json();
        const supData = await supResponse.json();
        setCategories(catData.categories || []);
        setSuppliers(supData.suppliers || []);
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setTableError('Gagal memuat data pendukung (kategori/supplier).');
      }
    };
    fetchInitialData();
  }, [setTableError]);

  useEffect(() => {
    // Calculate product statistics based on the current filtered products
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= 10).length;
    const outOfStockProducts = products.filter(p => p.stock === 0).length;
    const totalValue = products.reduce((sum, product) => sum + (product.retailPrice * product.stock), 0);

    setStats({
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      totalValue
    });
  }, [products]);

  const handleViewDetails = (product) => {
    setSelectedProductForDetail(product);
    setShowDetailModal(true);
  };

  const error = tableError;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <ProtectedRoute requiredRole="CASHIER">
      <Sidebar>
        <main className={`flex-1 p-4 min-h-screen ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Header Section */}
            <div className="mb-8">
              <h1 className={`text-3xl md:text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Daftar Produk
              </h1>
              <p className={`mt-2 text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Kelola dan lihat informasi produk Anda
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className={`p-5 rounded-2xl shadow-lg border ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Produk</h3>
                    <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {stats.totalProducts}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                    <Package className={`h-6 w-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                </div>
              </div>

              <div className={`p-5 rounded-2xl shadow-lg border ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Stok Rendah</h3>
                    <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {stats.lowStockProducts}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${darkMode ? 'bg-yellow-900/30' : 'bg-yellow-100'}`}>
                    <TrendingUp className={`h-6 w-6 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                  </div>
                </div>
              </div>

              <div className={`p-5 rounded-2xl shadow-lg border ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Habis</h3>
                    <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {stats.outOfStockProducts}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${darkMode ? 'bg-red-900/30' : 'bg-red-100'}`}>
                    <Search className={`h-6 w-6 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                  </div>
                </div>
              </div>

              <div className={`p-5 rounded-2xl shadow-lg border ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Nilai Stok</h3>
                    <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(stats.totalValue)}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                    <ShoppingCart className={`h-6 w-6 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                  </div>
                </div>
              </div>
            </div>

            {/* Product Table Section */}
            <div className={`rounded-2xl shadow-xl ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} border overflow-hidden`}>
              <div className="p-6">
                <KasirProductToolbar
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  itemsPerPage={itemsPerPage}
                  setItemsPerPage={(value) => {
                    setItemsPerPage(value);
                    setCurrentPage(1);
                  }}
                  darkMode={darkMode}
                />

                {error && (
                  <div className={`my-4 p-4 ${darkMode ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-red-50 border border-red-200 text-red-700'} rounded-xl`}>
                    {error}
                  </div>
                )}
                {success && (
                  <div className={`my-4 p-4 ${darkMode ? 'bg-green-900/30 border-green-700 text-green-200' : 'bg-green-50 border-green-200 text-green-700'} rounded-xl`}>
                    {success}
                  </div>
                )}

                <ProductTable
                  products={products}
                  loading={loading}
                  darkMode={darkMode}
                  selectedRows={[]} // Cashier doesn't need selection
                  handleSelectAll={() => {}} // Cashier doesn't need selection
                  handleSelectRow={() => {}} // Cashier doesn't need selection
                  onEdit={() => {}} // Cashier doesn't need edit
                  onDelete={() => {}} // Cashier doesn't need delete
                  onViewDetails={handleViewDetails}
                  showActions={false} // Hide action column for cashier
                />
              </div>
              <div className={`px-6 py-4 ${darkMode ? 'bg-gray-800/50 border-t border-gray-700' : 'bg-gray-50 border-t border-gray-200'}`}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  setCurrentPage={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalProducts={totalProducts}
                  darkMode={darkMode}
                />
              </div>
            </div>

            <ProductDetailModal
              isOpen={showDetailModal}
              onClose={() => setShowDetailModal(false)}
              product={selectedProductForDetail}
              darkMode={darkMode}
            />
          </div>
        </main>
      </Sidebar>
    </ProtectedRoute>
  );
}
