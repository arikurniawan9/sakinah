'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ROLES } from '@/lib/constants';

export default function WarehouseStockPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [warehouseProducts, setWarehouseProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER)) {
      router.push('/unauthorized');
      return;
    }
    
    fetchWarehouseStock();
  }, [status, session, router]);

  const fetchWarehouseStock = async () => {
    try {
      const response = await fetch('/api/warehouse/stock');
      const data = await response.json();

      if (response.ok) {
        setWarehouseProducts(data.warehouseProducts);
      } else {
        console.error('Failed to fetch warehouse stock:', data.error);
        setWarehouseProducts([]);
      }
    } catch (error) {
      console.error('Error fetching warehouse stock:', error);
      setWarehouseProducts([]);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (status !== 'authenticated' || (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER)) {
    router.push('/unauthorized');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Stok Gudang</h1>
          <div className="text-right">
            <p className="text-sm text-gray-600">Selamat datang,</p>
            <p className="font-medium">{session.user.name}</p>
            <p className="text-xs text-gray-500">Warehouse</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Daftar Produk di Gudang</h2>
            <div className="flex space-x-3">
              <button 
                onClick={() => router.push('/warehouse/purchase')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200 text-sm"
              >
                + Buat Pembelian
              </button>
              <button 
                onClick={() => alert('Fitur tambah produk ke gudang akan segera hadir!')} // Placeholder for future implementation
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition duration-200 text-sm"
              >
                + Tambah Produk ke Gudang
              </button>
              <button 
                onClick={() => router.push('/warehouse/distribution')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition duration-200 text-sm"
              >
                + Distribusi ke Toko
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Memuat data stok gudang...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode Produk</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Produk</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stok Tersedia</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stok Terpesan</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stok Total</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga Beli</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {warehouseProducts.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                          Belum ada produk di gudang.
                        </td>
                      </tr>
                    ) : (
                      warehouseProducts.map((item) => {
                        const availableStock = item.quantity - item.reserved;
                        return (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{item.product.productCode}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{item.product.category?.name || '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`text-sm ${
                                availableStock < 10 ? 'text-red-600 font-semibold' : 'text-gray-900'
                              }`}>
                                {availableStock}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{item.reserved}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{item.quantity}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">Rp {item.product.purchasePrice?.toLocaleString() || '0'}</div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
                
                {warehouseProducts.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Belum ada produk di gudang.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Total Produk</h3>
            <p className="text-3xl font-bold text-blue-600">{warehouseProducts.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Stok Tersedia</h3>
            <p className="text-3xl font-bold text-green-600">
              {warehouseProducts.reduce((sum, wp) => sum + (wp.quantity - wp.reserved), 0)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Stok Terpesan</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {warehouseProducts.reduce((sum, wp) => sum + wp.reserved, 0)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Stok Total</h3>
            <p className="text-3xl font-bold text-purple-600">
              {warehouseProducts.reduce((sum, wp) => sum + wp.quantity, 0)}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}