'use client';

import { useUserTheme } from '@/components/UserThemeContext';
import { Moon, Sun } from 'lucide-react';

const ThemeToggle = () => {
  const { userTheme, toggleDarkMode } = useUserTheme();

  return (
    <button
      onClick={toggleDarkMode}
      className="relative rounded-full p-2 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      aria-label={userTheme.darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {userTheme.darkMode ? (
        <Sun className="h-5 w-5 text-gray-800 dark:text-gray-200" />
      ) : (
        <Moon className="h-5 w-5 text-gray-800 dark:text-gray-200" />
      )}
    </button>
  );
};

export default ThemeToggle;