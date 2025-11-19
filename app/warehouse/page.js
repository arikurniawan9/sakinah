'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ROLES } from '@/lib/constants';

export default function WarehouseDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStores: 0,
    pendingDistributions: 0,
    totalPurchases: 0,
  });
  const [loading, setLoading] = useState(true);
  const [warehouseStock, setWarehouseStock] = useState([]);


  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER)) {
      router.push('/unauthorized');
      return;
    }
    
    fetchStats();
    fetchWarehouseStock();
  }, [status, session, router]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/warehouse/stats');
      const data = await response.json();

      if (response.ok) {
        setStats({
          totalProducts: data.totalQuantityInWarehouse,
          totalStores: data.totalStoresLinked,
          pendingDistributions: data.pendingDistributions,
          totalPurchases: 0, // Placeholder for now
        });
      } else {
        console.error('Failed to fetch warehouse stats:', data.error);
        setStats({
          totalProducts: 0,
          totalStores: 0,
          pendingDistributions: 0,
          totalPurchases: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching warehouse stats:', error);
      setStats({
        totalProducts: 0,
        totalStores: 0,
        pendingDistributions: 0,
        totalPurchases: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouseStock = async () => {
    try {
      const response = await fetch('/api/warehouse/stock');
      const data = await response.json();

      if (response.ok) {
        setWarehouseStock(data.warehouseProducts);
      } else {
        console.error('Failed to fetch warehouse stock:', data.error);
        setWarehouseStock([]);
      }
    } catch (error) {
      console.error('Error fetching warehouse stock:', error);
      setWarehouseStock([]);
    }
  };

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (status !== 'authenticated' || (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER)) {
    return null; // Redirect sudah ditangani di useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Gudang</h1>
          <div className="text-right">
            <p className="text-sm text-gray-600">Selamat datang,</p>
            <p className="font-medium">{session.user.name}</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Produk di Gudang</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalProducts}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Jumlah Toko</h3>
            <p className="text-3xl font-bold text-green-600">{stats.totalStores}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Distribusi Tertunda</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats.pendingDistributions}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Pembelian Bulan Ini</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.totalPurchases}</p>
          </div>
        </div>

        {/* Warehouse Functions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Purchase Management */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Manajemen Pembelian</h3>
            <p className="text-gray-600 mb-4">Buat dan pantau pembelian produk dari supplier</p>
            <button 
              onClick={() => router.push('/warehouse/purchase')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200"
            >
              Buat Pembelian Baru
            </button>
          </div>

          {/* Distribution Management */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Distribusi ke Toko</h3>
            <p className="text-gray-600 mb-4">Distribusikan produk dari gudang ke masing-masing toko</p>
            <button 
              onClick={() => router.push('/warehouse/distribution')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition duration-200"
            >
              Buat Distribusi Baru
            </button>
          </div>
        </div>

        {/* Stock Management */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Stok Gudang</h2>
            <p className="text-sm text-gray-600 mt-1">Lihat dan kelola stok produk di gudang</p>
          </div>
          
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Daftar Produk</h3>
              <button 
                onClick={() => router.push('/warehouse/stock')}
                className="text-blue-600 hover:text-blue-900"
              >
                Lihat Semua Produk →
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Memuat data stok...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produk</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stok Tersedia</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stok Terpesan</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stok Minimum</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {warehouseStock.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                          Tidak ada produk di gudang.
                        </td>
                      </tr>
                    ) : (
                      warehouseStock.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.product.name} ({item.product.productCode})</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{item.quantity}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{item.reserved}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">N/A</div> {/* Minimum stock not in model currently */}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}