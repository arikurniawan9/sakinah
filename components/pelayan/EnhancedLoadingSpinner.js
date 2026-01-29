// components/pelayan/EnhancedLoadingSpinner.js
import { Loader2 } from 'lucide-react';

const EnhancedLoadingSpinner = ({ message = 'Memproses...', size = 'md', variant = 'default' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const variantClasses = {
    default: 'text-purple-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    info: 'text-blue-600'
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Loader2 className={`animate-spin ${sizeClasses[size]} ${variantClasses[variant]}`} />
      {message && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {message}
        </p>
      )}
    </div>
  );
};

export default EnhancedLoadingSpinner;