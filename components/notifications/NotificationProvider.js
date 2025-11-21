// components/notifications/NotificationProvider.js
'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
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
  }, []);

  // Fungsi untuk menampilkan notifikasi dengan durasi spesifik
  const showTimedNotification = useCallback((message, type = 'info', duration = 5000) => {
    showNotification(message, type, { autoClose: duration });
  }, [showNotification]);

  return (
    <NotificationContext.Provider value={{ showNotification, showTimedNotification }}>
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
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;