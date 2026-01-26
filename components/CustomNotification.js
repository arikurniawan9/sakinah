// components/CustomNotification.js
import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const CustomNotification = ({ message, type = 'info', duration = 5000, onClose }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setShow(false);
    if (onClose) onClose();
  };

  if (!show) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'error':
        return <AlertCircle className="h-5 w-5" />;
      case 'warning':
        return <Info className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getBgColor = (darkMode = false) => {
    if (darkMode) {
      switch (type) {
        case 'success':
          return 'bg-green-900/30 border-green-700';
        case 'error':
          return 'bg-red-900/30 border-red-700';
        case 'warning':
          return 'bg-yellow-900/30 border-yellow-700';
        default:
          return 'bg-blue-900/30 border-blue-700';
      }
    } else {
      switch (type) {
        case 'success':
          return 'bg-green-100 border-green-400';
        case 'error':
          return 'bg-red-100 border-red-400';
        case 'warning':
          return 'bg-yellow-100 border-yellow-400';
        default:
          return 'bg-blue-100 border-blue-400';
      }
    }
  };

  const getTextColors = (darkMode = false) => {
    if (darkMode) {
      switch (type) {
        case 'success':
          return 'text-green-300';
        case 'error':
          return 'text-red-300';
        case 'warning':
          return 'text-yellow-300';
        default:
          return 'text-blue-300';
      }
    } else {
      switch (type) {
        case 'success':
          return 'text-green-800';
        case 'error':
          return 'text-red-800';
        case 'warning':
          return 'text-yellow-800';
        default:
          return 'text-blue-800';
      }
    }
  };

  const getIconColors = (darkMode = false) => {
    if (darkMode) {
      switch (type) {
        case 'success':
          return 'text-green-400';
        case 'error':
          return 'text-red-400';
        case 'warning':
          return 'text-yellow-400';
        default:
          return 'text-blue-400';
      }
    } else {
      switch (type) {
        case 'success':
          return 'text-green-600';
        case 'error':
          return 'text-red-600';
        case 'warning':
          return 'text-yellow-600';
        default:
          return 'text-blue-600';
      }
    }
  };

  // Mendapatkan tema gelap dari konteks atau localStorage
  const isDarkMode = typeof window !== 'undefined' && 
    (localStorage.getItem('theme') === 'dark' || 
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches));

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border ${getBgColor(isDarkMode)} transition-all duration-300 transform-gpu ease-out max-w-sm`}>
      <div className="flex items-start">
        <div className={`mr-3 mt-0.5 ${getIconColors(isDarkMode)}`}>
          {getIcon()}
        </div>
        <div className={`flex-1 ${getTextColors(isDarkMode)}`}>
          {message}
        </div>
        <button 
          onClick={handleClose}
          className={`ml-2 p-1 rounded-full hover:opacity-70 focus:outline-none ${getIconColors(isDarkMode)}`}
          aria-label="Tutup notifikasi"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default CustomNotification;