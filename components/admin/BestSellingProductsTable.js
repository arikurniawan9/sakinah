import React from 'react';
import { BarChart } from 'lucide-react';

const BestSellingProductsTable = ({ products, darkMode, loading }) => {
  const renderSkeleton = () => (
    [...Array(5)].map((_, index) => (
      <li key={index} className="flex justify-between items-center py-3 animate-pulse">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-gray-300 dark:bg-gray-700 rounded-md"></div>
          <div className="ml-3">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-32 mb-1"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
          </div>
        </div>
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-12"></div>
      </li>
    ))
  );

  return (
    <div className={`rounded-xl shadow ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
      <div className="p-6">
        <div className="flex items-center mb-4">
          <BarChart className={`h-6 w-6 mr-3 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Produk Terlaris</h3>
        </div>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {loading ? renderSkeleton() : (
            products.length > 0 ? products.map((product, index) => (
              <li key={product.id} className="flex justify-between items-center py-3">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 h-8 w-8 rounded-md flex items-center justify-center font-bold ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    {index + 1}
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{product.name}</p>
                    <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{product.productCode}</p>
                  </div>
                </div>
                <p className={`text-sm font-semibold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                  {product.quantitySold} terjual
                </p>
              </li>
            )) : (
              <li className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                Tidak ada data penjualan pada rentang ini.
              </li>
            )
          )}
        </ul>
      </div>
    </div>
  );
};

export default BestSellingProductsTable;
