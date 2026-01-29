// components/notifications/NotificationProvider.js
'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import EnhancedNotification from '@/components/pelayan/EnhancedNotification';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Fungsi untuk menampilkan notifikasi
  const showNotification = useCallback((message, type = 'info', options = {}) => {
    const defaultOptions = {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    };

    const notificationOptions = { ...defaultOptions, ...options };

    switch (type) {
      case 'success':
        toast.success(message, notificationOptions);
        break;
      case 'error':
        toast.error(message, notificationOptions);
        break;
      case 'warning':
        toast.warn(message, notificationOptions);
        break;
      case 'info':
      default:
        toast.info(message, notificationOptions);
        break;
    }

    // Tambahkan ke sistem notifikasi lokal juga
    const id = Date.now() + Math.random();
    const notification = {
      id,
      message,
      type,
      duration: notificationOptions.autoClose || 5000
    };

    setNotifications(prev => [...prev, notification]);

    // Otomatis hapus notifikasi lokal setelah durasi
    if (notificationOptions.autoClose > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, notificationOptions.autoClose);
    }
  }, []);

  // Fungsi untuk menampilkan notifikasi dengan durasi spesifik
  const showTimedNotification = useCallback((message, type = 'info', duration = 5000) => {
    showNotification(message, type, { autoClose: duration });
  }, [showNotification]);

  // Fungsi untuk menghapus notifikasi
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{
      showNotification,
      showTimedNotification,
      removeNotification,
      notifications
    }}>
      {children}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <EnhancedNotification
        notifications={notifications}
        removeNotification={removeNotification}
      />
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;