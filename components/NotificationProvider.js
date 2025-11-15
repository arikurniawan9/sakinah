// components/NotificationProvider.js
'use client';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDarkMode } from './DarkModeContext';

export default function NotificationProvider({ children }) {
  const { darkMode } = useDarkMode();

  // Konfigurasi default untuk notifikasi
  const toastConfig = {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: darkMode ? 'dark' : 'light',
  };

  return (
    <>
      {children}
      <ToastContainer {...toastConfig} />
    </>
  );
}