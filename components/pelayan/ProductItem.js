// components/pelayan/ProductItem.js
import { memo } from 'react';
import { Star, ShoppingCart } from 'lucide-react';

// Komponen untuk satu produk - menggunakan memo untuk mencegah rendering ulang yang tidak perlu
const ProductItem = ({ product, isOutOfStock, addToCart, addQuickProduct, removeQuickProduct, quickProducts, darkMode }) => {
  const productName = product.name || 'Produk tidak dikenal';
  const productCode = product.productCode || 'Tidak ada kode';
  const productSellingPrice = product.sellingPrice || 0;
  const productStock = product.stock || 0;

  const handleQuickToggle = (e) => {
    e.stopPropagation(); // Mencegah klik ke parent (menambahkan ke keranjang)
    const exists = quickProducts.some(p => p.id === product.id);
    if (exists) {
      removeQuickProduct(product.id);
    } else {
      addQuickProduct(product);
    }
  };

  const handleAddToCart = (e) => {
    e.stopPropagation(); // Mencegah event propagasi ke parent
    addToCart(product);
  };

  const isQuick = quickProducts.some(p => p.id === product.id);

  return (
    <div
      className={`flex items-center space-x-4 p-4 rounded-xl border transition-all duration-200 ${
        isOutOfStock
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:shadow-md cursor-pointer hover:scale-[1.02]'
      } ${
        darkMode
          ? 'bg-gray-800 border-gray-700 hover:bg-gray-750'
          : 'bg-white border-gray-200 hover:bg-gray-50'
      }`}
      onClick={() => !isOutOfStock && addToCart(product)}
    >
      <div className="flex-shrink-0 relative">
        <div className="h-14 w-14 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg flex items-center justify-center">
          <svg className="h-7 w-7 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        {isOutOfStock && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
            X
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-900 dark:text-white truncate">{productName}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Kode: {productCode}</div>
        <div className="flex items-center mt-1 space-x-2">
          <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full">
            Stok: {productStock}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <div className="font-bold text-lg text-purple-600 dark:text-purple-400">
          Rp {productSellingPrice.toLocaleString('id-ID')}
        </div>
        <div className="flex space-x-2 mt-2">
          <button
            className={`p-2 rounded-full ${
              isQuick
                ? (darkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-500')
                : (darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500')
            } transition-colors`}
            onClick={handleQuickToggle}
            title={isQuick ? "Hapus dari produk cepat" : "Tambah ke produk cepat"}
          >
            {isQuick ? (
              <Star className="h-5 w-5" fill="currentColor" />
            ) : (
              <Star className="h-5 w-5" />
            )}
          </button>
          <button
            className={`p-2 rounded-full ${
              darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
            } transition-colors`}
            onClick={handleAddToCart}
            title="Tambah langsung ke keranjang"
          >
            <ShoppingCart className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(ProductItem);