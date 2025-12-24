// components/NotificationProvider.js
'use client';

import { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useUserTheme } from './UserThemeContext';
import { useSession } from 'next-auth/react';
import io from 'socket.io-client';

let socket; // Declare socket outside to maintain singleton instance across re-renders

export default function NotificationProvider({ children }) {
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const { data: session } = useSession();

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection only once
    const socketInitializer = async () => {
      await fetch('/api/socket'); // Call the API route to initialize the socket.io server
      socket = io(undefined, {
        path: '/api/socket_io',
        addTrailingSlash: false,
      });

      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
        setIsConnected(true);
        // Join user-specific and store-specific rooms
        if (session?.user?.id) {
          socket.emit('joinRoom', `user-${session.user.id}`);
        }
        if (session?.user?.storeId) {
          socket.emit('joinRoom', `store-${session.user.storeId}`);
        }
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      socket.on('newNotification', (notification) => {
        console.log('Received new notification:', notification);
        toast[notification.severity === 'CRITICAL' ? 'error' :
              notification.severity === 'HIGH' ? 'error' :
              notification.severity === 'MEDIUM' ? 'warn' :
              'info'](notification.message, {
          ...toastConfig,
          toastId: notification.id, // Prevent duplicate toasts for the same notification
        });
      });

      socket.on('connect_error', async (err) => {
        console.log(`connect_error due to ${err.message}`);
        // Optionally try to reconnect or show an error to the user
      });
    };

    if (!socket?.connected) { // Only initialize if socket is not already connected
      socketInitializer();
    }

    // Clean up on component unmount
    return () => {
      if (socket) {
        if (session?.user?.id) {
          socket.emit('leaveRoom', `user-${session.user.id}`);
        }
        if (session?.user?.storeId) {
          socket.emit('leaveRoom', `store-${session.user.storeId}`);
        }
        socket.disconnect();
      }
    };
  }, [session, isConnected]); // Re-run effect if session changes or connection status changes

  // Konfigurasi default untuk notifikasi
  const toastConfig = {
    position: 'top-right',
    autoClose: 5000, // Increased autoClose time for better readability
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