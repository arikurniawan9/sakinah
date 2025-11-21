'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeColor, setThemeColor] = useState('#8B5CF6'); // Default purple color
  const [shopName, setShopName] = useState('Toko Sakinah');

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/setting');
      if (response.ok) {
        const data = await response.json();
        const newThemeColor = data.themeColor || '#8B5CF6'; // Use fetched color or default purple
        setThemeColor(newThemeColor);

        if (data.shopName) {
            setShopName(data.shopName);
        }
      }
    } catch (error) {
      console.error('Failed to fetch theme settings:', error);
      // fallback to default color in case of error
      setThemeColor('#8B5CF6');
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateShopName = (newName) => {
    setShopName(newName);
  };

  // Update the theme color variable without affecting dark mode
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', themeColor);
  }, [themeColor]);

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
