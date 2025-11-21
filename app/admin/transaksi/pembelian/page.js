// app/admin/transaksi/pembelian/page.js
'use client';

import { useState, useEffect, useRef } from 'react';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import { useUserTheme } from '../../../../components/UserThemeContext';
import { useSession } from 'next-auth/react';
import { X, Plus, Search, Package, ShoppingCart, CreditCard, Save, CheckCircle, Barcode, Camera } from 'lucide-react';

export default function PurchaseTransaction() {
  const { data: session } = useSession();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [isProductListLoading, setIsProductListLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanTimeout, setScanTimeout] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const barcodeInputRef = useRef(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [suppliersRes] = await Promise.all([
          fetch('/api/supplier'),
        ]);
        const suppliersData = await suppliersRes.json();
        setSuppliers(suppliersData.suppliers || []);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    fetchInitialData();
  }, []);

  // Handle barcode scanning input
  useEffect(() => {
    const handleBarcodeInput = (e) => {
      if (e.target.tagName === 'INPUT') return;

      const char = e.key;
      if (char.length === 1) { // Only single character keys
        setBarcodeInput(prev => {
          const newInput = prev + char;

          // Clear any existing timeout
          if (scanTimeout) {
            clearTimeout(scanTimeout);
          }

          // Set new timeout to process the input after a delay
          const timeout = setTimeout(() => {
            // When timeout occurs, treat it as a complete barcode
            processBarcode(newInput);
            setBarcodeInput('');
          }, 300); // 300ms delay to distinguish scan from keyboard typing

          setScanTimeout(timeout);
          return newInput;
        });
      }
    };

    document.addEventListener('keydown', handleBarcodeInput);
    return () => {
      document.removeEventListener('keydown', handleBarcodeInput);
      if (scanTimeout) {
        clearTimeout(scanTimeout);
      }
    };
  }, [scanTimeout]);

  const processBarcode = async (barcode) => {
    if (!barcode || barcode.length < 3) return; // Minimum barcode length

    try {
      setLoading(true);
      // Search for product by exact product code match
      const response = await fetch(`/api/produk?productCode=${encodeURIComponent(barcode)}`);
      const data = await response.json();

      if (data.products && data.products.length > 0) {
        const product = data.products[0]; // Take first match
        addToCart(product);
        // Clear the search term to keep the interface clean
        setSearchTerm('');
      } else {
        // If no product found by exact code match, try search term
        const searchResponse = await fetch(`/api/produk?search=${encodeURIComponent(barcode)}`);
        const searchData = await searchResponse.json();

        if (searchData.products && searchData.products.length > 0) {
          const product = searchData.products[0]; // Take first match
          addToCart(product);
          setSearchTerm('');
        } else {
          // If still no product found, optionally show notification
          console.log(`Product with barcode ${barcode} not found`);
          // Could optionally set an error state or show notification here
        }
      }
    } catch (error) {
      console.error('Error processing barcode:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (searchTerm.trim().length === 0) {
        setProducts([]);
        return;
      }
      setIsProductListLoading(true);
      try {
        // Build query parameters
        const params = new URLSearchParams({
          search: searchTerm,
          limit: 20
        });

        // If supplier is selected, filter products by supplier
        if (selectedSupplier) {
          params.set('supplierId', selectedSupplier);
        }

        // Search for products by name or product code
        const response = await fetch(`/api/produk?${params.toString()}`);
        const data = await response.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsProductListLoading(false);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, selectedSupplier]);

  const addToCart = (product) => {
    // Check if supplier is selected or if product's supplier matches selected supplier
    if (selectedSupplier && selectedSupplier !== product.supplierId) {
      // Show warning notification about supplier mismatch
      showNotification(
        `Produk "${product.name}" dari supplier berbeda (${product.supplier?.name || 'Tidak diketahui'}). Pastikan ini benar.`,
        'warning'
      );
    }

    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1);
      showNotification(`${product.name} jumlahnya diperbarui menjadi ${existingItem.quantity + 1}`, 'info');
    } else {
      // Auto-select supplier if not set
      if (!selectedSupplier) {
        setSelectedSupplier(product.supplierId);
      }

      const newItem = {
        id: product.id,
        name: product.name,
        productCode: product.productCode,
        quantity: 1,
        price: product.purchasePrice || 0,
        stock: product.stock,
        supplierId: product.supplierId, // Store the supplier from product for reference
        supplierName: product.supplier?.name // Also store supplier name for display
      };
      setCart(prevCart => [...prevCart, newItem]);

      // Show notification with supplier information
      if (selectedSupplier === product.supplierId) {
        showNotification(`${product.name} ditambahkan ke keranjang`, 'success');
      } else {
        showNotification(
          `${product.name} ditambahkan dari supplier berbeda (${product.supplier?.name || 'Tidak diketahui'})`,
          'warning'
        );
      }
    }
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000); // Hide notification after 3 seconds
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart => 
      prevCart.map(item => 
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const updatePrice = (productId, newPrice) => {
    setCart(prevCart => 
      prevCart.map(item => 
        item.id === productId ? { ...item, price: parseFloat(newPrice) || 0 } : item
      )
    );
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal();
  };

  const handleSave = async () => {
    if (cart.length === 0) {
      alert('Keranjang pembelian kosong!');
      return;
    }
    if (!selectedSupplier) {
      alert('Silakan pilih supplier terlebih dahulu!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: selectedSupplier,
          purchaseDate,
          items: cart.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price
          })),
          totalAmount: calculateTotal(),
          createdBy: session.user.id
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert('Pembelian berhasil disimpan!');
        setCart([]);
        setSelectedSupplier('');
        setSearchTerm('');
        setProducts([]);
      } else {
        alert(`Gagal: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving purchase:', error);
      alert('Terjadi kesalahan saat menyimpan pembelian');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50'}`}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Transaksi Pembelian
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Product Search Panel */}
            <div className="space-y-6">
              <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h2 className={`text-lg font-semibold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Search className="mr-2 h-5 w-5" />
                  Cari Produk
                </h2>
                
                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Cari produk berdasarkan nama atau kode..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' && searchTerm.trim() !== '') {
                        // Prevent default form submission
                        e.preventDefault();

                        // Search for exact product match by product code
                        try {
                          setLoading(true);
                          const response = await fetch(`/api/produk?search=${encodeURIComponent(searchTerm.trim())}`);
                          const data = await response.json();

                          if (data.products && data.products.length > 0) {
                            // Look for exact product code match first
                            const exactMatch = data.products.find(p =>
                              p.productCode.toLowerCase() === searchTerm.trim().toLowerCase()
                            );

                            const productToUse = exactMatch || data.products[0]; // Use exact match or first result

                            // Add to cart
                            addToCart(productToUse);

                            // Clear search term
                            setSearchTerm('');
                          } else {
                            console.log(`Product with code ${searchTerm} not found`);
                          }
                        } catch (error) {
                          console.error('Error searching for product:', error);
                        } finally {
                          setLoading(false);
                        }
                      }
                    }}
                    className={`w-full px-4 py-2 pr-24 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex">
                    <button
                      type="button"
                      onClick={() => setIsScanning(!isScanning)}
                      className={`p-2 rounded-l-lg ${isScanning ? 'bg-red-500 text-white' : darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'} hover:opacity-80`}
                      title={isScanning ? 'Berhenti scan' : 'Scan barcode'}
                    >
                      <Camera className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (searchTerm.trim() !== '') {
                          // Search for exact product match by product code
                          try {
                            setLoading(true);
                            const response = await fetch(`/api/produk?search=${encodeURIComponent(searchTerm.trim())}`);
                            const data = await response.json();

                            if (data.products && data.products.length > 0) {
                              // Look for exact product code match first
                              const exactMatch = data.products.find(p =>
                                p.productCode.toLowerCase() === searchTerm.trim().toLowerCase()
                              );

                              const productToUse = exactMatch || data.products[0]; // Use exact match or first result

                              // Add to cart
                              addToCart(productToUse);

                              // Clear search term
                              setSearchTerm('');
                            } else {
                              console.log(`Product with code ${searchTerm} not found`);
                            }
                          } catch (error) {
                            console.error('Error searching for product:', error);
                          } finally {
                            setLoading(false);
                          }
                        }
                      }}
                      className={`p-2 rounded-r-lg ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'} hover:opacity-80`}
                      title="Cari produk dan langsung masukan ke keranjang"
                    >
                      <ShoppingCart className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {isScanning && (
                  <div className={`p-3 rounded-lg mb-4 text-center ${darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'}`}>
                    <p className="flex items-center justify-center">
                      <Camera className="h-4 w-4 mr-2 animate-pulse" />
                      Mode Scan Aktif - Arahkan barcode scanner ke produk
                    </p>
                  </div>
                )}

                {/* Hidden input to capture barcode scanner input */}
                {isScanning && (
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    className="absolute opacity-0 w-0 h-0"
                    autoFocus
                    onFocus={(e) => e.target.select()}
                  />
                )}

                <div className={`max-h-96 overflow-y-auto ${isProductListLoading ? 'opacity-50' : ''}`}>
                  {isProductListLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                    </div>
                  ) : products.length > 0 ? (
                    <div className="space-y-2">
                      {products.map((product) => (
                        <div
                          key={product.id}
                          className={`flex justify-between items-center p-3 rounded-lg cursor-pointer hover:opacity-80 transition-opacity ${
                            darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                          onClick={() => {
                            addToCart(product);
                            // Optionally clear search after adding to cart
                            if (isScanning) {
                              setTimeout(() => setSearchTerm(''), 100);
                            }
                          }}
                        >
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {product.productCode}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">
                              Rp {(product.purchasePrice || 0).toLocaleString('id-ID')}
                            </div>
                            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              Stok: {product.stock}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                      {searchTerm ? 'Produk tidak ditemukan' : isScanning ? 'Arahkan scanner ke barcode produk' : 'Cari produk untuk ditambahkan ke keranjang'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Cart and Supplier Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Supplier and Date Selection */}
              <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h2 className={`text-lg font-semibold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Package className="mr-2 h-5 w-5" />
                  Informasi Pembelian
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Supplier *
                    </label>
                    <select
                      value={selectedSupplier}
                      onChange={(e) => setSelectedSupplier(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">Pilih Supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Tanggal Pembelian *
                    </label>
                    <input
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Cart Items */}
              <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h2 className={`text-lg font-semibold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Keranjang Pembelian
                </h2>
                
                {cart.length === 0 ? (
                  <div className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                    Tidak ada produk dalam keranjang
                  </div>
                ) : (
                  <div className="overflow-y-auto max-h-60">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Produk</th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Supplier</th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">QTY</th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Harga</th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Subtotal</th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                        {cart.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium">{item.name}</div>
                              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {item.productCode}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm">{item.supplierName || 'Tidak diketahui'}</div>
                              {item.supplierId !== selectedSupplier && item.supplierId && (
                                <div className={`text-xs ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                                  Berbeda
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                                className={`w-20 px-2 py-1 border rounded ${
                                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                                }`}
                              />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <input
                                type="number"
                                min="0"
                                value={item.price}
                                onChange={(e) => updatePrice(item.id, e.target.value)}
                                className={`w-32 px-2 py-1 border rounded ${
                                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                                }`}
                              />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="font-semibold">
                                Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Purchase Summary */}
                {cart.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <span className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Total Pembelian:
                      </span>
                      <span className="text-xl font-bold text-green-600">
                        Rp {calculateTotal().toLocaleString('id-ID')}
                      </span>
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
                          loading 
                            ? 'bg-gray-400' 
                            : darkMode 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : 'bg-green-600 hover:bg-green-700'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Menyimpan...
                          </>
                        ) : (
                          <>
                            <Save className="h-5 w-5 mr-2" />
                            Simpan Pembelian
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Component */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg ${
          notification.type === 'success'
            ? 'bg-green-100 border border-green-400 text-green-700'
            : notification.type === 'error'
            ? 'bg-red-100 border border-red-400 text-red-700'
            : 'bg-blue-100 border border-blue-400 text-blue-700'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
            ) : notification.type === 'error' ? (
              <X className="h-5 w-5 mr-2 text-red-500" />
            ) : (
              <ShoppingCart className="h-5 w-5 mr-2 text-blue-500" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}