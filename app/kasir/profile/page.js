// app/kasir/profile/page.js
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Sidebar from '../../../components/Sidebar';
import { useDarkMode } from '../../../components/DarkModeContext';
import { User } from 'lucide-react';

export default function CashierProfile() {
  const { data: session, update: updateSession } = useSession();
  const { darkMode } = useDarkMode();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '', // Display only, not editable
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        name: session.user.name || '',
        email: session.user.email || '',
      }));
    }
  }, [session]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Kata sandi dan konfirmasi kata sandi tidak cocok.');
      setLoading(false);
      return;
    }

    try {
      const payload = { name: formData.name };
      if (formData.password) {
        payload.password = formData.password;
      }

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('Profil berhasil diperbarui!');
        // Update session data if name changed
        if (session?.user?.name !== formData.name) {
          await updateSession({ user: { name: formData.name } });
        }
        // Clear password fields after successful update
        setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Gagal memperbarui profil.');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Terjadi kesalahan saat memperbarui profil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="CASHIER">
      <Sidebar>
        <main className={`flex-1 p-4 min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Profil Kasir</h1>
              <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Kelola informasi profil Anda</p>
            </div>

            {success && (
              <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200'} border`}>
                <p className={`text-sm ${darkMode ? 'text-green-300' : 'text-green-700'}`}>{success}</p>
              </div>
            )}

            {error && (
              <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200'} border`}>
                <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
              </div>
            )}

                        <div className={`rounded-xl shadow ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border overflow-hidden`}>
                          <form onSubmit={handleSubmit}>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Nama */}
                                <div>
                                  <label htmlFor="name" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Nama
                                  </label>
                                  <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                                      darkMode 
                                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                    }`}
                                    required
                                  />
                                </div>
            
                                {/* Email (Read-only) */}
                                <div>
                                  <label htmlFor="email" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Email
                                  </label>
                                  <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    readOnly
                                    className={`w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 cursor-not-allowed ${
                                      darkMode 
                                        ? 'border-gray-600 text-gray-400' 
                                        : 'border-gray-300 text-gray-600'
                                    }`}
                                  />
                                </div>
            
                                {/* Kata Sandi Baru */}
                                <div>
                                  <label htmlFor="password" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Kata Sandi Baru (kosongkan jika tidak ingin mengubah)
                                  </label>
                                  <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                                      darkMode 
                                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                    }`}
                                  />
                                </div>
            
                                {/* Konfirmasi Kata Sandi */}
                                <div>
                                  <label htmlFor="confirmPassword" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Konfirmasi Kata Sandi
                                  </label>
                                  <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                                      darkMode 
                                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                    }`}
                                  />
                                </div>
                              </div>
            
                              <div className="mt-8 flex justify-end">
                                <button
                                  type="submit"
                                  disabled={loading}
                                  className={`px-6 py-2 rounded-lg font-medium ${
                                    loading
                                      ? 'bg-gray-400 cursor-not-allowed'
                                      : `bg-purple-600 hover:bg-purple-700 text-white`
                                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
                                >
                                  {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                              </div>
                            </div>
                          </form>
                        </div>
                    </main>
      </Sidebar>
    </ProtectedRoute>
  );
}
