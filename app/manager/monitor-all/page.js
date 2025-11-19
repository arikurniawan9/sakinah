'use client';

import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ROLES } from '@/lib/constants';

export default function MonitorAllPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stores, setStores] = useState([]);
  const [warehouseData, setWarehouseData] = useState({
    totalStock: 0,
    lowStockItems: 0,
    pendingDistributions: 0,
    totalDistributed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentDistributions, setRecentDistributions] = useState([]);

  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
      router.push('/unauthorized');
      return;
    }
    
    fetchMonitoringData();
  }, [status, session, router]);

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      const [storeSummaryRes, warehouseStatsRes, recentDistributionsRes] = await Promise.all([
        fetch('/api/manager/stores/summary'),
        fetch('/api/warehouse/stats'),
        fetch('/api/manager/distributions/recent'),
      ]);

      const storeSummaryData = await storeSummaryRes.json();
      const warehouseStatsData = await warehouseStatsRes.json();
      const recentDistributionsData = await recentDistributionsRes.json();


      if (storeSummaryRes.ok) {
        setStores(storeSummaryData.storeSummaries);
      } else {
        console.error('Failed to fetch store summaries:', storeSummaryData.error);
        setStores([]);
      }

      if (warehouseStatsRes.ok) {
        setWarehouseData({
          totalStock: warehouseStatsData.totalQuantityInWarehouse,
          lowStockItems: warehouseStatsData.lowStockItems,
          pendingDistributions: warehouseStatsData.pendingDistributions,
          totalDistributed: warehouseStatsData.totalDistributed,
        });
      } else {
        console.error('Failed to fetch warehouse stats:', warehouseStatsData.error);
        setWarehouseData({
          totalStock: 0,
          lowStockItems: 0,
          pendingDistributions: 0,
          totalDistributed: 0,
        });
      }

      if (recentDistributionsRes.ok) {
        setRecentDistributions(recentDistributionsData.recentDistributions);
      } else {
        console.error('Failed to fetch recent distributions:', recentDistributionsData.error);
        setRecentDistributions([]);
      }
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
      setStores([]);
      setWarehouseData({
        totalStock: 0,
        lowStockItems: 0,
        pendingDistributions: 0,
        totalDistributed: 0,
      });
      setRecentDistributions([]);
    } finally {
      setLoading(false);
    }
  };


  if (status === 'loading' || loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
    router.push('/unauthorized');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Monitor Semua Toko</h1>
          <div className="text-right">
            <p className="text-sm text-gray-600">Selamat datang,</p>
            <p className="font-medium">{session.user.name}</p>
            <p className="text-xs text-gray-500">Manager</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Jumlah Toko</h3>
            <p className="text-3xl font-bold text-blue-600">{stores.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Total Penjualan</h3>
            <p className="text-3xl font-bold text-green-600">
              Rp {(stores.reduce((sum, store) => sum + store.totalSales, 0)).toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Produk Stok Rendah</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {stores.reduce((sum, store) => sum + store.lowStockProducts, 0)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Karyawan Aktif</h3>
            <p className="text-3xl font-bold text-indigo-600">
              {stores.reduce((sum, store) => sum + store.activeEmployees, 0)}
            </p>
          </div>
        </div>

        {/* Warehouse Overview */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Gudang Pusat</h2>
            <p className="text-sm text-gray-600 mt-1">Status stok dan distribusi</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{warehouseData.totalStock}</p>
                <p className="text-sm text-gray-600 mt-1">Total Stok</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-600">{warehouseData.lowStockItems}</p>
                <p className="text-sm text-gray-600 mt-1">Stok Rendah</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">{warehouseData.pendingDistributions}</p>
                <p className="text-sm text-gray-600 mt-1">Distribusi Tertunda</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{warehouseData.totalDistributed}</p>
                <p className="text-sm text-gray-600 mt-1">Total Didistribusikan</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Distributions */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Distribusi Gudang Terbaru</h2>
            <p className="text-sm text-gray-600 mt-1">Aliran produk dari gudang ke toko</p>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Memuat data distribusi...</p>
              </div>
            ) : recentDistributions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Belum ada distribusi terbaru.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produk</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Toko Tujuan</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Didistribusikan Oleh</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentDistributions.map((dist) => (
                      <tr key={dist.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{new Date(dist.distributedAt).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{dist.product.name} ({dist.product.productCode})</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{dist.store.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{dist.quantity}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{dist.distributedByUser.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${dist.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {dist.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Stores Overview */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Ringkasan Toko</h2>
            <p className="text-sm text-gray-600 mt-1">Status dan kinerja masing-masing toko</p>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Memuat data toko...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Toko</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Penjualan</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaksi</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Karyawan</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stok Rendah</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stores.map((store) => (
                      <tr key={store.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{store.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${store.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {store.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">Rp {store.totalSales.toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{store.totalTransactions}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{store.activeEmployees}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-yellow-600 font-medium">{store.lowStockProducts}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button 
                            onClick={() => router.push(`/manager/stores/${store.id}`)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Detail
                          </button>
                          <button 
                            onClick={async () => {
                              // Trigger a signIn with updated credentials to change store context
                              // WARNING: Passing password directly from frontend is a security risk.
                              // In a production environment, implement a secure token exchange
                              // or a server-side session update mechanism.
                              const result = await signIn('credentials', {
                                redirect: false, // Prevent redirecting to sign-in page
                                username: session.user.username,
                                password: 'PASSWORD_PLACEHOLDER', // ! SECURITY RISK: Needs secure handling
                                selectedStoreId: store.id,
                                selectedStoreRole: ROLES.ADMIN, // Manager accesses store as ADMIN
                              });

                              if (result?.error) {
                                alert(`Gagal mengakses toko: ${result.error}`);
                              } else {
                                router.push('/admin'); // Redirect to admin dashboard of the selected store
                              }
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Akses
                          </button>
                        </td>
                      </tr>
                    ))}
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