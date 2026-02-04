// components/StatCard.js
import { useUserTheme } from './UserThemeContext';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon, trend, color = 'blue', isLoading = false }) => {
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  
  const colorClasses = {
    blue: {
      bg: darkMode ? 'bg-blue-900/30' : 'bg-blue-50',
      text: darkMode ? 'text-blue-400' : 'text-blue-600',
      border: darkMode ? 'border-blue-800' : 'border-blue-200',
      iconBg: darkMode ? 'bg-blue-900/20' : 'bg-blue-100',
      valueText: darkMode ? 'text-blue-300' : 'text-blue-700'
    },
    green: {
      bg: darkMode ? 'bg-green-900/30' : 'bg-green-50',
      text: darkMode ? 'text-green-400' : 'text-green-600',
      border: darkMode ? 'border-green-800' : 'border-green-200',
      iconBg: darkMode ? 'bg-green-900/20' : 'bg-green-100',
      valueText: darkMode ? 'text-green-300' : 'text-green-700'
    },
    purple: {
      bg: darkMode ? 'bg-purple-900/30' : 'bg-purple-50',
      text: darkMode ? 'text-purple-400' : 'text-purple-600',
      border: darkMode ? 'border-purple-800' : 'border-purple-200',
      iconBg: darkMode ? 'bg-purple-900/20' : 'bg-purple-100',
      valueText: darkMode ? 'text-purple-300' : 'text-purple-700'
    },
    yellow: {
      bg: darkMode ? 'bg-yellow-900/30' : 'bg-yellow-50',
      text: darkMode ? 'text-yellow-400' : 'text-yellow-600',
      border: darkMode ? 'border-yellow-800' : 'border-yellow-200',
      iconBg: darkMode ? 'bg-yellow-900/20' : 'bg-yellow-100',
      valueText: darkMode ? 'text-yellow-300' : 'text-yellow-700'
    },
    red: {
      bg: darkMode ? 'bg-red-900/30' : 'bg-red-50',
      text: darkMode ? 'text-red-400' : 'text-red-600',
      border: darkMode ? 'border-red-800' : 'border-red-200',
      iconBg: darkMode ? 'bg-red-900/20' : 'bg-red-100',
      valueText: darkMode ? 'text-red-300' : 'text-red-700'
    },
  };

  const currentColor = colorClasses[color];

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl p-6 shadow-lg ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        } border ${currentColor.border}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className={`h-4 w-24 rounded bg-gray-300 dark:bg-gray-600 mb-2 shimmer`} />
            <div className={`h-6 w-16 rounded bg-gray-300 dark:bg-gray-600 shimmer`} />
          </div>
          <div className={`p-3 rounded-lg ${currentColor.iconBg} shimmer`}>
            <div className="h-6 w-6" />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className={`rounded-xl p-6 shadow-lg transition-all duration-300 hover:shadow-xl ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      } border ${currentColor.border}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{title}</p>
          <p className={`text-2xl font-bold mt-1 ${currentColor.valueText}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${currentColor.iconBg}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {trend && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`mt-4 flex items-center text-sm ${
            trend.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}
        >
          {trend.startsWith('+') ? (
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
          <span>{trend}</span>
        </motion.div>
      )}
    </motion.div>
  );
};

export default StatCard;