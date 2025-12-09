'use client';

import { useUserTheme } from '../../../components/UserThemeContext';
import Breadcrumb from '../../../components/Breadcrumb';

export default function DistributionsPage() {
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
          { title: 'Admin', href: '/admin' },
          { title: 'Distribusi', href: '/admin/distributions' }
        ]}
        darkMode={darkMode}
      />

      <div className="mb-6">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Manajemen Distribusi
        </h1>
        <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Kelola distribusi dari gudang pusat ke toko Anda
        </p>
      </div>

      <div className={`rounded-xl shadow-lg p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <a
            href="/admin/distributions/pending"
            className={`p-6 rounded-lg shadow border-2 border-dashed ${
              darkMode
                ? 'border-blue-500 bg-blue-900/20 hover:bg-blue-900/30'
                : 'border-blue-300 bg-blue-50 hover:bg-blue-100'
            } transition-colors duration-200`}
          >
            <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
              Distribusi Menunggu
            </h3>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Lihat dan kelola distribusi dari gudang yang menunggu konfirmasi Anda
            </p>
          </a>

          <div className={`p-6 rounded-lg shadow ${
            darkMode
              ? 'bg-gray-700'
              : 'bg-gray-100'
          }`}>
            <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Riwayat Distribusi
            </h3>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Lihat riwayat distribusi yang telah diterima atau ditolak
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}