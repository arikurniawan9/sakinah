'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeColor, setThemeColor] = useState('#3c8dbc'); // Default color - will be fixed
  const [shopName, setShopName] = useState('Toko Sakinah');

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/pengaturan');
      if (response.ok) {
        const data = await response.json();
        // Gunakan warna default karena fitur penggantian warna dihapus
        const defaultThemeColor = '#3c8dbc';
        setThemeColor(defaultThemeColor);
        document.documentElement.style.setProperty('--theme-color', defaultThemeColor);

        if (data.shopName) {
            setShopName(data.shopName);
        }
      }
    } catch (error) {
      console.error('Failed to fetch theme settings:', error);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateShopName = (newName) => {
    setShopName(newName);
  };

  // Fungsi updateThemeColor dihapus karena fitur penggantian warna dihapus


  return (
    <ThemeContext.Provider value={{ themeColor, shopName, updateShopName, fetchSettings }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
