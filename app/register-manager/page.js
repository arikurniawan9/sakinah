'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ROLES } from '@/lib/constants';
import { User, Lock, Key, CheckCircle, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';

export default function RegisterManagerPage() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [checking, setChecking] = useState(true);
  const [managerExists, setManagerExists] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Cek apakah sudah ada akun MANAGER
  useEffect(() => {
    if (status === 'loading') return;

    const checkManagerExists = async () => {
      try {
        const response = await fetch('/api/check-manager');
        const data = await response.json();
        setManagerExists(data.exists);
        setChecking(false);
      } catch (error) {
        console.error('Error checking manager existence:', error);
        setChecking(false);
      }
    };

    checkManagerExists();
  }, [status]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validasi input
    if (!name || !username || !password) {
      setError('Semua field harus diisi');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    try {
      const response = await fetch('/api/register-manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          username,
          password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          // Login langsung setelah register
          signIn('credentials', {
            username,
            password,
            redirect: false,
          }).then(() => {
            router.push('/manager');
          });
        }, 2000);
      } else {
        setError(result.error || 'Gagal membuat akun manager');
      }
    } catch (error) {
      setError('Terjadi kesalahan saat membuat akun');
      console.error('Registration error:', error);
    }
  };

  if (status === 'authenticated') {
    if (session.user.role === ROLES.MANAGER) {
      router.push('/manager');
    } else {
      router.push('/unauthorized');
    }
    return null;
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          </div>
          <p className="text-gray-600 text-lg">Memeriksa status akun...</p>
        </div>
      </div>
    );
  }

  if (managerExists) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 transform hover:scale-[1.02]">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 text-white text-center">
            <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold">Akses Ditolak</h2>
            <p className="opacity-90">Akun MANAGER sudah terdaftar</p>
          </div>
          
          <div className="p-8">
            <div className="text-center">
              <p className="text-gray-600 mb-2">Sudah ada akun MANAGER di sistem.</p>
              <p className="text-gray-500 text-sm mb-6">Hubungi administrator untuk login.</p>

              <button
                onClick={() => router.push('/login')}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white py-3 px-4 rounded-xl transition duration-200 font-medium shadow-md hover:shadow-lg"
              >
                Ke Halaman Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-md w-full">
        {/* Card Utama */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 transform hover:shadow-2xl">
          {/* Header Gradient */}
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-700/20"></div>
            <div className="relative z-10">
              <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold">Daftar Akun Manager</h2>
              <p className="opacity-90">Buat akun manager pertama untuk sistem</p>
            </div>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 transition-all duration-200">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {success ? (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2 transition-all duration-200">
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">Akun MANAGER berhasil dibuat! Mengalihkan ke dashboard...</span>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {/* Nama Lengkap */}
                  <div className="relative">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Lengkap
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 bg-gray-50 focus:bg-white"
                        placeholder="Masukkan nama lengkap anda"
                      />
                    </div>
                  </div>

                  {/* Username */}
                  <div className="relative">
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        id="username"
                        name="username"
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 bg-gray-50 focus:bg-white"
                        placeholder="Masukkan username untuk login"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="relative">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 bg-gray-50 focus:bg-white"
                        placeholder="Masukkan password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>

                  {/* Konfirmasi Password */}
                  <div className="relative">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Konfirmasi Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 bg-gray-50 focus:bg-white"
                        placeholder="Konfirmasi password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white py-3 px-4 rounded-xl transition duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    Buat Akun Manager
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={() => router.push('/login')}
                className="text-purple-600 hover:text-purple-800 font-medium transition duration-200"
              >
                Sudah punya akun? Login disini
              </button>
            </div>
          </div>
        </div>
        
        {/* Dekorasi tambahan */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Toko Sakinah. Dilindungi sepenuhnya.
          </p>
        </div>
      </div>
    </div>
  );
}