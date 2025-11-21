'use client';

import { useUserTheme } from '@/components/UserThemeContext';
import { useState } from 'react';

const UserThemeSettings = () => {
  const { userTheme, updateUserTheme } = useUserTheme();
  const [tempTheme, setTempTheme] = useState({
    darkMode: userTheme.darkMode,
    themeColor: userTheme.themeColor,
    themeName: userTheme.themeName
  });

  const handleSave = () => {
    updateUserTheme(tempTheme);
  };

  const handleThemeColorChange = (color) => {
    setTempTheme(prev => ({
      ...prev,
      themeColor: color
    }));
  };

  const handleThemeNameChange = (name) => {
    setTempTheme(prev => ({
      ...prev,
      themeName: name
    }));
  };

  const themeColors = [
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Orange', value: '#F59E0B' },
    { name: 'Pink', value: '#EC4899' },
  ];

  const themePresets = [
    { name: 'default', label: 'Default' },
    { name: 'modern', label: 'Modern' },
    { name: 'classic', label: 'Classic' },
    { name: 'vibrant', label: 'Vibrant' },
  ];

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Pengaturan Tema</h3>
      
      <div className="space-y-6">
        {/* Theme Color Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Warna Tema
          </label>
          <div className="flex flex-wrap gap-2">
            {themeColors.map((color) => (
              <button
                key={color.value}
                type="button"
                className={`w-8 h-8 rounded-full border-2 ${
                  tempTheme.themeColor === color.value
                    ? 'border-gray-800 dark:border-gray-200 ring-2 ring-offset-2 ring-blue-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                style={{ backgroundColor: color.value }}
                onClick={() => handleThemeColorChange(color.value)}
                title={color.name}
              />
            ))}
          </div>
          <div className="mt-2">
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Warna Kustom</label>
            <input
              type="color"
              value={tempTheme.themeColor}
              onChange={(e) => handleThemeColorChange(e.target.value)}
              className="w-12 h-10 p-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
            />
          </div>
        </div>

        {/* Theme Preset Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Preset Tema
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {themePresets.map((preset) => (
              <button
                key={preset.name}
                type="button"
                className={`py-2 px-3 rounded-md text-sm font-medium ${
                  tempTheme.themeName === preset.name
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }`}
                onClick={() => handleThemeNameChange(preset.name)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mode Gelap</span>
          <div className="relative inline-flex items-center h-6 rounded-full w-11 bg-gray-200 dark:bg-gray-700">
            <input
              type="checkbox"
              checked={tempTheme.darkMode}
              onChange={(e) => setTempTheme(prev => ({ ...prev, darkMode: e.target.checked }))}
              className="sr-only"
            />
            <span
              className={`${
                tempTheme.darkMode ? 'translate-x-6' : 'translate-x-1'
              } inline-block w-4 h-4 transform bg-white dark:bg-gray-300 rounded-full transition`}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
          >
            Simpan Pengaturan Tema
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserThemeSettings;