'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useUserTheme } from '../../../components/UserThemeContext';
import { useTheme } from '../../../components/ThemeContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Breadcrumb from '../../../components/Breadcrumb';
import { User, Lock, Save } from 'lucide-react';

export default function WarehouseProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const { themeColor } = useTheme();

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    employeeNumber: '',
    currentPassword: '',
    password: '',
    passwordConfirm: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || '',
        username: session.user.username || '',
        employeeNumber: session.user.employeeNumber || '',
        currentPassword: '',
        password: '',
        passwordConfirm: '',
      });
    }
  }, [session]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.currentPassword) {
      toast.error('Silakan masukkan kata sandi Anda saat ini.');
      return;
    }

    if (formData.password && formData.password !== formData.passwordConfirm) {
      toast.error('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      toast.error('Kata sandi baru minimal harus 6 karakter.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: formData.name,
        username: formData.username,
        currentPassword: formData.currentPassword,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal menyimpan profil.');
      }

      // Manually update the session to reflect changes instantly
      await updateSession({
        ...session,
        user: {
          ...session.user,
          name: result.name,
          username: result.username,
        },
      });

      toast.success('Profil berhasil diperbarui!');
      // Clear password fields after successful update
      setFormData(prev => ({ ...prev, currentPassword: '', password: '', passwordConfirm: '' }));

    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
    darkMode
      ? 'bg-gray-700 border-gray-600 text-white focus:ring-primary'
      : 'bg-white border-gray-300 text-gray-900 focus:ring-primary'
  }`;

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
          { title: 'Dashboard Gudang', href: '/warehouse' },
          { title: 'Profil', href: '/warehouse/profile' }
        ]}
        darkMode={darkMode}
      />

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme={darkMode ? 'dark' : 'light'} />

      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Pengaturan Profil
        </h1>
        <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Perbarui informasi pribadi dan keamanan akun Anda sebagai pengguna gudang.
        </p>
      </div>

      <form onSubmit={handleSubmit} className={`rounded-xl shadow-lg p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="space-y-6">
          <div>
            <h2 className={`text-lg font-semibold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <User className="mr-2 h-5 w-5" />
              Informasi Pribadi
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label htmlFor="username" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Username *
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label htmlFor="employeeNumber" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Nomor Pegawai
                </label>
                <input
                  type="text"
                  id="employeeNumber"
                  name="employeeNumber"
                  value={formData.employeeNumber}
                  className={`${inputClass} ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className={`text-lg font-semibold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <Lock className="mr-2 h-5 w-5" />
              Ubah Kata Sandi
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="currentPassword" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Kata Sandi Saat Ini *
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className={inputClass}
                  required
                  placeholder="Masukkan kata sandi saat ini"
                />
              </div>
              <div></div> {/* Empty div for alignment */}
              <div>
                <label htmlFor="password" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Kata Sandi Baru
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={inputClass}
                  placeholder="Kosongkan jika tidak ingin diubah"
                />
              </div>
              <div>
                <label htmlFor="passwordConfirm" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Konfirmasi Kata Sandi
                </label>
                <input
                  type="password"
                  id="passwordConfirm"
                  name="passwordConfirm"
                  value={formData.passwordConfirm}
                  onChange={handleInputChange}
                  className={inputClass}
                  placeholder="Konfirmasi kata sandi baru"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className={`flex items-center px-6 py-3 rounded-lg font-medium ${
              isSaving
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                Simpan Perubahan
              </>
            )}
          </button>
        </div>
      </form>
    </main>
  );
}