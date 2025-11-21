'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ROLES } from '@/lib/constants';

export default function WarehouseDistributionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouseStock, setWarehouseStock] = useState([]);
  const [distributionData, setDistributionData] = useState({
    storeId: '',
    distributionDate: new Date().toISOString().split('T')[0],
    items: [],
  });
  const [newItem, setNewItem] = useState({
    productId: '',
    quantity: 1,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER)) {
      router.push('/unauthorized');
      return;
    }
    
    fetchInitialData();
  }, [status, session, router]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [storesRes, productsRes, warehouseStockRes] = await Promise.all([
        fetch('/api/warehouse/stores'),
        fetch('/api/warehouse/products'),
        fetch('/api/warehouse/stock'),
      ]);

      const storesData = await storesRes.json();
      const productsData = await productsRes.json();
      const warehouseStockData = await warehouseStockRes.json();

      if (storesRes.ok) {
        setStores(storesData.stores);
      } else {
        console.error('Failed to fetch stores:', storesData.error);
        setStores([]);
      }

      if (productsRes.ok) {
        setProducts(productsData.products);
      } else {
        console.error('Failed to fetch products:', productsData.error);
        setProducts([]);
      }

      if (warehouseStockRes.ok) {
        setWarehouseStock(warehouseStockData.warehouseProducts);
      } else {
        console.error('Failed to fetch warehouse stock:', warehouseStockData.error);
        setWarehouseStock([]);
      }
    } catch (error) {
      console.error('Error fetching initial data for warehouse distribution:', error);
      setStores([]);
      setProducts([]);
      setWarehouseStock([]);
    } finally {
      setLoading(false);
    }
  };


  if (status === 'loading' || loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (status !== 'authenticated' || (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER)) {
    router.push('/unauthorized');
    return null;
  }
  const handleAddItem = () => {
    // Cek apakah produk tersedia di gudang dengan jumlah yang cukup
    const stockItem = warehouseStock.find(s => s.productId === newItem.productId);
    if (!stockItem || stockItem.quantity < newItem.quantity) {
      alert('Stok tidak mencukupi atau produk tidak tersedia di gudang');
      return;
    }

    if (newItem.productId && newItem.quantity > 0) {
      // Cek apakah item sudah ada di daftar, jika ya tambahkan jumlahnya
      const existingItemIndex = distributionData.items.findIndex(item => item.productId === newItem.productId);
      if (existingItemIndex >= 0) {
        const updatedItems = [...distributionData.items];
        updatedItems[existingItemIndex].quantity += newItem.quantity;
        
        // Cek kembali apakah total jumlah melebihi stok
        const totalRequested = updatedItems[existingItemIndex].quantity;
        if (stockItem.quantity < totalRequested) {
          alert('Total jumlah melebihi stok yang tersedia');
          return;
        }
        
        setDistributionData({
          ...distributionData,
          items: updatedItems,
        });
      } else {
        setDistributionData({
          ...distributionData,
          items: [...distributionData.items, { ...newItem, id: Date.now() }],
        });
      }
      setNewItem({ productId: '', quantity: 1 });
    }
  };

  const handleRemoveItem = (id) => {
    setDistributionData({
      ...distributionData,
      items: distributionData.items.filter(item => item.id !== id),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/warehouse/distribution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...distributionData,
          distributedBy: session.user.id,
          status: 'DELIVERED', // Default status
        }),
      });

      if (response.ok) {
        alert('Distribusi berhasil disimpan');
        router.push('/warehouse');
      } else {
        const error = await response.json();
        alert(error.message || 'Gagal menyimpan distribusi');
      }
    } catch (error) {
      alert('Terjadi kesalahan saat menyimpan distribusi');
      console.error('Error submitting distribution:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Distribusi ke Toko</h1>
          <div className="text-right">
            <p className="text-sm text-gray-600">Selamat datang,</p>
            <p className="font-medium">{session.user.name}</p>
            <p className="text-xs text-gray-500">Warehouse</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label htmlFor="storeId" className="block text-sm font-medium text-gray-700 mb-1">
                  Pilih Toko Tujuan *
                </label>
                <select
                  id="storeId"
                  value={distributionData.storeId}
                  onChange={(e) => setDistributionData({...distributionData, storeId: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Pilih Toko</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="distributionDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Distribusi *
                </label>
                <input
                  type="date"
                  id="distributionDate"
                  value={distributionData.distributionDate}
                  onChange={(e) => setDistributionData({...distributionData, distributionDate: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tambahkan Produk dari Gudang</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label htmlFor="productId" className="block text-sm font-medium text-gray-700 mb-1">
                    Produk
                  </label>
                  <select
                    id="productId"
                    value={newItem.productId}
                    onChange={(e) => setNewItem({...newItem, productId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Pilih Produk</option>
                    {warehouseStock
                      .filter(item => item.quantity > 0) // Hanya produk dengan stok > 0
                      .map(item => {
                        const product = products.find(p => p.id === item.productId);
                        return (
                          <option key={item.productId} value={item.productId}>
                            {product?.name} - Stok: {item.quantity}
                          </option>
                        );
                      })}
                  </select>
                </div>
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Jumlah Distribusi
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 0})}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition duration-200"
                  >
                    Tambah ke Distribusi
                  </button>
                </div>
              </div>

              {/* Daftar item yang akan didistribusikan */}
              {distributionData.items.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produk</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stok di Gudang</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {distributionData.items.map((item) => {
                        const product = products.find(p => p.id === item.productId);
                        const stockItem = warehouseStock.find(s => s.productId === item.productId);
                        return (
                          <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{product?.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{item.quantity}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{stockItem?.quantity || 0}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={distributionData.items.length === 0 || !distributionData.storeId}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Simpan Distribusi
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}