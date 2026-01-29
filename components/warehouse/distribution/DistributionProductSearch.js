// components/warehouse/distribution/DistributionProductSearch.js
'use client';

import { Search, Loader, Package } from 'lucide-react';
import { memo, forwardRef, useState, useEffect, useRef } from 'react';
import ProductSearchDropdown from './ProductSearchDropdown';

const formatNumber = (num) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num || 0);
};

const DistributionProductSearchInner = forwardRef(function DistributionProductSearchInnerComponent({
  products,
  loading,
  searchTerm,
  setSearchTerm,
  addToCart,
  loadMore,
  hasMore,
  darkMode,
}, ref) {
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    // Tampilkan hasil jika ada pencarian dan produk ditemukan
    setShowResults(!!searchTerm && products.length > 0);
  }, [searchTerm, products]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (products && products.length === 1) {
        addToCart(products[0]);
        setSearchTerm('');
      } else if (searchTerm) {
        const exactMatch = products.find(p => p.Product && p.Product.productCode.toLowerCase() === searchTerm.toLowerCase());
        if (exactMatch) {
          addToCart(exactMatch);
          setSearchTerm('');
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className={`rounded-lg shadow p-4 mb-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="relative">
          <input
            ref={ref}
            type="text"
            placeholder="Cari produk di gudang..."
            className={`w-full pl-10 pr-16 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
            }`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            aria-label="Cari produk gudang"
          />
          <div className="absolute left-3 top-2.5">
            <Search className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          </div>
          <div className="absolute right-3 top-2.5 flex space-x-2">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openBarcodeScanner'))}
              className={`p-1 rounded ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'}`}
              title="Pindai Barcode"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v4a2 2 0 0 0 2 2h4" />
                <path d="M21 3v4a2 2 0 0 1-2 2h-4" />
                <path d="M3 21v-4a2 2 0 0 1 2-2h4" />
                <path d="M21 21v-4a2 2 0 0 0-2-2h-4" />
                <path d="M9 3h6" />
                <path d="M9 21h6" />
                <path d="M3 9v6" />
                <path d="M21 9v6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Results Container - Positioned below search bar */}
      {searchTerm && (
        <div className="relative" ref={containerRef}>
          <ProductSearchDropdown
            products={products}
            addToCart={addToCart}
            darkMode={darkMode}
            searchTerm={searchTerm}
            loading={loading}
            hasMore={hasMore}
            loadMore={loadMore}
            showResults={showResults}
          />
        </div>
      )}

      {/* Placeholder when no search term */}
      {!searchTerm && (
        <div className={`rounded-lg shadow overflow-hidden flex flex-col items-center justify-center p-6 sm:p-8 text-center ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'}`}>
          <div className={`mb-4 p-3 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <Search className={`h-8 w-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>Cari Produk</h3>
          <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            Ketik nama atau kode produk untuk memulai pencarian.
          </p>
        </div>
      )}
    </div>
  );
});

const DistributionProductSearch = memo(DistributionProductSearchInner);

DistributionProductSearch.displayName = 'DistributionProductSearch';

export default DistributionProductSearch;
