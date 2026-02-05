// components/Toast.js
import { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!show) return null;

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          bgColor: 'bg-green-500',
          icon: CheckCircle,
          iconColor: 'text-green-400',
          borderColor: 'border-green-500'
        };
      case 'error':
        return {
          bgColor: 'bg-red-500',
          icon: XCircle,
          iconColor: 'text-red-400',
          borderColor: 'border-red-500'
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-500',
          icon: AlertTriangle,
          iconColor: 'text-yellow-400',
          borderColor: 'border-yellow-500'
        };
      default:
        return {
          bgColor: 'bg-blue-500',
          icon: Info,
          iconColor: 'text-blue-400',
          borderColor: 'border-blue-500'
        };
    }
  };

  const { bgColor, icon: Icon, iconColor, borderColor } = getTypeConfig();

  return (
    <div className={`
      fixed top-4 right-4 z-50 max-w-sm w-full rounded-lg shadow-lg
      transform transition-all duration-300 ease-in-out
      translate-x-0 opacity-100
      ${bgColor}
    `}>
      <div className={`
        p-4 rounded-lg border-l-4
        bg-white dark:bg-gray-800
        text-gray-800 dark:text-gray-200
        ${borderColor}
      `}>
        <div className="flex items-start">
          <div className={`flex-shrink-0 pt-0.5 ${iconColor}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium">{message}</p>
          </div>
          <button
            onClick={() => {
              setShow(false);
              if (onClose) onClose();
            }}
            className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;