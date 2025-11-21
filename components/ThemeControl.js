'use client';

import { useUserTheme } from '@/components/UserThemeContext';
import { Moon, Sun, Palette } from 'lucide-react';
import { useState } from 'react';

const ThemeControl = ({ showLabel = true }) => {
  const { userTheme, toggleDarkMode } = useUserTheme();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <div className="relative">
      <button
        onClick={toggleMenu}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 shadow text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        aria-label="Theme options"
      >
        <Palette className="h-5 w-5" />
        {showLabel && <span className="hidden sm:inline">Tema</span>}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Mode Gelap
              </span>
              <button
                onClick={toggleDarkMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  userTheme.darkMode ? 'bg-blue-600' : 'bg-gray-200'
                }`}
                aria-label={userTheme.darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <span
                  className={`${
                    userTheme.darkMode ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                />
              </button>
            </div>
          </div>
          
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Warna Tema
            </h4>
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'Purple', value: '#8B5CF6' },
                { name: 'Blue', value: '#3B82F6' },
                { name: 'Green', value: '#10B981' },
                { name: 'Red', value: '#EF4444' },
              ].map((color) => (
                <button
                  key={color.value}
                  className={`w-6 h-6 rounded-full border-2 ${
                    userTheme.themeColor === color.value
                      ? 'border-gray-800 dark:border-gray-200 ring-2 ring-offset-2 ring-blue-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => {
                    localStorage.setItem('user-theme', JSON.stringify({
                      ...userTheme,
                      themeColor: color.value
                    }));
                    window.location.reload();
                  }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
          
          <div className="p-2">
            <button
              onClick={() => {
                localStorage.removeItem('user-theme');
                window.location.reload();
              }}
              className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            >
              Reset Tema
            </button>
          </div>
        </div>
      )}

      {/* Close menu when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default ThemeControl;