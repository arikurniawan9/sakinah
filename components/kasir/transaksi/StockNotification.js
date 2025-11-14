// components/kasir/transaksi/StockNotification.js
'use client';

import { AlertTriangle, X } from 'lucide-react';
import { memo } from 'react';

const StockNotification = memo(({ items, onClose, darkMode }) => {
  // Filter produk dengan stok rendah (kurang dari 5)
  const lowStockItems = items.filter(item => item.stock < 5);

  if (lowStockItems.length === 0) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-[60] p-4 rounded-lg shadow-lg max-w-sm w-full ${
      darkMode ? 'bg-yellow-900/90 border border-yellow-700' : 'bg-yellow-100 border border-yellow-300'
    }`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className={`h-5 w-5 ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`} />
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
            Peringatan Stok Rendah
          </h3>
          <div className={`mt-1 text-sm ${darkMode ? 'text-yellow-100' : 'text-yellow-700'}`}>
            <ul className="list-disc pl-5 space-y-1">
              {lowStockItems.map(item => (
                <li key={item.productId}>
                  <span className="font-semibold">{item.name}</span>: {item.stock} buah tersisa
                </li>
              ))}
            </ul>
          </div>
        </div>
        <button
          onClick={onClose}
          className={`ml-4 flex-shrink-0 ${darkMode ? 'text-yellow-200 hover:text-white' : 'text-yellow-700 hover:text-gray-900'}`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
});

export default StockNotification;