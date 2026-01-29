// components/pelayan/EnhancedErrorDisplay.js
import { AlertCircle, RotateCcw } from 'lucide-react';

const EnhancedErrorDisplay = ({ 
  error, 
  onRetry, 
  title = 'Terjadi Kesalahan', 
  message = 'Terjadi kesalahan saat memuat data. Silakan coba lagi.',
  showRetry = true
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
            <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
          {title}
        </h3>
        <p className="text-red-700 dark:text-red-300 mb-4">
          {error || message}
        </p>
        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Coba Lagi
          </button>
        )}
      </div>
    </div>
  );
};

export default EnhancedErrorDisplay;