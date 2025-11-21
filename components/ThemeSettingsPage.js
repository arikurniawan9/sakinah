'use client';

import { useUserTheme } from '@/components/UserThemeContext';
import UserThemeSettings from '@/components/UserThemeSettings';

const ThemeSettingsPage = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pengaturan Tema</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Atur preferensi tampilan Anda secara personal
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <UserThemeSettings />
        </div>
        
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Pratinjau Tema</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                <h4 className="font-medium text-gray-800 dark:text-gray-200">Contoh Header</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Ini adalah contoh elemen dengan tema yang Anda pilih
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="h-3 rounded" style={{ backgroundColor: 'var(--theme-color)' }}></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded"></div>
              </div>
              
              <button 
                className="px-4 py-2 rounded text-white font-medium"
                style={{ backgroundColor: 'var(--theme-color)' }}
              >
                Contoh Tombol
              </button>
            </div>
          </div>
          
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Info Tema</h3>
            <div className="space-y-2 text-sm">
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">Mode:</span> {useUserTheme().userTheme.darkMode ? 'Gelap' : 'Terang'}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">Warna Utama:</span> {useUserTheme().userTheme.themeColor}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">Preset:</span> {useUserTheme().userTheme.themeName}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSettingsPage;