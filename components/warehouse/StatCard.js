// components/warehouse/StatCard.js
const StatCard = ({ title, value, icon: Icon, darkMode, loading = false, href = null, warning = false }) => {
    const cardContent = (
      <div className={`p-6 rounded-xl shadow ${darkMode ? 'bg-gray-800' : 'bg-white'} transition-transform duration-200 hover:scale-[1.02]`}>
        <div className="flex justify-between items-center">
          <div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{title}</div>
            <div className={`text-2xl font-bold ${warning ? 'text-red-500' : darkMode ? 'text-white' : 'text-gray-900'}`}>
              {loading ? (
                <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
              ) : (
                value?.toLocaleString('id-ID') || 0
              )}
            </div>
          </div>
          <div className={`p-3 rounded-full ${warning ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </div>
    );
  
    if (href) {
      return (
        <a href={href}>
          {cardContent}
        </a>
      );
    }
  
    return cardContent;
  };

  export default StatCard;
