'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const UserThemeContext = createContext();

export const UserThemeProvider = ({ children }) => {
  const [userTheme, setUserTheme] = useState({
    darkMode: false,
    themeColor: '#8B5CF6', // Default purple
    themeName: 'default' // default, modern, classic, etc.
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // Load user theme from localStorage on mount
  useEffect(() => {
    const savedUserTheme = localStorage.getItem('user-theme');
    if (savedUserTheme) {
      try {
        const parsedTheme = JSON.parse(savedUserTheme);
        setUserTheme(parsedTheme);
      } catch (e) {
        console.error('Error parsing user theme from localStorage:', e);
      }
    } else {
      // Check for legacy theme settings and migrate if needed
      const legacyTheme = localStorage.getItem('theme');
      if (legacyTheme) {
        try {
          const isDark = legacyTheme === 'dark';
          setUserTheme(prev => ({
            ...prev,
            darkMode: isDark
          }));
          // Remove legacy setting
          localStorage.removeItem('theme');
        } catch (e) {
          console.error('Error migrating legacy theme:', e);
        }
      }
    }
    setIsInitialized(true);
  }, []);

  // Apply theme changes when userTheme changes
  useEffect(() => {
    if (!isInitialized) return;

    // Apply dark mode class
    if (userTheme.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply theme color
    document.documentElement.style.setProperty('--theme-color', userTheme.themeColor);

    // Save to localStorage
    localStorage.setItem('user-theme', JSON.stringify(userTheme));
  }, [userTheme, isInitialized]);

  const updateUserTheme = useCallback((newTheme) => {
    setUserTheme(prev => ({
      ...prev,
      ...newTheme
    }));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setUserTheme(prev => ({
      ...prev,
      darkMode: !prev.darkMode
    }));
  }, []);

  const resetToDefault = useCallback(() => {
    setUserTheme({
      darkMode: false,
      themeColor: '#8B5CF6',
      themeName: 'default'
    });
  }, []);

  // Ensure we don't render with incorrect theme during hydration
  if (!isInitialized) {
    return (
      <UserThemeContext.Provider value={{
        userTheme: { darkMode: false, themeColor: '#8B5CF6', themeName: 'default' },
        updateUserTheme: () => {},
        toggleDarkMode: () => {},
        resetToDefault: () => {}
      }}>
        {children}
      </UserThemeContext.Provider>
    );
  }

  return (
    <UserThemeContext.Provider value={{
      userTheme,
      updateUserTheme,
      toggleDarkMode,
      resetToDefault
    }}>
      {children}
    </UserThemeContext.Provider>
  );
};

export const useUserTheme = () => {
  const context = useContext(UserThemeContext);
  if (!context) {
    throw new Error('useUserTheme must be used within a UserThemeProvider');
  }
  return context;
};