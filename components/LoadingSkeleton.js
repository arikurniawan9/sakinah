// components/LoadingSkeleton.js
const LoadingSkeleton = ({ 
  type = 'default', 
  className = '',
  width = '100%',
  height = '20px',
  borderRadius = '4px'
}) => {
  const baseClasses = "animate-pulse";
  const skeletonClasses = `${baseClasses} ${className}`;
  
  const style = {
    width,
    height,
    borderRadius,
    backgroundColor: 'currentColor',
    opacity: 0.1
  };

  switch (type) {
    case 'card':
      return (
        <div className={`${skeletonClasses} bg-gray-200 dark:bg-gray-700 rounded-xl p-6`}>
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-gray-300 dark:bg-gray-600 h-12 w-12"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      );
    
    case 'text':
      return (
        <div 
          className={`${skeletonClasses} bg-gray-200 dark:bg-gray-700`}
          style={style}
        />
      );
    
    case 'avatar':
      return (
        <div className={`${skeletonClasses} rounded-full bg-gray-200 dark:bg-gray-700 h-10 w-10`} />
      );
    
    case 'button':
      return (
        <div className={`${skeletonClasses} bg-gray-200 dark:bg-gray-700 rounded-md h-10 w-full`} />
      );
    
    case 'table-row':
      return (
        <tr className="border-b border-gray-200 dark:border-gray-700">
          <td className="py-4 px-6">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          </td>
          <td className="py-4 px-6">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </td>
          <td className="py-4 px-6">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </td>
        </tr>
      );
    
    case 'chart':
      return (
        <div className={`${skeletonClasses} bg-gray-200 dark:bg-gray-700 rounded-lg h-80 w-full`} />
      );
    
    default:
      return (
        <div 
          className={`${skeletonClasses} bg-gray-200 dark:bg-gray-700 rounded`}
          style={style}
        />
      );
  }
};

export default LoadingSkeleton;