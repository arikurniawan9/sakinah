// app/admin/pelayan/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import { useDarkMode } from '../../../../components/DarkModeContext';
import { User, ArrowLeft, DollarSign, ShoppingCart, Calendar } from 'lucide-react';

export default function PelayanDetailPage() {
  const { darkMode } = useDarkMode();
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/pelayan/${id}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Gagal memuat data detail pelayan');
          }
          const result = await response.json();
          setData(result);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [id]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Memuat data...</div>
        </main>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-red-500">Error: {error}</div>
        </main>
      </ProtectedRoute>
    );
  }

  if (!data) {
    return null;
  }

  const { attendant, sales, totalSalesToday } = data;

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <main className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className={`flex items-center text-sm font-medium ${darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-800'}`}
            >
              <ArrowLeft size={16} className="mr-1" />
              Kembali ke Manajemen Pelayan
            </button>
          </div>

          {/* Header */}
          <div className={`p-6 rounded-xl shadow-lg border mb-8 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center">
              <div className={`p-3 rounded-full mr-4 ${darkMode ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
                <User className={`h-8 w-8 ${darkMode ? 'text-purple-300' : 'text-purple-600'}`} />
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{attendant.name}</h1>
                <p className={`mt-1 text-md ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{attendant.username} | {attendant.employeeNumber}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className={`p-5 rounded-xl shadow border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
              <div className="flex items-center">
                <div className={`p-3 rounded-full mr-4 ${darkMode ? 'bg-green-900/50' : 'bg-green-100'}`}>
                  <DollarSign className={`h-6 w-6 ${darkMode ? 'text-green-300' : 'text-green-600'}`} />
                </div>
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Penjualan (Hari Ini)</p>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(totalSalesToday)}</p>
                </div>
              </div>
            </div>
            <div className={`p-5 rounded-xl shadow border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
              <div className="flex items-center">
                <div className={`p-3 rounded-full mr-4 ${darkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                  <ShoppingCart className={`h-6 w-6 ${darkMode ? 'text-blue-300' : 'text-blue-600'}`} />
                </div>
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Transaksi (Hari Ini)</p>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{sales.filter(s => new Date(s.date) >= new Date().setHours(0,0,0,0)).length}</p>
                </div>
              </div>
            </div>
            <div className={`p-5 rounded-xl shadow border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
              <div className="flex items-center">
                <div className={`p-3 rounded-full mr-4 ${darkMode ? 'bg-yellow-900/50' : 'bg-yellow-100'}`}>
                  <Calendar className={`h-6 w-6 ${darkMode ? 'text-yellow-300' : 'text-yellow-600'}`} />
                </div>
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Transaksi (Semua)</p>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{sales.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sales History Table */}
          <div className={`rounded-xl shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
            <h2 className={`text-xl font-bold p-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Riwayat Transaksi Dilayani</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Invoice</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Tanggal</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Total</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Kasir</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Pelanggan</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Status</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {sales.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center">Tidak ada riwayat transaksi.</td>
                    </tr>
                  ) : (
                    sales.map(sale => (
                      <tr key={sale.id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{sale.invoiceNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(sale.date)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{formatCurrency(sale.total)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{sale.cashier?.name || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{sale.member?.name || 'Umum'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            sale.status === 'PAID'
                              ? (darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800')
                              : (darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-800')
                          }`}>
                            {sale.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
