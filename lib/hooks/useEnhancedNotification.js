// lib/hooks/useEnhancedNotification.js
import { useState, useCallback } from 'react';

export const useEnhancedNotification = () => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((message, type = 'info', title = null, description = null, duration = 5000) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      message,
      type,
      title,
      description,
      duration
    };

    setNotifications(prev => [...prev, notification]);

    // Otomatis hapus notifikasi setelah durasi
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const showError = useCallback((message, title = 'Error', description = null) => {
    return showNotification(message, 'error', title, description);
  }, [showNotification]);

  const showSuccess = useCallback((message, title = 'Berhasil', description = null) => {
    return showNotification(message, 'success', title, description);
  }, [showNotification]);

  const showWarning = useCallback((message, title = 'Peringatan', description = null) => {
    return showNotification(message, 'warning', title, description);
  }, [showNotification]);

  const showInfo = useCallback((message, title = 'Informasi', description = null) => {
    return showNotification(message, 'info', title, description);
  }, [showNotification]);

  return {
    notifications,
    showNotification,
    removeNotification,
    showError,
    showSuccess,
    showWarning,
    showInfo
  };
};