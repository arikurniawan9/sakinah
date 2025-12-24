// components/warehouse/distribution/DistributionCart.js
'use client';

import { Trash2, ShoppingCart, Package } from 'lucide-react';
import { memo } from 'react';
import { getTerbilangText } from '../../../lib/utils/terbilang';

const formatNumber = (num) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num || 0);
};

const DistributionCartItem = memo(({ item, updateQuantity, removeFromCart, darkMode }) => {
  return (
    <li className={`p-3 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
      <div className="flex items-center">
        <div className="flex-1 min-w-0">
          <p className={`font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-800'}`}>{item.name}</p>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {item.quantity} x {formatNumber(item.purchasePrice)}
          </p>
        </div>
        <div className="text-right ml-4">
          <p className={`font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>{formatNumber(item.quantity * item.purchasePrice)}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center space-x-2">
          <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className={`w-7 h-7 flex items-center justify-center rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`} aria-label="Kurangi jumlah">-</button>
          <span className="text-sm font-bold w-8 text-center">{item.quantity}</span>
          <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} disabled={item.quantity >= item.stock} className={`w-7 h-7 flex items-center justify-center rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`} aria-label="Tambah jumlah">+</button>
          <button
            onClick={() => removeFromCart(item.productId)}
            className={`ml-2 text-red-500 hover:text-red-700 p-1 rounded-full ${darkMode ? 'hover:bg-red-900/20' : 'hover:bg-red-100'}`}
            aria-label="Hapus item"
          >
            <Trash2 size={16} />
          </button>
        </div>
        <div className={`text-xs mt-1 ${item.quantity > item.stock ? (darkMode ? 'text-red-400' : 'text-red-600') : (darkMode ? 'text-gray-500' : 'text-gray-500')}`}>
          Stok: {item.stock}
        </div>
      </div>
    </li>
  );
});

DistributionCartItem.displayName = 'DistributionCartItem';

const DistributionCart = ({ items, updateQuantity, removeFromCart, cartTotal, darkMode }) => {
  return (
    <div className={`h-full flex flex-col rounded-lg shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className={`flex items-center px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <ShoppingCart className={`h-6 w-6 mr-3 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
        <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Keranjang Distribusi</h2>
      </div>
      <div className="flex-1 p-2 overflow-y-auto styled-scrollbar">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Package size={48} className="text-gray-400 dark:text-gray-600 mb-4" />
            <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Keranjang Kosong</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Pilih produk untuk ditambahkan.</p>
          </div>
        ) : (
          <ul className={`divide-y ${darkMode ? 'divide-gray-700/50' : 'divide-gray-200'}`}>
            {items.map((item) => (
              <DistributionCartItem
                key={item.productId}
                item={item}
                updateQuantity={updateQuantity}
                removeFromCart={removeFromCart}
                darkMode={darkMode}
              />
            ))}
          </ul>
        )}
      </div>
      <div className={`p-4 mt-auto border-t ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex justify-between items-center mb-2">
          <span className={`text-base font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total</span>
          <span className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
            {formatNumber(cartTotal)}
          </span>
        </div>
        <p className={`text-sm text-right italic ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {getTerbilangText(cartTotal)}
        </p>
      </div>
    </div>
  );
};

export default memo(DistributionCart);