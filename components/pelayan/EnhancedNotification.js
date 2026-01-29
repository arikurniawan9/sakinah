// components/pelayan/EnhancedNotification.js
import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

const EnhancedNotification = ({ notifications, removeNotification }) => {
  const [visibleNotifications, setVisibleNotifications] = useState([]);

  useEffect(() => {
    // Tambahkan notifikasi baru ke tampilan
    notifications.forEach(notification => {
      if (!visibleNotifications.some(n => n.id === notification.id)) {
        setVisibleNotifications(prev => [...prev, notification]);
        
        // Atur timer untuk menghapus notifikasi
        setTimeout(() => {
          removeNotification(notification.id);
          setVisibleNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, notification.duration || 5000);
      }
    });
  }, [notifications, visibleNotifications, removeNotification]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-200';
      case 'error':
        return 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200';
      case 'warning':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-200';
      case 'info':
        return 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-200';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-900/30 dark:border-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 w-80">
      {visibleNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`flex items-start p-4 rounded-lg border shadow-lg transform transition-all duration-300 ${getNotificationColor(notification.type)}`}
        >
          <div className="flex-shrink-0">
            {getNotificationIcon(notification.type)}
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium">{notification.title || notification.message}</p>
            {notification.description && (
              <p className="mt-1 text-xs opacity-90">{notification.description}</p>
            )}
          </div>
          <button
            onClick={() => {
              removeNotification(notification.id);
              setVisibleNotifications(prev => prev.filter(n => n.id !== notification.id));
            }}
            className="ml-4 flex-shrink-0 text-current hover:opacity-75"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default EnhancedNotification;