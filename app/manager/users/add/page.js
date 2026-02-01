'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ROLES } from '@/lib/constants';
import { X, UserPlus, User, AtSign, Lock, Building, Shield, Phone, Home, AlertCircle } from 'lucide-react';
import { useUserTheme } from '@/components/UserThemeContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AddUserPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { userTheme } = useUserTheme();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [userData, setUserData] = useState({
    name: '',
    username: '',
    employeeNumber: '',
    password: '',
    confirmPassword: '',
    storeId: '',
    role: 'CASHIER', // Default to CASHIER as before
    phone: '',
    address: ''
  });

  // Fetch stores
  useEffect(() => {
    if (status === 'loading') return;

    if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
      router.push('/unauthorized');
      return;
    }

    const fetchStores = async () => {
      try {
        const response = await fetch('/api/stores');
        const data = await response.json();

        if (response.ok) {
          setStores(data.stores || []);
        } else {
          console.error('Error fetching stores:', data.error);
          toast.error(data.error || 'Gagal mengambil data toko');
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
        toast.error('Terjadi kesalahan saat mengambil data toko');
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, [status, session, router]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => {
      // Jika role diubah, reset storeId jika role adalah MANAGER
      if (name === 'role') {
        return {
          ...prev,
          [name]: value,
          storeId: value === 'MANAGER' ? '' : prev.storeId
        };
      }
      return {
        ...prev,
        [name]: value
      };
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi input
    if (!userData.name.trim()) {
      toast.error('Nama wajib diisi');
      return;
    }

    if (!userData.username.trim()) {
      toast.error('Username wajib diisi');
      return;
    }

    if (!userData.password) {
      toast.error('Password wajib diisi');
      return;
    }

    if (userData.password.length < 6) {
      toast.error('Password minimal harus 6 karakter');
      return;
    }

    if (userData.password !== userData.confirmPassword) {
      toast.error('Password dan konfirmasi password tidak cocok');
      return;
    }

    if (!userData.storeId && userData.role !== 'MANAGER') {
      toast.error('Toko tujuan wajib dipilih untuk role selain Manager');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/manager/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userData.name.trim(),
          username: userData.username.trim(),
          employeeNumber: userData.employeeNumber.trim(),
          password: userData.password,
          role: userData.role,
          storeId: userData.storeId,
          phone: userData.phone.trim(),
          address: userData.address.trim()
        })
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`User ${userData.name} berhasil ditambahkan ke toko!`);
        // Redirect to users list after a short delay
        setTimeout(() => {
          router.push('/manager/users');
        }, 1500);
      } else {
        toast.error(result.error || 'Gagal menambahkan user');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error('Terjadi kesalahan saat menambahkan user');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close modal and go back to previous page
  const handleClose = () => {
    router.back();
  };

  // Hydration-safe loading and authentication checks
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

  if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
    router.push('/unauthorized');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700 rounded-t-xl">
          <div className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Tambah Pengguna Baru</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
            aria-label="Tutup modal"
          >
            <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {isSubmitting && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-300 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
              <span className="text-sm">Menyimpan pengguna...</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Informasi Pengguna */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-blue-500" />
                <h3 className="text-md font-semibold text-gray-900 dark:text-white">Informasi Pengguna</h3>
              </div>

              <div>
                <label htmlFor="name" className="flex items-center space-x-1 block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                  <User className="h-3 w-3" />
                  <span>Nama Lengkap *</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={userData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Masukkan nama lengkap pengguna"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  />
                  <User className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                </div>
              </div>

              <div>
                <label htmlFor="username" className="flex items-center space-x-1 block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                  <AtSign className="h-3 w-3" />
                  <span>Username *</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={userData.username}
                    onChange={handleInputChange}
                    required
                    placeholder="Username untuk login"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  />
                  <AtSign className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                </div>
              </div>

              <div>
                <label htmlFor="employeeNumber" className="flex items-center space-x-1 block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                  <User className="h-3 w-3" />
                  <span>Nomor Pegawai</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="employeeNumber"
                    name="employeeNumber"
                    value={userData.employeeNumber}
                    onChange={handleInputChange}
                    placeholder="Nomor pegawai (opsional)"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  />
                  <User className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="flex items-center space-x-1 block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                  <Phone className="h-3 w-3" />
                  <span>Telepon</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={userData.phone}
                    onChange={handleInputChange}
                    maxLength={13}
                    placeholder="Nomor telepon (opsional)"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  />
                  <Phone className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Informasi Akun */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-500" />
                <h3 className="text-md font-semibold text-gray-900 dark:text-white">Informasi Akun</h3>
              </div>

              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div className="space-y-3">
                  <div>
                    <label htmlFor="address" className="flex items-center space-x-1 block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                      <Home className="h-3 w-3" />
                      <span>Alamat</span>
                    </label>
                    <div className="relative">
                      <textarea
                        id="address"
                        name="address"
                        value={userData.address}
                        onChange={handleInputChange}
                        rows="2"
                        placeholder="Alamat pengguna (opsional)"
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white text-sm"
                      ></textarea>
                      <Home className="absolute left-2.5 top-2 h-3 w-3 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="flex items-center space-x-1 block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                      <Lock className="h-3 w-3" />
                      <span>Password *</span>
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={userData.password}
                        onChange={handleInputChange}
                        required
                        placeholder="Minimal 6 karakter"
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white text-sm"
                      />
                      <Lock className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="flex items-center space-x-1 block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                      <Lock className="h-3 w-3" />
                      <span>Konfirmasi Password *</span>
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={userData.confirmPassword}
                        onChange={handleInputChange}
                        required
                        placeholder="Ulangi password"
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white text-sm"
                      />
                      <Lock className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="storeId" className="flex items-center space-x-1 block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                      <Building className="h-3 w-3" />
                      <span>Toko *</span>
                    </label>
                    <div className="relative">
                      <select
                        id="storeId"
                        name="storeId"
                        value={userData.storeId}
                        onChange={handleInputChange}
                        required={userData.role !== 'MANAGER'}
                        disabled={stores.length === 0 || userData.role === 'MANAGER'}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white text-sm"
                      >
                        {!loading && stores.length === 0 && (
                          <option value="">Tidak ada toko tersedia</option>
                        )}
                        {loading && (
                          <option value="">Memuat toko...</option>
                        )}
                        {!loading && stores.length > 0 && (
                          <>
                            <option value="">Pilih Toko</option>
                            {stores.map(store => (
                              <option key={store.id} value={store.id}>{store.name}</option>
                            ))}
                          </>
                        )}
                      </select>
                      <Building className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                    </div>
                    {!loading && stores.length === 0 && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        Tidak ada toko yang tersedia. Silakan buat toko terlebih dahulu.
                      </p>
                    )}
                    {userData.role === 'MANAGER' && (
                      <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                        Role Manager tidak memerlukan pilihan toko karena memiliki akses global.
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="role" className="flex items-center space-x-1 block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                      <Shield className="h-3 w-3" />
                      <span>Peran *</span>
                    </label>
                    <div className="relative">
                      <select
                        id="role"
                        name="role"
                        value={userData.role}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white text-sm"
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="CASHIER">Kasir</option>
                        <option value="ATTENDANT">Pelayan</option>
                        <option value="MANAGER">Manager</option>
                        <option value="WAREHOUSE">Gudang</option>
                      </select>
                      <Shield className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row-reverse justify-between gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition-all duration-200 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Simpan Pengguna
                  </>
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              disabled={isSubmitting}
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}