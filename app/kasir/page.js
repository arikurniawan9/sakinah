// app/kasir/page.js
'use client';

import { useSession } from 'next-auth/react';
import ProtectedRoute from '../../components/ProtectedRoute';
import Link from 'next/link';
import { Calculator, History, CreditCard, ShoppingCart, AlertTriangle, User, TrendingUp, Package, Users } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { useUserTheme } from '../../components/UserThemeContext';
import { useState, useEffect } from 'react';
import ScrollingStockAlert from '../../components/kasir/dashboard/ScrollingStockAlert';
import { useNotification } from '../../components/notifications/NotificationProvider';
import io from 'socket.io-client';

// Custom component for the notification toast
const NewSaleNotification = ({ sale }) => (
  <div>
    <p className="font-bold">Pesanan Baru Ditangguhkan!</p>
    <p>&quot;{sale.name}&quot; oleh {sale.attendantName || 'Pelayan'}.</p>
    <Link href="/kasir/transaksi?action=view-suspended" className="mt-2 inline-block font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
      Buka daftar pesanan &rarr;
    </Link>
  </div>
);


export default function CashierDashboard() {
  const { data: session } = useSession();
  const { userTheme } = useUserTheme();
  const { showNotification } = useNotification();
  const darkMode = userTheme.darkMode;
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

  // WebSocket connection for real-time notifications
  useEffect(() => {
    if (!session?.user?.storeId) return;

    const socket = io({
      path: '/api/socket_io',
    });

    socket.on('connect', () => {
      console.log('Cashier dashboard connected to socket server.');
      const room = `cashier-store-${session.user.storeId}`;
      socket.emit('joinRoom', room);
      console.log(`Cashier joined room: ${room}`);
    });

    socket.on('disconnect', () => {
      console.log('Cashier dashboard disconnected from socket server.');
    });

    socket.on('sale:suspended:new', (sale) => {
      console.log('New suspended sale received:', sale);
      showNotification(
        <NewSaleNotification sale={sale} />,
        'info',
        { autoClose: 15000 } // Keep notification for 15 seconds
      );
    });

    return () => {
      if (socket) {
        const room = `cashier-store-${session.user.storeId}`;
        socket.emit('leaveRoom', room);
        socket.disconnect();
      }
    };
  }, [session, showNotification]);


  // Menu items for cashier dashboard quick links
  const menuItems = [
    {
      title: "Transaksi Baru",
      description: "Buat transaksi penjualan baru",
      href: "/kasir/transaksi",
      icon: Calculator,
      color: "bg-gradient-to-br from-purple-500 to-indigo-600",
      darkModeColor: "dark:bg-gradient-to-br dark:from-purple-700 dark:to-indigo-800",
      textColor: "text-white",
    },
    {
      title: "Riwayat Transaksi",
      description: "Lihat riwayat transaksi yang telah Anda proses",
      href: "/kasir/riwayat",
      icon: History,
      color: "bg-gradient-to-br from-blue-500 to-cyan-600",
      darkModeColor: "dark:bg-gradient-to-br dark:from-blue-700 dark:to-cyan-800",
      textColor: "text-white",
    },
    {
      title: "Profil Saya",
      description: "Ubah data profil kasir",
      href: "/kasir/profile",
      icon: User,
      color: "bg-gradient-to-br from-emerald-500 to-teal-600",
      darkModeColor: "dark:bg-gradient-to-br dark:from-emerald-700 dark:to-teal-800",
      textColor: "text-white",
    },
  ];

  const formatCurrency = (amount) => {
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
            <div className="mb-8">
              <ScrollingStockAlert darkMode={darkMode} />
            </div>

            <div className="mb-8">
              <h1 className={`text-3xl md:text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Selamat Datang, {session?.user?.name || 'Kasir'}
              </h1>
              <p className={`mt-2 text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Dashboard Kasir - Manajemen Penjualan dan Transaksi
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div className={`p-6 rounded-2xl shadow-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center mb-4">
                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                      <Users className={`h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    </div>
                    <h2 className={`text-xl font-bold ml-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Tips Harian</h2>
                  </div>
                  <ul className={`space-y-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {/* Tips items */}
                  </ul>
                </div>
              </div>

              <div className="lg:col-span-1 space-y-8">
                <div>
                  <div className="flex items-center mb-6">
                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
                      <TrendingUp className={`h-5 w-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                    </div>
                    <h2 className={`text-2xl font-bold ml-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Ringkasan Hari Ini</h2>
                  </div>

                  <div className="grid grid-cols-1 gap-5">
                    {/* Summary cards */}
                  </div>
                </div>

                <div>
                  <div className="flex items-center mb-6">
                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-yellow-900/30' : 'bg-yellow-100'}`}>
                      <Package className={`h-5 w-5 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                    </div>
                    <h2 className={`text-2xl font-bold ml-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Produk Stok Menipis</h2>
                  </div>

                  <div className={`p-5 rounded-2xl shadow-lg border ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`}>
                    {/* Low stock products list */}
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