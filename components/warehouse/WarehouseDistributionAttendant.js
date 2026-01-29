'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Minus, Trash2, Package, Users, ShoppingCart, User, UserPlus } from 'lucide-react';
import { useUserTheme } from '../UserThemeContext';
import WarehouseAttendantSelectionModal from './WarehouseAttendantSelectionModal';

const WarehouseDistributionAttendant = ({
  selectedStore,
  setSelectedStore,
  selectedAttendant, // This is expected to be an ID
  setSelectedAttendant, // This expects an ID
  distributionItems,
  setDistributionItems,
  availableProducts,
  stores,
  darkMode
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [attendants, setAttendants] = useState([]);
  const [isAttendantModalOpen, setIsAttendantModalOpen] = useState(false); // State for modal

  // Shortcut for opening attendant modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.altKey && event.key.toLowerCase() === 'g') {
        event.preventDefault();
        setIsAttendantModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // Only attaches global listener

  // Filter products based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredProducts(availableProducts);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredProducts(
        availableProducts.filter(product => 
          product.product?.name.toLowerCase().includes(term) ||
          product.product?.productCode.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, availableProducts]);

  // Fetch attendants when store is selected
  useEffect(() => {
    const fetchAttendants = async () => {
      if (selectedStore) {
        try {
          const response = await fetch(`/api/store-users?storeId=${selectedStore}&role=ATTENDANT`);
          if (response.ok) {
            const data = await response.json();
            setAttendants(data.users || []);
          } else {
            setAttendants([]);
          }
        } catch (error) {
          console.error('Error fetching attendants:', error);
          setAttendants([]);
        }
      } else {
        setAttendants([]);
      }
    };

    fetchAttendants();
  }, [selectedStore]);

  // Add product to distribution
  const addToDistribution = (product) => {
    if (!selectedStore) {
      alert('Silakan pilih toko tujuan terlebih dahulu');
      return;
    }

    if (product.quantity < quantity) {
      alert('Stok tidak mencukupi');
      return;
    }

    const existingItemIndex = distributionItems.findIndex(item => item.productId === (product.productId || product.id));
    
    if (existingItemIndex >= 0) {
      // Update quantity if item already exists
      const updatedItems = [...distributionItems];
      const newQuantity = updatedItems[existingItemIndex].quantity + quantity;
      
      if (product.quantity < newQuantity) {
        alert('Stok tidak mencukupi setelah ditambahkan ke item yang sudah ada');
        return;
      }
      
      updatedItems[existingItemIndex].quantity = newQuantity;
      setDistributionItems(updatedItems);
    } else {
      // Add new item
      setDistributionItems([
        ...distributionItems,
        {
          id: Date.now(), // Temporary ID
          productId: product.productId || product.id,
          productName: product.product?.name || product.name,
          quantity: quantity,
          purchasePrice: product.product?.purchasePrice || product.purchasePrice,
          currentStock: product.quantity,
        }
      ]);
    }

    setQuantity(1);
    setSearchTerm('');
  };

  // Update item quantity
  const updateItemQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) {
      removeItemFromDistribution(id);
      return;
    }

    const item = distributionItems.find(item => item.id === id);
    const product = availableProducts.find(p => p.productId === item.productId || p.id === item.productId);

    if (product && product.quantity < newQuantity) {
      alert('Stok tidak mencukupi');
      return;
    }

    setDistributionItems(
      distributionItems.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Remove item from distribution
  const removeItemFromDistribution = (id) => {
    setDistributionItems(distributionItems.filter(item => item.id !== id));
  };

  // Clear all items
  const clearDistribution = () => {
    if (confirm('Apakah Anda yakin ingin menghapus semua item?')) {
      setDistributionItems([]);
    }
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('id-ID').format(value);
  };

  // Find the selected attendant object for display
  const currentSelectedAttendant = attendants.find(att => att.id === selectedAttendant);

  return (
    <div className={`rounded-xl ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-50'} p-6 shadow-lg`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Toko Tujuan
          </label>
          <div className="relative">
            <Users className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="">Pilih Toko</option>
              {stores.map(store => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Pelayan Distribusi
            <span className={`text-xs ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>(ALT+G)</span>
          </label>
          <div className="relative">
            {currentSelectedAttendant ? (
              <div className={`flex items-center justify-between p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
                <div className="flex items-center">
                  <User className={`h-4 w-4 mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {currentSelectedAttendant.name}
                  </span>
                </div>
                <button
                  onClick={() => setIsAttendantModalOpen(true)}
                  className={`text-sm font-medium px-2 py-1 rounded-md ${darkMode ? 'bg-blue-800 hover:bg-blue-700 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-800'}`}
                >
                  Ubah
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAttendantModalOpen(true)}
                disabled={!selectedStore || attendants.length === 0}
                className={`w-full py-3 px-4 rounded-lg border text-left flex items-center ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white' + (!selectedStore || attendants.length === 0 ? ' opacity-50' : '')
                    : 'bg-white border-gray-300 text-gray-900' + (!selectedStore || attendants.length === 0 ? ' opacity-50' : '')
                }`}
              >
                <User className={`h-4 w-4 mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                Pilih Pelayan
              </button>
            )}
            {!selectedStore && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                Pilih toko dulu
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative mb-4">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <input
            type="text"
            placeholder="Cari produk..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-80 overflow-y-auto p-2">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                darkMode
                  ? 'border-gray-600 bg-gray-700/50 hover:bg-gray-600/70'
                  : 'border-white hover:bg-gray-50 shadow-sm hover:shadow-md' // Changed border-gray-200 to border-white for consistency
              }`}
              onClick={() => {
                setSelectedProduct(product);
                setQuantity(1);
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                  {product.product?.name || product.name}
                </h4>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  product.quantity > 10 
                    ? (darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800')
                    : (darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800')
                }`}>
                  Stok: {product.quantity}
                </span>
              </div>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2 truncate`}>
                {product.product?.productCode || product.productCode}
              </p>
              <div className="flex justify-between items-center">
                <p className={`text-sm font-semibold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                  {formatNumber(product.product?.purchasePrice || product.purchasePrice)}
                </p>
                <Package className={`h-4 w-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedProduct && (
        <div className={`mb-6 p-4 rounded-xl ${darkMode ? 'bg-gray-700/70' : 'bg-white'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'} shadow-md`}>
          <div className="flex justify-between items-center mb-3">
            <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {selectedProduct.product?.name || selectedProduct.name}
            </h3>
            <button
              onClick={() => setSelectedProduct(null)}
              className={`text-sm ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Batal
            </button>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center border rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className={`p-2 ${darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-500 hover:bg-gray-200'}`}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className={`px-4 py-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {quantity}
              </span>
              <button
                onClick={() => {
                  if (quantity < selectedProduct.quantity) {
                    setQuantity(quantity + 1);
                  }
                }}
                className={`p-2 ${darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-500 hover:bg-gray-200'}`}
                disabled={quantity >= selectedProduct.quantity}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            
            <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Stok Tersedia: {selectedProduct.quantity}
            </div>
            
            <button
              onClick={() => addToDistribution(selectedProduct)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white ${
                darkMode ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
              } transition-all duration-200`}
              disabled={quantity > selectedProduct.quantity}
            >
              <Plus className="h-4 w-4 mr-1" />
              Tambah ke Distribusi
            </button>
          </div>
        </div>
      )}

      <div className={`mb-6 ${darkMode ? 'bg-gray-700/50' : 'bg-white'} rounded-xl border ${darkMode ? 'border-gray-600' : 'border-gray-200'} shadow-md`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
          <div className="flex items-center">
            <ShoppingCart className={`h-5 w-5 mr-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Item Distribusi
            </h3>
            {distributionItems.length > 0 && (
              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800'
              }`}>
                {distributionItems.length} item
              </span>
            )}
          </div>
          <button
            onClick={clearDistribution}
            className={`text-sm flex items-center ${
              darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-800'
            }`}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Bersihkan
          </button>
        </div>
        
        <div className="max-h-80 overflow-y-auto">
          {distributionItems.length === 0 ? (
            <div className="p-8 text-center">
              <ShoppingCart className={`h-12 w-12 mx-auto ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
              <h4 className={`mt-2 text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Belum ada item
              </h4>
              <p className={`mt-1 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Tambahkan produk untuk memulai distribusi
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-600">
              {distributionItems.map((item) => (
                <div key={item.id} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-600/30">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <Package className={`h-4 w-4 mr-2 flex-shrink-0 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <h4 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                        {item.productName}
                      </h4>
                    </div>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                      Harga: {formatNumber(item.purchasePrice)}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-3 mx-4">
                    <button
                      onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                      className={`p-1 rounded ${darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-500 hover:bg-gray-200'}`}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className={`px-3 py-1 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                      className={`p-1 rounded ${darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-500 hover:bg-gray-200'}`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className={`text-right min-w-24 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <div className="text-sm font-medium">
                      {formatNumber(item.quantity * item.purchasePrice)}
                    </div>
                    <div className="text-xs">
                      {formatNumber(item.purchasePrice)} × {item.quantity}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => removeItemFromDistribution(item.id)}
                    className={`ml-4 p-2 rounded ${darkMode ? 'text-red-400 hover:bg-gray-600' : 'text-red-600 hover:bg-gray-200'}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {distributionItems.length > 0 && (
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gradient-to-r from-gray-700/70 to-gray-800/70' : 'bg-gradient-to-r from-blue-50 to-indigo-50'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Item:
              </span>
              <div className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {distributionItems.reduce((sum, item) => sum + item.quantity, 0)}
              </div>
            </div>
            <div className="text-right">
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Harga:
              </span>
              <div className={`text-lg font-semibold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                {formatNumber(
                  distributionItems.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0)
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Render the modal */}
      <WarehouseAttendantSelectionModal
        isOpen={isAttendantModalOpen}
        onToggle={setIsAttendantModalOpen}
        attendants={attendants} // Pass the fetched attendants
        onSelectAttendant={(attendant) => {
          setSelectedAttendant(attendant.id); // Pass only the ID back to parent state/prop
          setIsAttendantModalOpen(false); // Close modal
        }}
        selectedAttendant={selectedAttendant} // Pass the ID for highlighting if needed in modal
        darkMode={darkMode}
      />
    </div>
  );
};

export default WarehouseDistributionAttendant;