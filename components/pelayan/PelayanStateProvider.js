// components/pelayan/PelayanStateProvider.js
'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useSession } from 'next-auth/react';
import { useNotification } from '../notifications/NotificationProvider';
import { transformProductsForDisplay } from '../../utils/productUtils';
import io from 'socket.io-client';

const PelayanStateContext = createContext();

export const usePelayanState = () => {
  const context = useContext(PelayanStateContext);
  if (!context) {
    throw new Error('usePelayanState must be used within a PelayanStateProvider');
  }
  return context;
};

export const PelayanStateProvider = ({ children }) => {
  const { data: session } = useSession();
  const { showNotification } = useNotification();

  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [tempCart, setTempCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [defaultCustomer, setDefaultCustomer] = useState(null);
  const [quickProducts, setQuickProducts] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreProducts, setHasMoreProducts] = useState(false);
  const [productsPerPage] = useState(20);

  // WebSocket for real-time stock updates
  useEffect(() => {
    if (!session?.user?.storeId) return;

    const socket = io({ path: '/api/socket_io' });

    socket.on('connect', () => {
      console.log('PelayanStateProvider connected to socket server.');
      const room = `attendant-store-${session.user.storeId}`;
      socket.emit('joinRoom', room);
      console.log(`Attendant joined room: ${room}`);
    });

    socket.on('stock:update', ({ productId, stock }) => {
      console.log(`Stock update received: Product ${productId}, New Stock ${stock}`);
      
      // Update the main products list (search results)
      setProducts(prevProducts =>
        prevProducts.map(p => (p.id === productId ? { ...p, stock: stock } : p))
      );

      // Update the full product list
      setAllProducts(prevAllProducts =>
        prevAllProducts.map(p => (p.id === productId ? { ...p, stock: stock } : p))
      );

      // Update stock in the temporary cart if the item is present
      setTempCart(prevCart =>
        prevCart.map(item =>
          item.productId === productId ? { ...item, stock: stock } : item
        )
      );

      // Optional: Show a subtle notification if an item in the cart is affected
      const itemInCart = tempCart.find(item => item.productId === productId);
      if (itemInCart) {
        showNotification(`Stok untuk ${itemInCart.name} telah diperbarui menjadi ${stock}.`, 'info', { autoClose: 2000 });
      }
    });

    socket.on('disconnect', () => {
      console.log('PelayanStateProvider disconnected from socket server.');
    });

    return () => {
      if (socket) {
        const room = `attendant-store-${session.user.storeId}`;
        socket.emit('leaveRoom', room);
        socket.disconnect();
      }
    };
  }, [session, showNotification, tempCart]);


  const saveStateToStorage = useCallback((key, data) => {
    if (typeof window !== 'undefined' && session?.user?.id) {
      try {
        const storageKey = `${key}_${session.user.id}`;
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }
  }, [session]);

  const loadStateFromStorage = useCallback((key) => {
    if (typeof window !== 'undefined' && session?.user?.id) {
      try {
        const storageKey = `${key}_${session.user.id}`;
        const storedData = localStorage.getItem(storageKey);
        return storedData ? JSON.parse(storedData) : null;
      } catch (error) {
        console.error('Error loading from localStorage:', error);
        return null;
      }
    }
    return null;
  }, [session]);

  useEffect(() => {
    if (session?.user?.id) {
      const savedCart = loadStateFromStorage('tempCart');
      if (savedCart && savedCart.length > 0) {
        setTempCart(savedCart);
        showNotification('Keranjang belanja Anda yang belum selesai berhasil dipulihkan.', 'info');
      }
      const savedCustomer = loadStateFromStorage('selectedCustomer');
      if (savedCustomer) {
        setSelectedCustomer(savedCustomer);
      }
      const savedProducts = loadStateFromStorage('quickProducts');
      if (savedProducts) {
        setQuickProducts(savedProducts);
      }
    }
  }, [session, loadStateFromStorage, showNotification]);

  useEffect(() => {
    if (session?.user?.id && typeof window !== 'undefined') {
      saveStateToStorage('tempCart', tempCart);
    }
  }, [tempCart, session, saveStateToStorage]);

  useEffect(() => {
    if (session?.user?.id && typeof window !== 'undefined') {
      saveStateToStorage('selectedCustomer', selectedCustomer);
    }
  }, [selectedCustomer, session, saveStateToStorage]);

  useEffect(() => {
    if (session?.user?.id && typeof window !== 'undefined') {
      saveStateToStorage('quickProducts', quickProducts);
    }
  }, [quickProducts, session, saveStateToStorage]);

  const addQuickProduct = useCallback((product) => {
    setQuickProducts(prev => {
      if (prev.some(p => p.id === product.id)) {
        return prev;
      }
      const newProducts = [...prev, product];
      return newProducts.length > 10 ? newProducts.slice(0, 10) : newProducts;
    });
  }, []);

  const removeQuickProduct = useCallback((productId) => {
    setQuickProducts(prev => prev.filter(p => p.id !== productId));
  }, []);

  const fetchProducts = useCallback(async (searchQuery = '', page = 1) => {
    const isInitialLoad = page === 1;
    if (isInitialLoad) {
      setIsSearchingProducts(true);
    }
    try {
      if (!searchQuery.trim()) {
        setProducts([]);
        setAllProducts([]);
        setHasMoreProducts(false);
        setCurrentPage(1);
        return;
      }
      const cacheKey = `products_${searchQuery}_page_${page}`;
      const cachedProducts = loadStateFromStorage(cacheKey);
      if (cachedProducts && Date.now() - cachedProducts.timestamp < 5 * 60 * 1000) {
        if (isInitialLoad) {
          setProducts(cachedProducts.data);
          setAllProducts(cachedProducts.data);
          setCurrentPage(page);
        } else {
          setProducts(prev => [...prev, ...cachedProducts.data]);
          setAllProducts(prev => [...prev, ...cachedProducts.data]);
          setCurrentPage(page);
        }
        if (isInitialLoad) {
          setIsSearchingProducts(false);
        }
        return;
      }
      const url = `/api/produk?search=${encodeURIComponent(searchQuery)}&page=${page}&limit=${productsPerPage}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal memuat produk.');
      }
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      let productsData;
      let hasMore = false;
      if (data.products && Array.isArray(data.products)) {
        productsData = data.products;
        if (data.pagination) {
          hasMore = data.pagination.page < data.pagination.totalPages;
        } else {
          hasMore = data.products.length === productsPerPage;
        }
      } else {
        productsData = Array.isArray(data) ? data : (data.products || []);
        hasMore = productsData.length === productsPerPage;
      }
      const transformedProducts = transformProductsForDisplay(productsData);
      saveStateToStorage(cacheKey, {
        data: transformedProducts,
        timestamp: Date.now()
      });
      if (isInitialLoad) {
        setProducts(transformedProducts);
        setAllProducts(transformedProducts);
        setCurrentPage(page);
      } else {
        setProducts(prev => [...prev, ...transformedProducts]);
        setAllProducts(prev => [...prev, ...transformedProducts]);
        setCurrentPage(page);
      }
      setHasMoreProducts(hasMore);
    } catch (err) {
      setError(`Tidak dapat mengambil data produk: ${err.message}`);
      showNotification(`Gagal memuat produk: ${err.message}`, 'error', {
        autoClose: 8000
      });
      if (page === 1) {
        setProducts([]);
        setAllProducts([]);
      }
    } finally {
      if (isInitialLoad) {
        setIsSearchingProducts(false);
      }
    }
  }, [showNotification, loadStateFromStorage, saveStateToStorage, productsPerPage]);

  const loadMoreProducts = useCallback(async (searchQuery) => {
    if (!hasMoreProducts || isSearchingProducts) return;
    const nextPage = currentPage + 1;
    await fetchProducts(searchQuery, nextPage);
  }, [hasMoreProducts, isSearchingProducts, currentPage, fetchProducts]);

  const fetchProductsByCategory = useCallback(async (categoryId) => {
    setIsSearchingProducts(true);
    try {
      setError(null);
      const url = `/api/produk?categoryId=${encodeURIComponent(categoryId)}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal memuat produk berdasarkan kategori.');
      }
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      const transformedProducts = transformProductsForDisplay(data.products);
      setProducts(transformedProducts);
    } catch (err) {
      setError(`Tidak dapat mengambil data produk berdasarkan kategori: ${err.message}`);
      showNotification(err.message, 'error');
      setProducts([]);
    } finally {
      setIsSearchingProducts(false);
    }
  }, [showNotification]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/kategori');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal memuat kategori.');
      }
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data.categories || [];
    } catch (err) {
      showNotification(`Tidak dapat mengambil data kategori: ${err.message}`, 'error');
      return [];
    }
  }, [showNotification]);

  const searchCustomers = useCallback(async (searchQuery = '') => {
    setIsSearchingCustomers(true);
    let foundMembers = [];
    try {
      setError(null);
      if (!searchQuery.trim()) {
        setCustomers([]);
        return [];
      }
      if (searchQuery.toLowerCase() === 'umum' || searchQuery.toLowerCase() === 'pelanggan umum') {
        if (defaultCustomer) {
          foundMembers = [defaultCustomer];
          setCustomers(foundMembers);
          return foundMembers;
        }
      }
      const url = `/api/member?global=true&search=${encodeURIComponent(searchQuery)}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal memuat pelanggan.');
      }
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      foundMembers = data.members || [];
      setCustomers(foundMembers);
    } catch (err) {
      setError(`Tidak dapat memuat daftar pelanggan: ${err.message}`);
      showNotification(err.message, 'warning');
      setCustomers([]);
    } finally {
      setIsSearchingCustomers(false);
    }
    return foundMembers;
  }, [showNotification, defaultCustomer]);

  const fetchDefaultCustomer = useCallback(async () => {
    setIsInitialLoading(true);
    try {
      let response = await fetch('/api/member?global=true&search=UMUM');
      let data;
      if (response.ok) {
        data = await response.json();
        if (data.error) throw new Error(data.error);
      } else {
        const errorData = await response.json();
        console.log('Error fetching UMUM member:', errorData);
      }
      if (data && data.members && data.members.length > 0) {
        const umumCustomer = data.members[0];
        setDefaultCustomer(umumCustomer);
        if (!selectedCustomer) {
          setSelectedCustomer(umumCustomer);
        }
      } else {
        try {
          const createResponse = await fetch('/api/member', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'Pelanggan Umum', code: 'UMUM', phone: '', address: '', membershipType: 'RETAIL', discount: 0, global: true
            })
          });
          if (createResponse.ok) {
            const createdData = await createResponse.json();
            setDefaultCustomer(createdData.member);
            if (!selectedCustomer) {
              setSelectedCustomer(createdData.member);
            }
            showNotification('Pelanggan Umum berhasil dibuat.', 'success');
          } else {
            const errorData = await createResponse.json();
            console.error('Error creating UMUM member:', errorData);
            const defaultCustomerData = { id: 'default-umum', name: 'Pelanggan Umum', code: 'UMUM', phone: '', address: '', membershipType: 'RETAIL', discount: 0, global: true };
            setDefaultCustomer(defaultCustomerData);
            if (!selectedCustomer) {
              setSelectedCustomer(defaultCustomerData);
            }
          }
        } catch (createErr) {
          console.error('Error in creating UMUM member:', createErr);
          const defaultCustomerData = { id: 'default-umum', name: 'Pelanggan Umum', code: 'UMUM', phone: '', address: '', membershipType: 'RETAIL', discount: 0, global: true };
          setDefaultCustomer(defaultCustomerData);
          if (!selectedCustomer) {
            setSelectedCustomer(defaultCustomerData);
          }
        }
      }
    } catch (err) {
      console.error('Error in fetchDefaultCustomer:', err);
      const defaultCustomerData = { id: 'default-umum', name: 'Pelanggan Umum', code: 'UMUM', phone: '', address: '', membershipType: 'RETAIL', discount: 0, global: true };
      setDefaultCustomer(defaultCustomerData);
      if (!selectedCustomer) {
        setSelectedCustomer(defaultCustomerData);
      }
    } finally {
      setIsInitialLoading(false);
    }
  }, [showNotification, selectedCustomer]);

  const addToTempCart = useCallback((product, note = '') => {
    if (!product || !product.id) {
      showNotification('Produk tidak valid.', 'error');
      return;
    }
    if (product.stock <= 0) {
      showNotification(`Stok produk ${product.name} sudah habis.`, 'warning');
      return;
    }
    setTempCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product.id);
      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          showNotification(`Stok produk ${product.name} tidak mencukupi.`, 'warning');
          return prevCart;
        }
        return prevCart.map(item =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prevCart,
        {
          productId: product.id, name: product.name, price: product.sellingPrice || 0, quantity: 1, image: product.image, stock: product.stock, category: product.categoryName || product.category || '', note: note
        }
      ];
    });
    showNotification(`${product.name} ditambahkan ke keranjang.`, 'info');
  }, [showNotification]);

  const addNoteToCartItem = useCallback((productId, note) => {
    setTempCart(prevCart => {
      return prevCart.map(item =>
        item.productId === productId ? { ...item, note } : item
      );
    });
  }, []);

  const removeFromTempCart = (productId) => {
    setTempCart(prevCart => prevCart.filter(item => item.productId !== productId));
  };

  const updateQuantity = useCallback((productId, newQuantity) => {
    setTempCart(prevCart => {
      const item = prevCart.find(i => i.productId === productId);
      if (!item) return prevCart;

      if (newQuantity > item.stock) {
        showNotification(`Stok tidak mencukupi. Sisa stok: ${item.stock}`, 'warning');
        return prevCart;
      }
      if (newQuantity <= 0) {
        return prevCart.filter(i => i.productId !== productId);
      }
      return prevCart.map(i => i.productId === productId ? { ...i, quantity: newQuantity } : i);
    });
  }, [showNotification]);

  const handleClearCart = () => {
    setTempCart([]);
    showNotification('Daftar belanja telah dikosongkan.', 'info');
  };

  const sendToCashier = useCallback(async (note = '', customerIdToUse = null) => {
    if (tempCart.length === 0) {
      showNotification('Keranjang masih kosong.', 'warning');
      return false;
    }
    setIsSubmitting(true);
    showNotification('Mengirim daftar belanja ke daftar tangguhkan...', 'info');
    
    const finalCustomerId = customerIdToUse || selectedCustomer?.id || null;
    
    try {
      const response = await fetch('/api/suspended-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendantId: session.user.id,
          customerId: customerIdToUse || selectedCustomer?.id || null,
          items: tempCart.map(({ stock, ...item }) => item),
          note: note || 'Daftar belanja dari pelayan',
          storeId: session.user.storeId,
          selectedAttendantId: session.user.id,
        })
      });
      if (response.ok) {
        showNotification('Daftar belanja berhasil disimpan ke daftar tangguhkan!', 'success');
        setTempCart([]);
        return true;
      } else {
        const error = await response.json();
        showNotification(`Gagal mengirim: ${error.error}`, 'error');
        return false;
      }
    } catch (err) {
      showNotification('Terjadi kesalahan saat mengirim daftar belanja.', 'error');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [tempCart, session, selectedCustomer, showNotification]);

  const value = {
    products, allProducts, customers, tempCart, selectedCustomer, setSelectedCustomer, defaultCustomer, quickProducts, isInitialLoading, isSearchingProducts, isSearchingCustomers, isSubmitting, error, setError, fetchProducts, loadMoreProducts, fetchProductsByCategory, fetchCategories, searchCustomers, fetchDefaultCustomer, addToTempCart, removeFromTempCart, updateQuantity, handleClearCart, sendToCashier, addQuickProduct, removeQuickProduct, addNoteToCartItem, hasMoreProducts, currentPage,
  };

  return (
    <PelayanStateContext.Provider value={value}>
      {children}
    </PelayanStateContext.Provider>
  );
};

export default PelayanStateProvider;