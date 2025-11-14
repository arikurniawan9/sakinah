// app/admin/transaksi/pembelian/detail/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '../../../../../components/ProtectedRoute';
import { useDarkMode } from '../../../../../components/DarkModeContext';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Package, User, Calendar, CreditCard, Eye } from 'lucide-react';
import Link from 'next/link';

export default function PurchaseDetailPage({ params }) {
  const { data: session } = useSession();
  const { darkMode } = useDarkMode();
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPurchase = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/purchase/${params.id}`);
        if (!response.ok) throw new Error('Gagal mengambil detail pembelian');
        const data = await response.json();
        setPurchase(data.purchase);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching purchase:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchPurchase();
    }
  }, [params.id]);

  if (loading) {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className={`mt-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Memuat detail pembelian...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className={`p-6 rounded-lg ${darkMode ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-700'}`}>
            <h3 className="text-lg font-semibold">Error</h3>
            <p>{error}</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!purchase) {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'}`}>
            <h3 className="text-lg font-semibold">Pembelian Tidak Ditemukan</h3>
            <p>Data pembelian tidak ditemukan atau telah dihapus.</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <div className="mb-6">
            <Link href="/admin/transaksi/pembelian" className="inline-flex items-center text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Kembali ke Daftar Pembelian
            </Link>
          </div>

          {/* Purchase Header */}
          <div className={`p-6 rounded-xl shadow-lg mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold">Detail Pembelian</h1>
                <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  #{purchase.id.substring(0, 8).toUpperCase()}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                purchase.status === 'COMPLETED' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                  : purchase.status === 'PENDING' 
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
              }`}>
                {purchase.status === 'COMPLETED' ? 'Selesai' : purchase.status === 'PENDING' ? 'Tertunda' : 'Dibatalkan'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Supplier</h3>
                <p className="font-medium">{purchase.supplier?.name || 'N/A'}</p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{purchase.supplier?.phone}</p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{purchase.supplier?.address}</p>
              </div>
              
              <div>
                <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tanggal</h3>
                <p className="font-medium">
                  {new Date(purchase.purchaseDate).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {new Date(purchase.createdAt).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              <div>
                <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Pembelian</h3>
                <p className="text-xl font-bold text-green-600">Rp {purchase.totalAmount?.toLocaleString('id-ID') || '0'}</p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Dibuat oleh: {purchase.user?.name}</p>
              </div>
            </div>
          </div>

          {/* Purchase Items */}
          <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Item Pembelian
            </h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Produk</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Kode</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Kuantitas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Harga Satuan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Subtotal</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {purchase.items?.map((item, index) => (
                    <tr key={index} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">{item.product?.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{item.product?.productCode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">{item.quantity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">Rp {item.price?.toLocaleString('id-ID')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold">Rp {(item.price * item.quantity)?.toLocaleString('id-ID')}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Purchase Summary */}
          <div className={`mt-6 p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Item</h3>
                <p className="text-2xl font-bold">{purchase.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}</p>
              </div>
              <div className="text-center">
                <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Produk</h3>
                <p className="text-2xl font-bold">{purchase.items?.length || 0}</p>
              </div>
              <div className="text-center">
                <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Harga</h3>
                <p className="text-2xl font-bold text-green-600">Rp {purchase.totalAmount?.toLocaleString('id-ID') || '0'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}