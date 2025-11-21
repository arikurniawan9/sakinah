// components/kategori/CategoryProductsModal.js
'use client';

import { useState, useEffect } from 'react';
import { X, Search, Package } from 'lucide-react';

const CategoryProductsModal = ({ 
  isOpen, 
  onClose, 
  category, 
  darkMode,
  products = [] // Daftar produk yang akan difilter berdasarkan kategori
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Filter produk berdasarkan kategori dan term pencarian
  useEffect(() => {
    if (category && products && products.length > 0) {
      let result = products.filter(product => 
        product.categoryId === category.id
      );

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        result = result.filter(product => 
          product.name.toLowerCase().includes(term) ||
          product.productCode.toLowerCase().includes(term)
        );
      }

      setFilteredProducts(result);
    } else {
      setFilteredProducts([]);
    }
  }, [category, products, searchTerm]);

  if (!isOpen || !category) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleOverlayClick}
    >
      <div className={`relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-xl shadow-lg transform transition-all ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}`}>
          <div>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Produk dalam Kategori: {category.name}
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {filteredProducts.length} dari {products.filter(p => p.categoryId === category.id).length} produk
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'} transition-colors`}
            aria-label="Tutup modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari produk dalam kategori ini..."
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-cyan-500 focus:border-cyan-500' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-cyan-500 focus:border-cyan-500'
              } focus:outline-none focus:ring-2 transition-colors`}
            />
          </div>
        </div>

        {/* Products List */}
        <div className={`overflow-y-auto max-h-[calc(90vh-160px)] ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className={`h-12 w-12 ${darkMode ? 'text-gray-500' : 'text-gray-300'}`} />
              <h3 className={`mt-4 text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                {searchTerm ? 'Tidak ada produk ditemukan' : 'Tidak ada produk dalam kategori ini'}
              </h3>
              <p className={`mt-1 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                {searchTerm 
                  ? 'Coba kata kunci lain' 
                  : 'Kategori ini belum memiliki produk'}
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ 
              divideColor: darkMode ? '#374151' : '#e5e7eb' 
            }}>
              {filteredProducts.map((product) => (
                <div 
                  key={product.id} 
                  className={`p-4 hover:${darkMode ? 'bg-gray-750' : 'bg-gray-50'} transition-colors`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-cyan-50'}`}>
                      <Package className={`h-6 w-6 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {product.name}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Kode: {product.productCode}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0
                        }).format(product.priceTiers?.[0]?.price || 0)}
                      </p>
                      <p className={`text-xs ${product.stock > 10 ? (darkMode ? 'text-green-400' : 'text-green-600') : product.stock > 0 ? (darkMode ? 'text-yellow-400' : 'text-yellow-600') : (darkMode ? 'text-red-400' : 'text-red-600')}`}>
                        Stok: {product.stock}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryProductsModal;