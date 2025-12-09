'use client';

import { useState, useEffect, useRef } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useUserTheme } from '../../../components/UserThemeContext';
import { useSession } from 'next-auth/react';
import Breadcrumb from '../../../components/Breadcrumb';
import { Package, Search, Plus, X, ShoppingCart, Calendar, User, Store, AlertTriangle, CheckCircle, Printer, Eye } from 'lucide-react';
import DistributionReceiptModal from '../../../components/warehouse/DistributionReceiptModal';

export default function WarehouseDistributionPage() {
  const { data: session } = useSession();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [distributionDate, setDistributionDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [quantityInput, setQuantityInput] = useState(1);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedDistribution, setSelectedDistribution] = useState(null);

  // Fetch stores and products when component mounts
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      const [storesRes, productsRes] = await Promise.all([
        fetch('/api/warehouse/stores'),
        fetch('/api/warehouse/stock') // Get products with stock
      ]);
      
      const storesData = await storesRes.json();
      const productsData = await productsRes.json();
      
      setStores(storesData.stores || []);
      setProducts(productsData.warehouseProducts || []);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      showNotification('Gagal memuat data awal', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000); // Hide notification after 3 seconds
  };

  const addToCart = (warehouseProduct) => {
    if (!selectedStore) {
      showNotification('Pilih toko tujuan terlebih dahulu', 'error');
      return;
    }
    
    if (quantityInput <= 0) {
      showNotification('Jumlah harus lebih dari 0', 'error');
      return;
    }
    
    if (quantityInput > warehouseProduct.quantity) {
      showNotification(`Stok tidak mencukupi. Tersedia: ${warehouseProduct.quantity}`, 'error');
      return;
    }
    
    const existingItem = cart.find(item => item.id === warehouseProduct.id);
    
    if (existingItem) {
      // Check if the new total quantity exceeds available stock
      const newTotalQuantity = existingItem.quantity + quantityInput;
      if (newTotalQuantity > warehouseProduct.quantity) {
        showNotification(`Stok tidak mencukupi. Tersedia: ${warehouseProduct.quantity}, dalam keranjang: ${existingItem.quantity}`, 'error');
        return;
      }
      
      setCart(prevCart => 
        prevCart.map(item => 
          item.id === warehouseProduct.id 
            ? { ...item, quantity: item.quantity + quantityInput } 
            : item
        )
      );
    } else {
      if (quantityInput > warehouseProduct.quantity) {
        showNotification(`Stok tidak mencukupi. Tersedia: ${warehouseProduct.quantity}`, 'error');
        return;
      }
      
      setCart(prevCart => [
        ...prevCart,
        {
          id: warehouseProduct.id,
          productId: warehouseProduct.productId,
          productName: warehouseProduct.product.name,
          productCode: warehouseProduct.product.productCode,
          category: warehouseProduct.product.category.name,
          purchasePrice: warehouseProduct.product.purchasePrice,
          quantity: quantityInput,
          availableStock: warehouseProduct.quantity
        }
      ]);
    }
    
    showNotification(`${warehouseProduct.product.name} ditambahkan ke keranjang`, 'success');
    setQuantityInput(1);
  };

  const removeFromCart = (id) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const updateCartQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    const item = cart.find(item => item.id === id);
    if (newQuantity > item.availableStock) {
      showNotification(`Jumlah melebihi stok yang tersedia: ${item.availableStock}`, 'error');
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const calculateTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.purchasePrice * item.quantity), 0);
  };

  const handleSave = async () => {
    if (!selectedStore) {
      showNotification('Pilih toko tujuan terlebih dahulu', 'error');
      return;
    }

    if (cart.length === 0) {
      showNotification('Keranjang distribusi kosong', 'error');
      return;
    }

    setLoading(true);
    try {
      const store = stores.find(s => s.id === selectedStore);
      const response = await fetch('/api/warehouse/distribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: selectedStore,
          distributionDate,
          items: cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            purchasePrice: item.purchasePrice // Include purchase price for proper total calculation
          })),
          distributedBy: session.user.id,
          notes,
          status: 'PENDING_ACCEPTANCE' // Use the new status we implemented
        })
      });

      const result = await response.json();

      if (response.ok) {
        showNotification('Distribusi berhasil dibuat dan menunggu konfirmasi toko', 'success');

        // For the receipt modal, we need to reconstruct what the API would return
        // which includes all items in the distribution batch
        const distributionForReceipt = {
          ...result.distribution, // This would be one of the records from the API
          items: cart.map(item => ({
            ...item,
            totalAmount: item.purchasePrice * item.quantity,
            unitPrice: item.purchasePrice,
            quantity: item.quantity
          })),
          store: {
            name: store?.name || 'Toko Tujuan',
            code: store?.code || 'N/A'
          },
          warehouse: {
            name: 'Gudang Pusat'
          },
          distributedByUser: {
            name: session.user.name || session.user.username || 'User'
          },
          distributedAt: distributionDate, // Ensure the date is properly set
          status: 'PENDING_ACCEPTANCE'
        };

        // Set the distribution data and show receipt modal
        setSelectedDistribution(distributionForReceipt);

        // Reset form
        setCart([]);
        setSelectedStore('');
        setNotes('');
        setQuantityInput(1);
        // Refresh data
        fetchInitialData();

        // Show receipt modal after a short delay to allow data to update
        setTimeout(() => {
          setShowReceiptModal(true);
        }, 500);
      } else {
        throw new Error(result.error || 'Gagal membuat distribusi');
      }
    } catch (error) {
      console.error('Error creating distribution:', error);
      showNotification(`Gagal: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter products based on search term
  const filteredProducts = products.filter(wp => 
    wp.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wp.product.productCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute requiredRole="WAREHOUSE">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb
          items={[
            { title: 'Dashboard Gudang', href: '/warehouse' },
            { title: 'Distribusi ke Toko', href: '/warehouse/distribution' }
          ]}
          darkMode={darkMode}
        />

        <div className="mb-6">
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Distribusi Barang ke Toko
          </h1>
          <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Distribusikan produk dari gudang pusat ke toko-toko
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Selection Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Store Selection and Distribution Info */}
            <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className={`text-lg font-semibold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <Store className="mr-2 h-5 w-5" />
                Informasi Distribusi
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Toko Tujuan *
                  </label>
                  <select
                    value={selectedStore}
                    onChange={(e) => setSelectedStore(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Pilih Toko</option>
                    {stores.map(store => (
                      <option key={store.id} value={store.id}>
                        {store.name} ({store.code || store.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Tanggal Distribusi *
                  </label>
                  <input
                    type="date"
                    value={distributionDate}
                    onChange={(e) => setDistributionDate(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Catatan (Opsional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tambahkan catatan untuk distribusi ini..."
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  rows="2"
                />
              </div>
            </div>

            {/* Product Search and Selection */}
            <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className={`text-lg font-semibold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <Package className="mr-2 h-5 w-5" />
                Pilih Produk
              </h2>

              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Cari produk berdasarkan nama atau kode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Search className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
              </div>

              {/* Quantity Input for Adding to Cart */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Jumlah Produk
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(Math.max(1, parseInt(e.target.value) || 1))}
                  className={`w-32 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              {/* Product List */}
              <div className="max-h-80 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                    {searchTerm ? 'Produk tidak ditemukan' : 'Tidak ada produk dalam gudang'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredProducts.map((warehouseProduct) => (
                      <div
                        key={warehouseProduct.id}
                        className={`p-3 rounded-lg border ${
                          darkMode ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{warehouseProduct.product.name}</div>
                            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {warehouseProduct.product.productCode} • {warehouseProduct.product.category.name}
                            </div>
                            <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Stok Tersedia: {warehouseProduct.quantity}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">
                              Rp {(warehouseProduct.product.purchasePrice || 0).toLocaleString('id-ID')}
                            </div>
                            <button
                              onClick={() => addToCart(warehouseProduct)}
                              className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
                            >
                              Tambah ke Keranjang
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cart Panel */}
          <div className="space-y-6">
            {/* Cart Summary */}
            <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className={`text-lg font-semibold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <ShoppingCart className="mr-2 h-5 w-5" />
                Keranjang Distribusi
              </h2>

              {cart.length === 0 ? (
                <div className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                  Keranjang kosong
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg border ${
                        darkMode ? 'border-gray-700 bg-gray-700/30' : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{item.productName}</div>
                          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {item.productCode}
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center">
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                            className="p-1 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                          >
                            -
                          </button>
                          <span className="mx-2">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                            className="p-1 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                          >
                            +
                          </button>
                        </div>
                        <div className="font-semibold">
                          Rp {(item.purchasePrice * item.quantity).toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Cart Summary */}
              {cart.length > 0 && (
                <div className={`mt-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Total Item:</span>
                    <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Harga:</span>
                    <span className="font-semibold">Rp {calculateTotalAmount().toLocaleString('id-ID')}</span>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={loading || cart.length === 0 || !selectedStore}
                className={`mt-4 w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium ${
                  loading || cart.length === 0 || !selectedStore
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Memproses...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Buat Distribusi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Notification */}
        {notification.show && (
          <div
            className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center ${
              notification.type === 'error' 
                ? 'bg-red-500/10 text-red-400' 
                : notification.type === 'success'
                  ? 'bg-green-500/10 text-green-400'
                  : 'bg-blue-500/10 text-blue-400'
            }`}
          >
            <div className="mr-3">
              {notification.type === 'error' ? (
                <X className="h-5 w-5" />
              ) : notification.type === 'success' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>
            <span>{notification.message}</span>
          </div>
        )}
      </main>

      {/* Distribution Receipt Modal */}
      {showReceiptModal && selectedDistribution && (
        <DistributionReceiptModal
          distributionData={selectedDistribution}
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
        />
      )}
    </ProtectedRoute>
  );
}