'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useDarkMode } from '@/components/DarkModeContext';
import { useTheme } from '@/components/ThemeContext';
import { Settings, Store, Shield, Cog } from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';

export default function PengaturanIndex() {
  const { data: session } = useSession();
  const { darkMode } = useDarkMode();
  const { themeColor } = useTheme();

  const [activeTab, setActiveTab] = useState('toko'); // Default to 'toko' tab

  // Import komponen langsung di sini
  const TokoSettings = () => (
    <div className={`p-6 rounded-xl shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Pengaturan Toko</h3>

      <div className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Nama Toko</label>
          <input
            type="text"
            className={`w-full px-3 py-2 border rounded-md ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            placeholder="Nama toko Anda"
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Alamat</label>
          <textarea
            rows="3"
            className={`w-full px-3 py-2 border rounded-md ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            placeholder="Alamat toko Anda"
          ></textarea>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Telepon</label>
          <input
            type="text"
            className={`w-full px-3 py-2 border rounded-md ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            placeholder="Nomor telepon toko"
          />
        </div>

        <button className={`px-4 py-2 rounded-md text-white ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
          Simpan Pengaturan Toko
        </button>
      </div>
    </div>
  );

  const SistemSettings = () => (
    <div className={`p-6 rounded-xl shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Pengaturan Sistem</h3>
      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-4`}>Fitur pengaturan sistem akan segera tersedia.</p>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Mode Debug</h4>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Aktifkan mode debug untuk pengembangan</p>
          </div>
          <div className="relative inline-block w-10 mr-2 align-middle select-none">
            <input type="checkbox" id="debugMode" className="sr-only" />
            <label htmlFor="debugMode" className="block h-6 w-10 rounded-full bg-gray-300 cursor-pointer"></label>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Backup Otomatis</h4>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Lakukan backup database secara otomatis</p>
          </div>
          <div className="relative inline-block w-10 mr-2 align-middle select-none">
            <input type="checkbox" id="autoBackup" className="sr-only" />
            <label htmlFor="autoBackup" className="block h-6 w-10 rounded-full bg-gray-300 cursor-pointer"></label>
          </div>
        </div>
      </div>
    </div>
  );

  const KeamananSettings = () => (
    <div className={`p-6 rounded-xl shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Pengaturan Keamanan</h3>
      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Fitur pengaturan keamanan akan segera tersedia.</p>

      <div className="mt-4 space-y-4">
        <div className="p-4 border rounded-lg">
          <h4 className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Password</h4>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Ubah password akun Anda</p>
          <button className="mt-2 px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300">
            Ganti Password
          </button>
        </div>

        <div className="p-4 border rounded-lg">
          <h4 className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Akses</h4>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Atur izin akses pengguna</p>
          <button className="mt-2 px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300">
            Atur Akses
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb
          items={[{ title: 'Pengaturan', href: '/admin/pengaturan' }]}
          darkMode={darkMode}
        />

        <div className="mb-6">
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Pengaturan</h1>
          <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Kelola pengaturan sistem dan toko Anda
          </p>
        </div>

        {/* Tab Navigation */}
        <div className={`mb-6 rounded-lg p-1 ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('toko')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
                activeTab === 'toko'
                  ? `${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} shadow`
                  : `${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Store className="w-4 h-4" />
                <span>Pengaturan Toko</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('sistem')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
                activeTab === 'sistem'
                  ? `${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} shadow`
                  : `${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Cog className="w-4 h-4" />
                <span>Pengaturan Sistem</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('keamanan')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
                activeTab === 'keamanan'
                  ? `${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} shadow`
                  : `${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Keamanan</span>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'toko' && <TokoSettings />}
          {activeTab === 'sistem' && <SistemSettings />}
          {activeTab === 'keamanan' && <KeamananSettings />}
        </div>
      </main>
    </ProtectedRoute>
  );
}