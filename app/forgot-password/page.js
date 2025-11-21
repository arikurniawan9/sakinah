// app/forgot-password/page.js
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Simulasikan pengiriman permintaan reset password
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulasi delay API
      
      setMessage('Link reset password telah dikirim ke email Anda. Silakan cek inbox atau spam folder Anda.');
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-theme-purple-50 to-theme-purple-100 p-4">
      <div className="max-w-md w-full space-y-8 card-theme-purple">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-theme-purple-700">Lupa Password?</h2>
          <p className="mt-2 text-theme-purple-600">
            Masukkan email Anda dan kami akan kirimkan link untuk reset password
          </p>
        </div>

        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{message}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-theme-purple-500 focus:border-theme-purple-500 focus:z-10 sm:text-sm"
                placeholder="Email Anda"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-theme-purple-500 hover:bg-theme-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-purple-500 disabled:bg-gray-400"
            >
              {loading ? 'Mengirim...' : 'Kirim Link Reset'}
            </button>
          </div>

          <div className="text-center text-sm text-gray-600">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-theme-purple-600 hover:text-theme-purple-800 font-medium"
            >
              Kembali ke login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}