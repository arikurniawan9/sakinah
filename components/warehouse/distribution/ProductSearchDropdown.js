import { Package } from 'lucide-react';

const formatNumber = (num) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num || 0);
};

const ProductSearchDropdown = ({ 
  products = [], 
  addToCart, 
  darkMode,
  searchTerm,
  loading,
  hasMore,
  loadMore,
  showResults = false
}) => {
  // Pastikan products adalah array yang valid
  const safeProducts = Array.isArray(products) ? products : [];

  return (
    <div className={`rounded-lg shadow overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="p-2 border-b flex items-center">
        <Package className={`h-4 w-4 mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
        <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {loading && safeProducts.length === 0 ? 'Memuat produk...' : `Ditemukan ${safeProducts.length} produk`}
        </h3>
      </div>
      <div className="max-h-60 overflow-y-auto styled-scrollbar">
        {safeProducts && safeProducts.length > 0 ? (
          <>
            {safeProducts.map((warehouseProduct, index) => {
              if (!warehouseProduct || !warehouseProduct.Product) return null;
              
              const product = warehouseProduct.Product;
              
              return (
                <div
                  key={warehouseProduct.id || index}
                  className={`flex items-center p-4 cursor-pointer transition-all duration-200 ease-in-out ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} hover:shadow-md transform hover:-translate-y-0.5 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}
                  onClick={() => addToCart(warehouseProduct)}
                  role="button"
                  tabIndex="0"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') addToCart(warehouseProduct);
                  }}
                  title={`Tambahkan ${product.name} ke keranjang`}
                >
                  <div className={`p-3 rounded-full mr-4 ${darkMode ? 'bg-gray-900/50' : 'bg-gray-100'}`}>
                    <Package className={`h-6 w-6 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-base font-bold truncate ${darkMode ? 'text-white' : 'text-gray-800'}`}>{product.name}</div>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Kode: {product.productCode}</div>
                  </div>
                  <div className="text-right ml-4">
                    <div className={`text-base font-bold ${darkMode ? 'text-purple-400' : 'text-purple-500'}`}>
                      {formatNumber(product.purchasePrice)}
                    </div>
                    <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Stok: <span className="font-semibold">{warehouseProduct.quantity}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {!loading && hasMore && (
              <button
                onClick={loadMore}
                className={`w-full p-3 text-center text-sm font-medium ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
              >
                Tampilkan Lebih Banyak
              </button>
            )}
          </>
        ) : (
          <>
            {loading && (
              <div className="p-4 text-center flex justify-center items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500 mr-2"></div>
                <span>Memuat...</span>
              </div>
            )}
            {!loading && safeProducts.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? 'Produk tidak ditemukan.' : 'Ketik untuk mencari produk.'}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductSearchDropdown;