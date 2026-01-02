// app/kasir/page.js
'use client';

import { useSession } from 'next-auth/react';
import ProtectedRoute from '../../components/ProtectedRoute';
import Link from 'next/link';
import { Calculator, History, CreditCard, ShoppingCart, AlertTriangle, User, TrendingUp, Package, Users } from 'lucide-react';
import Sidebar from '../../components/Sidebar'; // Import Sidebar
import { useUserTheme } from '../../components/UserThemeContext'; // Import useDarkMode
import { useState, useEffect } from 'react';
import ScrollingStockAlert from '../../components/kasir/dashboard/ScrollingStockAlert';

export default function CashierDashboard() {
  const { data: session } = useSession();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode; // Use dark mode context
  const [summaryData, setSummaryData] = useState({
    transactionsCount: 0,
    totalRevenue: 0,
    totalItemsSold: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [lowStockLoading, setLowStockLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/kasir-summary');
        if (!response.ok) {
          throw new Error('Failed to fetch summary');
        }
        const data = await response.json();
        setSummaryData(data);
      } catch (error) {
        console.error(error);
        // Optionally set an error state here
      } finally {
        setLoading(false);
      }
    };

    const fetchLowStockProducts = async () => {
      try {
        setLowStockLoading(true);
        const response = await fetch('/api/produk/low-stock?threshold=10');
        if (!response.ok) {
          throw new Error('Failed to fetch low stock products');
        }
        const data = await response.json();
        setLowStockProducts(data.lowStockProducts);
      } catch (error) {
        console.error('Error fetching low stock products:', error);
      } finally {
        setLowStockLoading(false);
      }
    };

    fetchSummary();
    fetchLowStockProducts();
  }, []);

  // Menu items for cashier dashboard quick links
  const menuItems = [
    {
      title: "Transaksi Baru",
      description: "Buat transaksi penjualan baru",
      href: "/kasir/transaksi", // Assuming a dedicated cashier transaction page
      icon: Calculator,
      color: "bg-gradient-to-br from-purple-500 to-indigo-600", // Modern gradient
      darkModeColor: "bg-gradient-to-br from-purple-700 to-indigo-800", // Dark mode gradient
      textColor: "text-white",
    },
    {
      title: "Riwayat Transaksi",
      description: "Lihat riwayat transaksi yang telah Anda proses",
      href: "/kasir/riwayat", // Changed to cashier-specific route
      icon: History,
      color: "bg-gradient-to-br from-blue-500 to-cyan-600", // Modern gradient
      darkModeColor: "bg-gradient-to-br from-blue-700 to-cyan-800", // Dark mode gradient
      textColor: "text-white",
    },
    {
      title: "Profil Saya",
      description: "Ubah data profil kasir",
      href: "/kasir/profile",
      icon: User,
      color: "bg-gradient-to-br from-emerald-500 to-teal-600", // Modern gradient
      darkModeColor: "bg-gradient-to-br from-emerald-700 to-teal-800", // Dark mode gradient
      textColor: "text-white",
    },
  ];

  const formatCurrency = (amount) => {
    // Validasi bahwa amount adalah angka sebelum diformat
    const numAmount = typeof amount === 'number' ? amount : 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(numAmount);
  };

  return (
    <ProtectedRoute requiredRole="CASHIER">
      <Sidebar>
        <main className={`flex-1 p-4 min-h-screen ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Scrolling Stock Alert */}
            <div className="mb-8">
              <ScrollingStockAlert darkMode={darkMode} />
            </div>

            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className={`text-3xl md:text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Selamat Datang, {session?.user?.name || 'Kasir'}
              </h1>
              <p className={`mt-2 text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Dashboard Kasir - Manajemen Penjualan dan Transaksi
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Quick Links */}
              <div className="lg:col-span-2">
                <div className="mb-8">
                  <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Menu Utama</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {menuItems.map((item, index) => {
                      const IconComponent = item.icon;
                      return (
                        <Link
                          key={index}
                          href={item.href}
                          className={`rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group border-0 ${
                            darkMode ? 'bg-gray-800' : 'bg-white'
                          }`}
                        >
                          <div className={`p-6 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'} transition-colors group-hover:opacity-90`}>
                            <div className={`${item.color} ${item.darkModeColor} w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform`}>
                              <IconComponent size={28} className={item.textColor} />
                            </div>
                            <h3 className={`text-lg font-bold mb-2 text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
                            <p className={`text-sm text-center mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{item.description}</p>
                            <div className={`flex items-center justify-center font-semibold ${item.textColor} text-sm`}>
                              <span>Lanjutkan</span>
                              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                              </svg>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Tips Section */}
                <div className={`p-6 rounded-2xl shadow-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center mb-4">
                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                      <Users className={`h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    </div>
                    <h2 className={`text-xl font-bold ml-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Tips Harian</h2>
                  </div>
                  <ul className={`space-y-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <li className="flex items-start">
                      <div className={`flex-shrink-0 mt-1 mr-3 w-2 h-2 rounded-full ${darkMode ? 'bg-purple-500' : 'bg-purple-600'}`}></div>
                      <span>Gunakan tombol pintas (Alt+H) untuk kembali ke dashboard</span>
                    </li>
                    <li className="flex items-start">
                      <div className={`flex-shrink-0 mt-1 mr-3 w-2 h-2 rounded-full ${darkMode ? 'bg-purple-500' : 'bg-purple-600'}`}></div>
                      <span>Tekan Enter setelah mengetik kode produk untuk scan cepat</span>
                    </li>
                    <li className="flex items-start">
                      <div className={`flex-shrink-0 mt-1 mr-3 w-2 h-2 rounded-full ${darkMode ? 'bg-purple-500' : 'bg-purple-600'}`}></div>
                      <span>Gunakan Alt+Enter untuk langsung membayar jika jumlah sudah cukup</span>
                    </li>
                    <li className="flex items-start">
                      <div className={`flex-shrink-0 mt-1 mr-3 w-2 h-2 rounded-full ${darkMode ? 'bg-purple-500' : 'bg-purple-600'}`}></div>
                      <span>Gunakan SHIFT+S untuk menangguhkan transaksi</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right Column: Quick Stats & Low Stock Products */}
              <div className="lg:col-span-1 space-y-8">
                {/* Quick Stats */}
                <div>
                  <div className="flex items-center mb-6">
                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
                      <TrendingUp className={`h-5 w-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                    </div>
                    <h2 className={`text-2xl font-bold ml-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Ringkasan Hari Ini</h2>
                  </div>

                  <div className="grid grid-cols-1 gap-5">
                    <div className={`p-5 rounded-2xl shadow-lg border ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Transaksi Selesai</h3>
                          <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {loading ? '...' : summaryData.transactionsCount}
                          </p>
                        </div>
                        <div className={`p-3 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                          <CreditCard className={`h-6 w-6 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                        </div>
                      </div>
                    </div>

                    <div className={`p-5 rounded-2xl shadow-lg border ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Item Terjual</h3>
                          <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {loading ? '...' : summaryData.totalItemsSold}
                          </p>
                        </div>
                        <div className={`p-3 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                          <ShoppingCart className={`h-6 w-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                        </div>
                      </div>
                    </div>

                    <div className={`p-5 rounded-2xl shadow-lg border ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Pendapatan</h3>
                          <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {loading ? '...' : formatCurrency(summaryData.totalRevenue)}
                          </p>
                        </div>
                        <div className={`p-3 rounded-lg ${darkMode ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
                          <Calculator className={`h-6 w-6 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Low Stock Products */}
                <div>
                  <div className="flex items-center mb-6">
                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-yellow-900/30' : 'bg-yellow-100'}`}>
                      <Package className={`h-5 w-5 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                    </div>
                    <h2 className={`text-2xl font-bold ml-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Produk Stok Menipis</h2>
                  </div>

                  <div className={`p-5 rounded-2xl shadow-lg border ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`}>
                    {lowStockLoading ? (
                      <div className="flex justify-center items-center py-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                      </div>
                    ) : lowStockProducts.length > 0 ? (
                      <div className="max-h-80 overflow-y-auto pr-2 -mr-2">
                        <ul className="space-y-4">
                          {lowStockProducts.map(product => (
                            <li key={product.id} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 mr-3">
                                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                </div>
                                <div>
                                  <span className={`block font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{product.name}</span>
                                  {product.productCode && (
                                    <span className={`text-xs ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>Kode: {product.productCode}</span>
                                  )}
                                </div>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-600'}`}>
                                Stok: {product.stock}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <div className={`inline-flex items-center justify-center p-3 rounded-full ${darkMode ? 'bg-green-900/20' : 'bg-green-100'}`}>
                          <svg className={`h-6 w-6 ${darkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className={`mt-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tidak ada produk dengan stok menipis.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </Sidebar>
    </ProtectedRoute>
  );
}