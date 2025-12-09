'use client';

import { useState, useEffect, useRef } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useUserTheme } from '../../../components/UserThemeContext';
import { useSession } from 'next-auth/react';
import { X, Plus, Search, Package, ShoppingCart, CreditCard, Save, CheckCircle, Barcode, Camera, PlusCircle, Scan, Loader } from 'lucide-react';
import Breadcrumb from '../../../components/Breadcrumb';

export default function WarehousePurchasePage() {
  const { data: session } = useSession();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const [cart, setCart] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);

  const [newProductData, setNewProductData] = useState({
    name: '',
    productCode: '',
    categoryId: '',
    purchasePrice: '',
    supplierId: '',
    stock: '',
    isMasterData: false // New field to determine if this is master data for warehouse
  });
  const [newCategoryData, setNewCategoryData] = useState({
    name: '',
    description: '',
    isMasterData: false // New field to determine if this is master data for warehouse
  });
  const [newSupplierData, setNewSupplierData] = useState({
    code: '',
    name: '',
    contactPerson: '',
    address: '',
    phone: '',
    email: '',
    isMasterData: false // New field to determine if this is master data for warehouse
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch both regular and master data
        const [suppliersRes, categoriesRes, masterSuppliersRes, masterCategoriesRes] = await Promise.all([
          fetch('/api/warehouse/suppliers'),
          fetch('/api/warehouse/categories'),
          fetch('/api/warehouse/master/supplier'),
          fetch('/api/warehouse/master/kategori')
        ]);

        const [suppliersData, categoriesData, masterSuppliersData, masterCategoriesData] = await Promise.all([
          suppliersRes.json(),
          categoriesRes.json(),
          masterSuppliersRes.json(),
          masterCategoriesRes.json()
        ]);

        // Combine regular and master suppliers/categories
        const allSuppliers = [...(suppliersData.suppliers || []), ...(masterSuppliersData.suppliers || [])];
        const allCategories = [...(categoriesData.categories || []), ...(masterCategoriesData.categories || [])];

        setSuppliers(allSuppliers);
        setCategories(allCategories);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    fetchInitialData();
  }, []);

  const handleNewProductInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewProductData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCreateProduct = async () => {
    if (!newProductData.name || !newProductData.productCode || !newProductData.categoryId || !newProductData.purchasePrice || !newProductData.supplierId) {
      showNotification('Silakan lengkapi semua field yang wajib diisi!', 'error');
      return;
    }

    setLoading(true);
    try {
      // Tentukan endpoint berdasarkan apakah ini master data atau bukan
      const endpoint = newProductData.isMasterData
        ? '/api/warehouse/master/produk'
        : '/api/warehouse/products';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProductData.name,
          productCode: newProductData.productCode,
          categoryId: newProductData.categoryId,
          purchasePrice: parseInt(newProductData.purchasePrice),
          supplierId: newProductData.supplierId,
          stock: parseInt(newProductData.stock) || 0
        })
      });

      const result = await response.json();
      if (response.ok) {
        showNotification('Produk baru berhasil ditambahkan!', 'success');

        // Tambahkan produk baru ke keranjang
        const newProduct = {
          id: result.product.id,
          name: result.product.name,
          productCode: result.product.productCode,
          categoryId: result.product.categoryId,
          purchasePrice: result.product.purchasePrice,
          supplierId: result.product.supplierId,
          stock: result.product.stock
        };

        addToCart({
          ...newProduct,
          purchasePrice: newProduct.purchasePrice,
          supplierName: newProduct.supplier?.name || 'Tidak Diketahui'
        });

        // Reset form
        setNewProductData({
          name: '',
          productCode: '',
          categoryId: '',
          purchasePrice: '',
          supplierId: '',
          stock: '',
          isMasterData: false
        });

        setShowAddProductModal(false);
      } else {
        showNotification(`Gagal menambahkan produk: ${result.error || 'Terjadi kesalahan'}`, 'error');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      showNotification('Terjadi kesalahan saat menambahkan produk', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleNewCategoryInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewCategoryData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCreateCategory = async () => {
    if (!newCategoryData.name) {
      showNotification('Nama kategori wajib diisi!', 'error');
      return;
    }

    setLoading(true);
    try {
      // Tentukan endpoint berdasarkan apakah ini master data atau bukan
      const endpoint = newCategoryData.isMasterData
        ? '/api/warehouse/master/kategori'
        : '/api/warehouse/categories';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryData.name,
          description: newCategoryData.description
        })
      });

      const result = await response.json();
      if (response.ok) {
        showNotification('Kategori baru berhasil ditambahkan!', 'success');

        // Tambahkan kategori baru ke daftar kategori
        setCategories(prev => [...prev, result.category]);

        // Update produk baru dengan kategori yang baru dibuat
        setNewProductData(prev => ({
          ...prev,
          categoryId: result.category.id
        }));

        // Reset form
        setNewCategoryData({
          name: '',
          description: '',
          isMasterData: false
        });

        setShowAddCategoryModal(false);
      } else {
        showNotification(`Gagal menambahkan kategori: ${result.error || 'Terjadi kesalahan'}`, 'error');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      showNotification('Terjadi kesalahan saat menambahkan kategori', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleNewSupplierInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewSupplierData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCreateSupplier = async () => {
    if (!newSupplierData.name || !newSupplierData.code) {
      showNotification('Nama dan kode supplier wajib diisi!', 'error');
      return;
    }

    setLoading(true);
    try {
      // Tentukan endpoint berdasarkan apakah ini master data atau bukan
      const endpoint = newSupplierData.isMasterData
        ? '/api/warehouse/master/supplier'
        : '/api/warehouse/suppliers';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newSupplierData.code,
          name: newSupplierData.name,
          contactPerson: newSupplierData.contactPerson,
          address: newSupplierData.address,
          phone: newSupplierData.phone,
          email: newSupplierData.email
        })
      });

      const result = await response.json();
      if (response.ok) {
        showNotification('Supplier baru berhasil ditambahkan!', 'success');

        // Tambahkan supplier baru ke daftar supplier
        setSuppliers(prev => [...prev, result.supplier]);

        // Update produk baru dengan supplier yang baru dibuat
        setNewProductData(prev => ({
          ...prev,
          supplierId: result.supplier.id
        }));

        // Reset form
        setNewSupplierData({
          code: '',
          name: '',
          contactPerson: '',
          address: '',
          phone: '',
          email: '',
          isMasterData: false
        });

        setShowAddSupplierModal(false);
      } else {
        showNotification(`Gagal menambahkan supplier: ${result.error || 'Terjadi kesalahan'}`, 'error');
      }
    } catch (error) {
      console.error('Error creating supplier:', error);
      showNotification('Terjadi kesalahan saat menambahkan supplier', 'error');
    } finally {
      setLoading(false);
    }
  };



  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1);
      showNotification(`${product.name} jumlahnya diperbarui menjadi ${existingItem.quantity + 1}`, 'info');
    } else {
      // Auto-select supplier if not set
      if (!selectedSupplier && product.supplierId) {
        setSelectedSupplier(product.supplierId);
      }

      const newItem = {
        id: product.id,
        name: product.name,
        productCode: product.productCode,
        quantity: 1,
        price: product.purchasePrice || 0,
        stock: product.stock || 0,
        supplierId: product.supplierId, // Store the supplier from product for reference
        supplierName: product.supplier?.name, // Also store supplier name for display
        categoryId: product.categoryId, // Store the category from product for reference
        categoryName: product.category?.name // Also store category name for display
      };
      setCart(prevCart => [...prevCart, newItem]);
      showNotification(`${product.name} ditambahkan ke keranjang`, 'success');
    }
  };

  // Ref for addToCart to be used in effects
  const addToCartRef = useRef(addToCart);
  useEffect(() => {
    addToCartRef.current = addToCart;
  }, [addToCart]);

  // States for product searching
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [isProductListLoading, setIsProductListLoading] = useState(false);

  // Custom search effect using refs
  useEffect(() => {
    if (!searchTerm.trim()) {
      setProducts([]);
      return;
    }

    const handler = setTimeout(() => {
      const performSearch = async () => {
        setIsProductListLoading(true);
        try {
          // Cari produk dari semua toko
          const response = await fetch(
            `/api/warehouse/products?search=${encodeURIComponent(searchTerm)}&limit=20&includeAllStores=true`
          );
          const data = await response.json();
          setProducts(data.products || []);
        } catch (error) {
          console.error('Error fetching warehouse products:', error);
          setProducts([]);
        } finally {
          setIsProductListLoading(false);
        }
      };

      performSearch();
    }, 300); // 300ms debounce

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Handle scan function (for Enter key)
  const handleProductScan = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmedSearchTerm = searchTerm.trim();
      if (!trimmedSearchTerm) return;

      setIsProductListLoading(true);
      try {
        // Fetch products using the search parameter
        const response = await fetch(`/api/warehouse/products?search=${encodeURIComponent(trimmedSearchTerm)}&includeAllStores=true&limit=20`);
        const data = await response.json();

        if (data.products && data.products.length > 0) {
          // First, look for exact product code match
          const exactCodeMatch = data.products.find(
            (p) => p.productCode.toLowerCase() === trimmedSearchTerm.toLowerCase()
          );

          // If no exact code match found, look for exact name match
          const exactNameMatch = !exactCodeMatch ? data.products.find(
            (p) => p.name.toLowerCase() === trimmedSearchTerm.toLowerCase()
          ) : null;

          // Use exact code match first, then exact name match, then first result
          const matchedProduct = exactCodeMatch || exactNameMatch || data.products[0];

          if (matchedProduct && addToCartRef.current) {
            addToCartRef.current(matchedProduct);
            setSearchTerm(''); // Clear search term after adding to cart
          } else {
            alert(`Produk dengan kode/nama "${trimmedSearchTerm}" tidak ditemukan.`);
          }
        } else {
          alert(`Produk dengan kode/nama "${trimmedSearchTerm}" tidak ditemukan.`);
        }
      } catch (error) {
        console.error('Error scanning product:', error);
        alert('Terjadi kesalahan saat mencari produk.');
      } finally {
        setIsProductListLoading(false);
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
      showNotification('Keranjang pembelian kosong!', 'error');
      return;
    }
    if (!selectedSupplier) {
      showNotification('Silakan pilih supplier terlebih dahulu!', 'error');
      return;
    }

    // Validasi tambahan: pastikan semua item di keranjang memiliki quantity dan harga yang valid
    const invalidItems = cart.filter(item =>
      !item.quantity || item.quantity <= 0 || !item.price || item.price <= 0
    );

    if (invalidItems.length > 0) {
      showNotification('Harap periksa kembali keranjang pembelian. Ada item dengan quantity atau harga tidak valid!', 'error');
      return;
    }

    setLoading(true);
    try {
      // Ambil detail supplier untuk digunakan dalam API baru
      const supplierDetails = suppliers.find(s => s.id === selectedSupplier);

      if (!supplierDetails) {
        showNotification('Supplier tidak ditemukan!', 'error');
        setLoading(false);
        return;
      }

      // Panggil API baru dengan logika yang sesuai kebutuhan
      const response = await fetch('/api/warehouse/purchase-extended', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: selectedSupplier,
          purchaseDate,
          items: cart.map(item => ({
            productName: item.name,
            productCode: item.productCode,
            quantity: item.quantity,
            purchasePrice: item.price,
            categoryName: item.categoryName,
            categoryDescription: item.categoryName ? `Kategori untuk produk ${item.categoryName}` : 'Umum',
            supplierCode: supplierDetails.code, // Gunakan kode supplier
            supplierName: supplierDetails.name, // Gunakan nama supplier
            contactPerson: supplierDetails.contactPerson || '',
            address: supplierDetails.address || '',
            phone: supplierDetails.phone || '',
            email: supplierDetails.email || ''
          })),
          totalAmount: calculateTotal()
        })
      });

      const result = await response.json();

      if (response.ok) {
        showNotification('Pembelian gudang berhasil disimpan!', 'success');
        setCart([]);
        setSelectedSupplier('');
        setSearchTerm('');
        setProducts([]);
      } else {
        showNotification(`Gagal: ${result.error || 'Terjadi kesalahan'}`, 'error');
      }
    } catch (error) {
      console.error('Error saving purchase:', error);
      showNotification('Terjadi kesalahan saat menyimpan pembelian', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="WAREHOUSE">
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50'}`}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb
            items={[
              { title: 'Dashboard Gudang', href: '/warehouse' },
              { title: 'Pembelian Gudang', href: '/warehouse/purchase' }
            ]}
            darkMode={darkMode}
          />

          <h1 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Transaksi Pembelian Gudang
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Product Search Panel */}
            <div className="space-y-6">
              <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className={`text-lg font-semibold flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <Search className="mr-2 h-5 w-5" />
                    Cari Produk
                  </h2>
                  <button
                    onClick={() => setShowAddProductModal(true)}
                    className={`flex items-center px-3 py-1 rounded-lg text-sm ${
                      darkMode ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    <PlusCircle className="mr-1 h-4 w-4" />
                    Tambah Produk
                  </button>
                </div>

                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Cari produk berdasarkan nama atau kode..."
                    className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                    }`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleProductScan}
                    autoFocus
                    aria-label="Cari produk"
                  />
                  <div className="absolute left-3 top-2.5 flex items-center">
                    <Search className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    <Scan className={`ml-2 h-4 w-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  <p>Tip: Gunakan tombol Enter setelah mengetik kode produk untuk menambahkan secara langsung</p>
                </div>


                <div className="rounded-lg shadow overflow-hidden">
                  <div className="p-2 border-b flex items-center">
                    <Package className={`h-4 w-4 mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {isProductListLoading ? 'Memuat produk...' : products.length > 0 ? `Ditemukan ${products.length} produk` : 'Produk tidak ditemukan'}
                    </h3>
                  </div>
                  <div className="divide-y max-h-96 overflow-y-auto styled-scrollbar">
                    {isProductListLoading && (
                      <div className="p-4 text-center flex justify-center items-center">
                        <Loader className="animate-spin mr-2" size={20} />
                        <span>Mencari produk...</span>
                      </div>
                    )}
                    {!isProductListLoading && products.length === 0 && searchTerm && (
                      <div className="p-4 text-center text-gray-500">Produk tidak ditemukan. Coba kode produk atau nama yang berbeda.</div>
                    )}
                    {!isProductListLoading && products.length === 0 && !searchTerm && (
                      <div className="p-4 text-center text-gray-500">Ketik nama atau kode produk untuk mencari</div>
                    )}
                    {!isProductListLoading && products && Array.isArray(products) && products.map(product => {
                      // Validasi bahwa produk memiliki properti yang diperlukan
                      if (!product || !product.id || !product.name || !product.productCode) {
                        console.warn('Invalid product data:', product);
                        return null;
                      }

                      return (
                        <div
                          key={product.id}
                          className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} border-l-4 ${product.stock < 5 ? 'border-red-500' : 'border-transparent'}`}
                          onClick={() => addToCart({
                            ...product,
                            purchasePrice: product.purchasePrice || 0,
                            supplierName: product.supplier?.name || 'Tidak Diketahui',
                            categoryName: product.category?.name || 'Tidak Diketahui'
                          })}
                          role="button"
                          tabIndex="0"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              addToCart({
                                ...product,
                                purchasePrice: product.purchasePrice || 0,
                                supplierName: product.supplier?.name || 'Tidak Diketahui',
                                categoryName: product.category?.name || 'Tidak Diketahui'
                              });
                            }
                          }}
                          title={`Tambahkan ${product.name} ke keranjang`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{product.name}</div>
                            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Kode: {product.productCode}</div>
                          </div>
                          <div className="text-right ml-4">
                            <div className={`text-sm font-semibold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                              Rp {(product.purchasePrice || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                            </div>
                            <div className={`text-xs mt-1 ${product.stock < 5 ? (darkMode ? 'text-red-400' : 'text-red-600') : (darkMode ? 'text-gray-500' : 'text-gray-500')}`}>
                              Stok: {product.stock} {product.stock < 5 && product.stock > 0 ? '(Stok Menipis)' : ''}
                              {product.stock === 0 && '(Habis)'}
                            </div>
                          </div>
                        </div>
                      );
                    }).filter(Boolean)} {/* Filter out any null values */}
                  </div>
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
                              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Kode: {item.productCode}
                              </div>
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
                                Rp {(item.price * item.quantity).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="p-1 text-red-500 hover:text-red-700"
                                title="Hapus dari keranjang"
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

                {/* Total Summary */}
                {cart.length > 0 && (
                  <div className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Total Pembelian:</span>
                      <span>Rp {calculateTotal().toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={loading || cart.length === 0}
                    className={`flex items-center px-6 py-3 rounded-lg font-medium ${
                      loading || cart.length === 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-5 w-5" />
                        Simpan Pembelian
                      </>
                    )}
                  </button>
                </div>
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
                  <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-xs">i</span>
                  </div>
                )}
              </div>
              <span>{notification.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Modal Tambah Produk Baru */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl shadow-xl max-w-md w-full ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`p-6 rounded-t-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="flex justify-between items-center">
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Tambah Produk Baru
                </h2>
                <button
                  onClick={() => {
                    setShowAddProductModal(false);
                    setNewProductData({
                      name: '',
                      productCode: '',
                      categoryId: '',
                      purchasePrice: '',
                      supplierId: '',
                      stock: ''
                    });
                  }}
                  className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Nama Produk *
                </label>
                <input
                  type="text"
                  name="name"
                  value={newProductData.name}
                  onChange={handleNewProductInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Masukkan nama produk"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Kode Produk *
                </label>
                <input
                  type="text"
                  name="productCode"
                  value={newProductData.productCode}
                  onChange={handleNewProductInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Masukkan kode produk"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Kategori *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddCategoryModal(true)}
                    className={`text-xs flex items-center ${
                      darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-800'
                    }`}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Tambah Baru
                  </button>
                </div>
                <select
                  name="categoryId"
                  value={newProductData.categoryId}
                  onChange={handleNewProductInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Harga Beli *
                </label>
                <input
                  type="number"
                  name="purchasePrice"
                  value={newProductData.purchasePrice}
                  onChange={handleNewProductInputChange}
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="0"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Supplier *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddSupplierModal(true)}
                    className={`text-xs flex items-center ${
                      darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-800'
                    }`}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Tambah Baru
                  </button>
                </div>
                <select
                  name="supplierId"
                  value={newProductData.supplierId}
                  onChange={handleNewProductInputChange}
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
                  Stok Awal
                </label>
                <input
                  type="number"
                  name="stock"
                  value={newProductData.stock}
                  onChange={handleNewProductInputChange}
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="0 (opsional)"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isMasterData"
                  checked={newProductData.isMasterData}
                  onChange={handleNewProductInputChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label className={`ml-2 block text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Simpan sebagai data master gudang
                </label>
              </div>
            </div>

            <div className={`p-6 flex justify-end space-x-3 rounded-b-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <button
                onClick={() => {
                  setShowAddProductModal(false);
                  setNewProductData({
                    name: '',
                    productCode: '',
                    categoryId: '',
                    purchasePrice: '',
                    supplierId: '',
                    stock: ''
                  });
                }}
                className={`px-4 py-2 rounded-lg ${
                  darkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
              >
                Batal
              </button>
              <button
                onClick={handleCreateProduct}
                disabled={loading}
                className={`px-4 py-2 rounded-lg flex items-center ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Simpan Produk
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Kategori Baru */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl shadow-xl max-w-md w-full ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`p-6 rounded-t-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="flex justify-between items-center">
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Tambah Kategori Baru
                </h2>
                <button
                  onClick={() => {
                    setShowAddCategoryModal(false);
                    setNewCategoryData({
                      name: '',
                      description: ''
                    });
                  }}
                  className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Nama Kategori *
                </label>
                <input
                  type="text"
                  name="name"
                  value={newCategoryData.name}
                  onChange={handleNewCategoryInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Masukkan nama kategori"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Deskripsi
                </label>
                <textarea
                  name="description"
                  value={newCategoryData.description}
                  onChange={handleNewCategoryInputChange}
                  rows="3"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Deskripsi kategori (opsional)"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isMasterData"
                  checked={newCategoryData.isMasterData}
                  onChange={handleNewCategoryInputChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label className={`ml-2 block text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Simpan sebagai data master gudang
                </label>
              </div>
            </div>

            <div className={`p-6 flex justify-end space-x-3 rounded-b-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <button
                onClick={() => {
                  setShowAddCategoryModal(false);
                  setNewCategoryData({
                    name: '',
                    description: '',
                    isMasterData: false
                  });
                }}
                className={`px-4 py-2 rounded-lg ${
                  darkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
              >
                Batal
              </button>
              <button
                onClick={handleCreateCategory}
                disabled={loading}
                className={`px-4 py-2 rounded-lg flex items-center ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Simpan Kategori
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Supplier Baru */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl shadow-xl max-w-md w-full ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`p-6 rounded-t-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="flex justify-between items-center">
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Tambah Supplier Baru
                </h2>
                <button
                  onClick={() => {
                    setShowAddSupplierModal(false);
                    setNewSupplierData({
                      code: '',
                      name: '',
                      contactPerson: '',
                      address: '',
                      phone: '',
                      email: ''
                    });
                  }}
                  className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Kode Supplier *
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={newSupplierData.code}
                    onChange={handleNewSupplierInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Kode supplier"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Nama *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newSupplierData.name}
                    onChange={handleNewSupplierInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Nama supplier"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Kontak Person
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  value={newSupplierData.contactPerson}
                  onChange={handleNewSupplierInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Nama kontak person"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Alamat
                </label>
                <textarea
                  name="address"
                  value={newSupplierData.address}
                  onChange={handleNewSupplierInputChange}
                  rows="2"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Alamat supplier"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Telepon
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={newSupplierData.phone}
                    onChange={handleNewSupplierInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Nomor telepon"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={newSupplierData.email}
                    onChange={handleNewSupplierInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Alamat email"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isMasterData"
                  checked={newSupplierData.isMasterData}
                  onChange={handleNewSupplierInputChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label className={`ml-2 block text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Simpan sebagai data master gudang
                </label>
              </div>
            </div>

            <div className={`p-6 flex justify-end space-x-3 rounded-b-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <button
                onClick={() => {
                  setShowAddSupplierModal(false);
                  setNewSupplierData({
                    code: '',
                    name: '',
                    contactPerson: '',
                    address: '',
                    phone: '',
                    email: '',
                    isMasterData: false
                  });
                }}
                className={`px-4 py-2 rounded-lg ${
                  darkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
              >
                Batal
              </button>
              <button
                onClick={handleCreateSupplier}
                disabled={loading}
                className={`px-4 py-2 rounded-lg flex items-center ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Simpan Supplier
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}