// components/notifications/NotificationDropdown.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Bell } from 'lucide-react';
import { useUserTheme } from '@/components/UserThemeContext';

export default function NotificationDropdown() {
  const { data: session, status } = useSession();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    if (status === 'authenticated' && session?.user?.id) {
      setLoading(true);
      try {
        const response = await fetch(`/api/notifications?limit=5`); // Fetch top 5 notifications
        const data = await response.json();
        if (response.ok) {
          setNotifications(data.notifications);
          setUnreadCount(data.notifications.filter(n => !n.acknowledged).length);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const fetchUnreadCount = async () => {
    if (status === 'authenticated' && session?.user?.id) {
      try {
        const response = await fetch('/api/notifications/unread-count');
        const data = await response.json();
        if (response.ok) {
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error('Error fetching unread notification count:', error);
      }
    }
  };

  useEffect(() => {
    fetchUnreadCount(); // Initial fetch
  }, [status, session]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications(); // Fetch notifications when opening
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId }),
      });
      if (response.ok) {
        setNotifications(notifications.map(n =>
          n.id === notificationId ? { ...n, acknowledged: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (status !== 'authenticated') return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className={`relative p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
      >
        <Bell className={`h-6 w-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-2 w-80 rounded-md shadow-lg py-1 ${darkMode ? 'bg-gray-800' : 'bg-white'} ring-1 ring-black ring-opacity-5 z-50`}>
          <div className={`block px-4 py-2 text-xs font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            Notifikasi Anda ({unreadCount} belum dibaca)
          </div>
          {loading ? (
            <div className={`px-4 py-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Memuat...</div>
          ) : notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex justify-between items-center px-4 py-3 border-b last:border-b-0 ${darkMode ? 'border-gray-700' : 'border-gray-200'} ${!notification.acknowledged ? (darkMode ? 'bg-gray-700' : 'bg-blue-50') : ''}`}
              >
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    {notification.title}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {notification.message}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
                    {new Date(notification.createdAt).toLocaleString('id-ID')}
                  </p>
                </div>
                {!notification.acknowledged && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="ml-2 text-blue-500 hover:text-blue-700 text-xs flex-shrink-0"
                  >
                    Tandai dibaca
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className={`px-4 py-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Tidak ada notifikasi.</div>
          )}
        </div>
      )}
    </div>
  );
}