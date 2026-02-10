// app/page.js - versi yang lebih menarik dan informatif
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ROLES } from '@/lib/constants';
import { ShoppingBag, Users, BarChart3, Package, Store, Shield, TrendingUp, Star, Sun, Moon } from 'lucide-react';
import { useUserTheme } from '@/components/UserThemeContext';

export default function Home() {
  const { data: session, status } = useSession();
  const { userTheme, toggleDarkMode } = useUserTheme();
  const [isClient, setIsClient] = useState(false);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);

    // Fetch stores data to show store information
    const fetchStores = async () => {
      try {
        // Gunakan API publik jika pengguna belum login, jika tidak gunakan API yang dilindungi
        const apiUrl = status === 'authenticated' ? '/api/stores' : '/api/public/stores';
        const response = await fetch(apiUrl);
        if (response.ok) {
          const data = await response.json();
          setStores(data.stores || []);
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();

    // Handle scroll effect for navbar
    const handleScroll = () => {
      const navbar = document.getElementById('navbar');
      if (navbar) {
        if (window.scrollY > 10) {
          navbar.classList.add('shadow-md');
          navbar.classList.remove('shadow-sm');
        } else {
          navbar.classList.add('shadow-sm');
          navbar.classList.remove('shadow-md');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Cleanup event listener
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [status]);

  // Fungsi untuk mendapatkan URL dashboard berdasarkan role
  const getDashboardUrl = () => {
    if (!session?.user?.role) return '/login';

    switch (session.user.role) {
      case ROLES.MANAGER:
        return '/manager';
      case ROLES.WAREHOUSE:
        return '/warehouse';
      case ROLES.ADMIN:
        return '/admin';
      case ROLES.CASHIER:
        return '/kasir';
      case ROLES.ATTENDANT:
        return '/pelayan';
      default:
        return '/login';
    }
  };

  // Feature cards data
  const features = [
    {
      icon: <ShoppingBag className="h-10 w-10 text-blue-500" />,
      title: "Manajemen Penjualan",
      description: "Catat dan lacak semua transaksi penjualan dengan cepat dan akurat"
    },
    {
      icon: <Package className="h-10 w-10 text-green-500" />,
      title: "Inventaris Real-time",
      description: "Pantau stok produk secara real-time di semua cabang toko Anda"
    },
    {
      icon: <BarChart3 className="h-10 w-10 text-purple-500" />,
      title: "Laporan Analitik",
      description: "Dapatkan insight bisnis melalui laporan yang komprehensif"
    },
    {
      icon: <Users className="h-10 w-10 text-yellow-500" />,
      title: "Multi Pengguna",
      description: "Koordinasikan tim Anda dengan akses role-based yang aman"
    },
    {
      icon: <Store className="h-10 w-10 text-red-500" />,
      title: "Multi Toko",
      description: "Kelola beberapa cabang toko dari satu platform terpusat"
    },
    {
      icon: <Shield className="h-10 w-10 text-indigo-500" />,
      title: "Keamanan Tinggi",
      description: "Dilengkapi dengan otentikasi dan otorisasi yang kuat"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-24">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm fixed top-0 left-0 right-0 z-50 transition-shadow duration-300" id="navbar">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Sakinah</h1>
          </div>

          <nav className="hidden md:flex space-x-8">
            <a href="#stores" className="text-gray-700 hover:text-blue-600 transition-all duration-300 relative pb-1 group">
              Toko
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="#about" className="text-gray-700 hover:text-blue-600 transition-all duration-300 relative pb-1 group">
              Tentang
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            {/* Dark/Light Mode Toggle */}
            <button
              onClick={() => toggleDarkMode()}
              className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/30 dark:hover:bg-gray-700/30 transition-colors duration-200"
              aria-label={userTheme?.darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {userTheme?.darkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
            
            {status === 'authenticated' ? (
              <Link
                href={getDashboardUrl()}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium py-2 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.03] hover:shadow-lg relative overflow-hidden group"
              >
                <span className="relative z-10">Dashboard</span>
                <span className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium py-2 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.03] hover:shadow-lg relative overflow-hidden group"
              >
                <span className="relative z-10">Login</span>
                <span className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 animate-fadeIn">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Solusi <span className="text-blue-600">Manajemen Toko</span> Modern
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto animate-slideUp delay-100">
            Sakinah adalah sistem informasi penjualan dan inventaris multi-toko yang dirancang untuk membantu Anda mengelola bisnis dengan lebih efisien dan profesional.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-slideUp delay-200">
            {status === 'authenticated' ? (
              <Link
                href={getDashboardUrl()}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium py-3 px-8 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl relative overflow-hidden group"
              >
                <span className="relative z-10">Ke Dashboard</span>
                <span className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium py-3 px-8 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl relative overflow-hidden group"
              >
                <span className="relative z-10">Login Sekarang</span>
                <span className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gray-50 animate-fadeIn">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="bg-gradient-to-b from-white to-gray-50 p-6 rounded-xl shadow-sm backdrop-blur-sm border border-gray-100/50 animate-slideUp delay-300 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl -z-10"></div>
              <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-gray-900">{stores.length}</h3>
              <p className="text-gray-600">Toko Terdaftar</p>
            </div>
            <div className="bg-gradient-to-b from-white to-gray-50 p-6 rounded-xl shadow-sm backdrop-blur-sm border border-gray-100/50 animate-slideUp delay-400 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl -z-10"></div>
              <Users className="h-8 w-8 text-blue-500 mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-gray-900">100+</h3>
              <p className="text-gray-600">Pengguna Aktif</p>
            </div>
            <div className="bg-gradient-to-b from-white to-gray-50 p-6 rounded-xl shadow-sm backdrop-blur-sm border border-gray-100/50 animate-slideUp delay-500 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl -z-10"></div>
              <Package className="h-8 w-8 text-purple-500 mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-gray-900">10K+</h3>
              <p className="text-gray-600">Produk Terverifikasi</p>
            </div>
            <div className="bg-gradient-to-b from-white to-gray-50 p-6 rounded-xl shadow-sm backdrop-blur-sm border border-gray-100/50 animate-slideUp delay-600 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl -z-10"></div>
              <Star className="h-8 w-8 text-yellow-500 mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-gray-900">4.9</h3>
              <p className="text-gray-600">Rating Pengguna</p>
            </div>
          </div>
        </div>
      </section>


      {/* Stores Section */}
      <section id="stores" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Daftar Toko Cabang</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Lihat beberapa toko yang telah bergabung dan menggunakan sistem kami
            </p>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.length > 0 ? (
                stores.slice(0, 6).map((store, index) => (
                  <div 
                    key={store.id} 
                    className="bg-white p-6 rounded-xl shadow-sm transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl -z-10"></div>
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold mr-4">
                        {store.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{store.name}</h3>
                        <p className="text-sm text-gray-500">{store.code}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Alamat:</span>
                        <span className="text-gray-900">{store.address || 'Tidak disediakan'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          store.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {store.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-600">Belum ada toko yang terdaftar</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Tentang Sakinah</h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              Sakinah adalah solusi manajemen toko modern yang dirancang untuk membantu pemilik usaha 
              mengelola operasional toko mereka dengan lebih efisien dan profesional. Dengan antarmuka 
              yang intuitif dan fitur-fitur canggih, Sakinah menjadi mitra ideal untuk pertumbuhan bisnis Anda.
            </p>
            <p className="text-gray-600 text-lg leading-relaxed">
              Kami percaya bahwa teknologi harus membantu, bukan mempersulit. Oleh karena itu, 
              Sakinah dibangun dengan fokus pada kemudahan penggunaan dan keandalan sistem.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <ShoppingBag className="h-8 w-8 text-blue-400" />
                <h3 className="text-xl font-bold">Sakinah</h3>
              </div>
              <p className="text-gray-400">
                Solusi manajemen toko modern untuk pertumbuhan bisnis Anda.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Layanan</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-all duration-300 relative pb-1 group">Manajemen Toko
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-3/4"></span>
                </a></li>
                <li><a href="#" className="hover:text-white transition-all duration-300 relative pb-1 group">Inventaris
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-3/4"></span>
                </a></li>
                <li><a href="#" className="hover:text-white transition-all duration-300 relative pb-1 group">Laporan
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-3/4"></span>
                </a></li>
                <li><a href="#" className="hover:text-white transition-all duration-300 relative pb-1 group">Analitik
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-3/4"></span>
                </a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Perusahaan</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-all duration-300 relative pb-1 group">Tentang Kami
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-3/4"></span>
                </a></li>
                <li><a href="#" className="hover:text-white transition-all duration-300 relative pb-1 group">Kontak
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-3/4"></span>
                </a></li>
                <li><a href="#" className="hover:text-white transition-all duration-300 relative pb-1 group">Karir
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-3/4"></span>
                </a></li>
                <li><a href="#" className="hover:text-white transition-all duration-300 relative pb-1 group">Blog
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-3/4"></span>
                </a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Dukungan</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-all duration-300 relative pb-1 group">Bantuan
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-3/4"></span>
                </a></li>
                <li><a href="#" className="hover:text-white transition-all duration-300 relative pb-1 group">Dokumentasi
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-3/4"></span>
                </a></li>
                <li><a href="#" className="hover:text-white transition-all duration-300 relative pb-1 group">API
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-3/4"></span>
                </a></li>
                <li><a href="#" className="hover:text-white transition-all duration-300 relative pb-1 group">Status
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-3/4"></span>
                </a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Sakinah. Semua hak dilindungi.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}