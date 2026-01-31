'use client';

import { useState } from 'react';
import { X, Store, User, MapPin, Phone, Mail, Key, Hash, Building, AlertCircle } from 'lucide-react';

const CreateStoreModal = ({ isOpen, onClose, onStoreCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    status: 'ACTIVE'
  });
  const [adminData, setAdminData] = useState({
    name: '',
    username: '',
    employeeNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi form sebelum submit
    if (!formData.name.trim()) {
      setError('Nama toko wajib diisi');
      return;
    }

    if (!formData.address.trim()) {
      setError('Alamat toko wajib diisi');
      return;
    }

    if (!adminData.name.trim()) {
      setError('Nama admin wajib diisi');
      return;
    }

    if (!adminData.username.trim()) {
      setError('Username admin wajib diisi');
      return;
    }

    if (!adminData.password) {
      setError('Password admin wajib diisi');
      return;
    }

    // Validasi password
    if (adminData.password !== adminData.confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok');
      return;
    }

    // Validasi panjang password
    if (adminData.password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          store: formData,
          admin: adminData
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Reset form
        setFormData({
          name: '',
          code: '',
          description: '',
          address: '',
          phone: '',
          email: '',
          status: 'ACTIVE'
        });
        setAdminData({
          name: '',
          username: '',
          employeeNumber: '',
          password: '',
          confirmPassword: ''
        });

        // Panggil callback untuk refresh data
        if (onStoreCreated) {
          onStoreCreated();
        }

        onClose();
      } else {
        setError(result.error || 'Gagal membuat toko');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat membuat toko');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAdminChange = (e) => {
    const { name, value } = e.target;
    setAdminData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700 rounded-t-xl">
          <div className="flex items-center space-x-2">
            <Store className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Tambah Toko Baru</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
            aria-label="Tutup modal"
          >
            <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-300 flex items-start">
              <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Informasi Toko */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-blue-500" />
                <h3 className="text-md font-semibold text-gray-900 dark:text-white">Informasi Toko</h3>
              </div>

              <div>
                <label htmlFor="name" className="flex items-center space-x-1 block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                  <Store className="h-3 w-3" />
                  <span>Nama Toko *</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Masukkan nama toko"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  />
                  <Store className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                </div>
              </div>

              <div>
                <label htmlFor="code" className="flex items-center space-x-1 block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                  <Hash className="h-3 w-3" />
                  <span>Kode Toko</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="Contoh: TOKO001"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  />
                  <Hash className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                </div>
              </div>

              <div>
                <label htmlFor="address" className="flex items-center space-x-1 block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                  <MapPin className="h-3 w-3" />
                  <span>Alamat *</span>
                </label>
                <div className="relative">
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    rows="2"
                    placeholder="Alamat lengkap toko"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  ></textarea>
                  <MapPin className="absolute left-2.5 top-2 h-3 w-3 text-gray-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="phone" className="flex items-center space-x-1 block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                    <Phone className="h-3 w-3" />
                    <span>Telepon</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="0812-3456-7890"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                    />
                    <Phone className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="flex items-center space-x-1 block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                    <Mail className="h-3 w-3" />
                    <span>Email</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="email@toko.com"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                    />
                    <Mail className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="status" className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                >
                  <option value="ACTIVE">Aktif</option>
                  <option value="INACTIVE">Tidak Aktif</option>
                  <option value="SUSPENDED">Ditangguhkan</option>
                </select>
              </div>
            </div>

            {/* Informasi Admin */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-green-500" />
                <h3 className="text-md font-semibold text-gray-900 dark:text-white">Akun Admin</h3>
              </div>

              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div className="space-y-3">
                  <div>
                    <label htmlFor="adminName" className="flex items-center space-x-1 block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                      <User className="h-3 w-3" />
                      <span>Nama Lengkap Admin *</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="adminName"
                        name="name"
                        value={adminData.name}
                        onChange={handleAdminChange}
                        required
                        placeholder="Nama lengkap admin"
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white text-sm"
                      />
                      <User className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="username" className="flex items-center space-x-1 block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                      <Hash className="h-3 w-3" />
                      <span>Username *</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="username"
                        name="username"
                        value={adminData.username}
                        onChange={handleAdminChange}
                        required
                        placeholder="Username untuk login"
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white text-sm"
                      />
                      <Hash className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="flex items-center space-x-1 block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                      <Key className="h-3 w-3" />
                      <span>Password *</span>
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={adminData.password}
                        onChange={handleAdminChange}
                        required
                        placeholder="Minimal 6 karakter"
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white text-sm"
                      />
                      <Key className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="flex items-center space-x-1 block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                      <Key className="h-3 w-3" />
                      <span>Konfirmasi Password *</span>
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={adminData.confirmPassword}
                        onChange={handleAdminChange}
                        required
                        placeholder="Ulangi password"
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white text-sm"
                      />
                      <Key className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
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
                disabled={loading}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition-all duration-200 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Membuat...
                  </>
                ) : (
                  'Buat Toko'
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              disabled={loading}
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStoreModal;