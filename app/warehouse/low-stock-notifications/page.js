'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ROLES } from '@/lib/constants';
import { useUserTheme } from '@/components/UserThemeContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import DataTable from '@/components/DataTable';
import Breadcrumb from '@/components/Breadcrumb';
import { AlertTriangle, Package, TrendingDown, Bell } from 'lucide-react';

export default function LowStockNotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({
    storeId: '',
    category: ''
  });

  // Fetch low stock products
  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || session.user.role !== ROLES.WAREHOUSE) {
      router.push('/unauthorized');
      return;
    }

    const fetchLowStockProducts = async () => {
      setLoading(true);
      setError('');
      
      try {
        const params = new URLSearchParams({
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm,
          storeId: filters.storeId,
          category: filters.category,
          lowStock: 'true' // Filter untuk produk stok rendah
        });

        const response = await fetch(`/api/warehouse/low-stock-products?${params.toString()}`);
        
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
        setProducts(data.products || []);
        setTotalItems(data.total || 0);
      } catch (err) {
        console.error('Error fetching low stock products:', err);
        setError('Gagal mengambil data produk stok rendah: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLowStockProducts();
  }, [status, session, currentPage, itemsPerPage, searchTerm, filters, router]);

  // Columns configuration for the DataTable
  const columns = [
    {
      key: 'no',
      title: 'No.',
      render: (_, __, index) => (currentPage - 1) * itemsPerPage + index + 1,
    },
    { 
      key: 'productCode', 
      title: 'Kode Produk', 
      sortable: true 
    },
    { 
      key: 'name', 
      title: 'Nama Produk', 
      sortable: true,
      className: 'font-medium'
    },
    {
      key: 'currentStock',
      title: 'Stok Saat Ini',
      render: (value) => (
        <span className={`font-semibold ${
          value <= 5 ? 'text-red-600 dark:text-red-400' :
          value <= 10 ? 'text-yellow-600 dark:text-yellow-400' :
          'text-green-600 dark:text-green-400'
        }`}>
          {value?.toLocaleString('id-ID') || 0}
        </span>
      ),
      sortable: true
    },
    {
      key: 'minStock',
      title: 'Stok Minimum',
      render: (value) => value?.toLocaleString('id-ID') || 0,
      sortable: true
    },
    {
      key: 'status',
      title: 'Status',
      render: (_, product) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          product.currentStock <= product.minStock ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
          product.currentStock <= product.minStock * 2 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
        }`}>
          {product.currentStock <= product.minStock ? 'Stok Rendah' :
           product.currentStock <= product.minStock * 2 ? 'Stok Hampir Habis' : 'Stok Aman'}
        </span>
      )
    }
  ];

  // Filter options
  const filterOptions = [
    {
      key: 'category',
      label: 'Kategori',
      type: 'select',
      options: [
        { value: '', label: 'Semua Kategori' },
        { value: 'ELEKTRONIK', label: 'Elektronik' },
        { value: 'MAKANAN', label: 'Makanan' },
        { value: 'MINUMAN', label: 'Minuman' },
        { value: 'PERAWATAN', label: 'Perawatan' },
        { value: 'ALAT_TULIS', label: 'Alat Tulis' }
      ]
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
          { title: 'Notifikasi Stok', href: '/warehouse/low-stock-notifications' },
        ]}
        darkMode={darkMode}
      >
        <div className="flex items-center">
          <AlertTriangle className={`h-8 w-8 mr-3 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Notifikasi Stok Rendah
            </h1>
            <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Daftar produk dengan stok di bawah ambang batas
            </p>
          </div>
        </div>
      </Breadcrumb>

      {error && (
        <div className={`mb-4 p-4 rounded-lg ${darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'}`}>
          {error}
        </div>
      )}

      <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
        <DataTable
          data={products}
          columns={columns}
          loading={loading}
          onSearch={setSearchTerm}
          darkMode={darkMode}
          showAdd={false}
          pagination={paginationData}
          mobileColumns={['name', 'currentStock', 'status']}
          filterOptions={filterOptions}
          filterValues={filters}
          onFilterChange={setFilters}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </div>
    </main>
  );
}