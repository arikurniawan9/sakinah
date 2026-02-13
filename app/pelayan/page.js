// app/pelayan/page.js
'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Search, ShoppingCart, Users, Send, Camera, Sun, Moon, LogOut, AlertCircle, Trash2, X, History, Bell, Package, TrendingUp, ShoppingCartIcon, User, Star, Edit3, BarChart3, Scan, CameraOff, Camera as CameraIcon, Check, Settings, Shield } from 'lucide-react';
import Image from 'next/image';
import BarcodeScanner from '../../components/BarcodeScannerOptimized';
import EnhancedBarcodeScanner from '../../components/pelayan/EnhancedBarcodeScanner';
import { useNotification } from '../../components/notifications/NotificationProvider';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useDebounce } from '../../lib/hooks/useDebounce';
import { usePelayanState, default as PelayanStateProvider } from '../../components/pelayan/PelayanStateProvider';
import PelayanHistory from '../../components/pelayan/PelayanHistory';
import PelayanNotifications from '../../components/pelayan/PelayanNotifications';
import QuickAddPanel from '../../components/pelayan/QuickAddPanel';
import AttendantStats from '../../components/pelayan/AttendantStats';
import CartItemNoteModal from '../../components/pelayan/CartItemNoteModal';
import { useUserTheme } from '../../components/UserThemeContext';
import VirtualizedProductList from '../../components/pelayan/VirtualizedProductList';
import ProductItem from '../../components/pelayan/ProductItem';
import EnhancedLoadingSpinner from '../../components/pelayan/EnhancedLoadingSpinner';
import EnhancedErrorDisplay from '../../components/pelayan/EnhancedErrorDisplay';
import BottomNavigation from '../../components/pelayan/BottomNavigation';
import { motion, AnimatePresence } from 'framer-motion';

// Komponen untuk satu item di keranjang
const CartItem = ({ item, updateQuantity, removeFromCart, darkMode, onEditNote }) => {
  const itemPrice = item.price || 0;
  const itemQuantity = item.quantity || 0;
  const itemSubtotal = itemPrice * itemQuantity;

  return (
    <li className="py-4 px-3 rounded-lg border transition-colors duration-200 hover:shadow-sm hover:scale-[1.01] mb-2 last:mb-0"
      style={{
        borderLeft: '4px solid #8b5cf6',
        background: darkMode ? 'linear-gradient(90deg, #1f2937 0%, #111827 100%)' : 'linear-gradient(90deg, #f9fafb 0%, #ffffff 100%)'
      }}>
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 dark:text-white truncate">{item.name || 'Produk tidak dikenal'}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{itemQuantity} x Rp {itemPrice.toLocaleString('id-ID')}</div>
          {item.note && (
            <div className={`text-sm mt-2 p-2 rounded-lg flex items-start ${
              darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}>
              <span className="font-medium mr-2">Catatan:</span>
              <span className="truncate">{item.note}</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-3 ml-3">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => updateQuantity(item.productId, itemQuantity - 1)} 
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              disabled={itemQuantity <= 1}
            >
              <span className="text-lg font-bold">-</span>
            </button>
            <span className="text-base font-semibold dark:text-white min-w-[24px] text-center">{itemQuantity}</span>
            <button 
              onClick={() => updateQuantity(item.productId, itemQuantity + 1)} 
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <span className="text-lg font-bold">+</span>
            </button>
          </div>
          <button onClick={() => onEditNote(item)} className="ml-2 text-blue-500 hover:text-blue-600 dark:text-blue-400 transition-colors"><Edit3 className="h-5 w-5" /></button>
          <button onClick={() => removeFromCart(item.productId)} className="ml-2 text-red-500 hover:text-red-600 dark:text-red-400 transition-colors"><Trash2 className="h-5 w-5" /></button>
        </div>
      </div>
      <div className="text-base text-right text-purple-600 dark:text-purple-400 mt-2 font-semibold">
        Rp {itemSubtotal.toLocaleString('id-ID')}
      </div>
    </li>
  );
};

function AttendantDashboard() {
  const { data: session, status } = useSession();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;

  const [searchTerm, setSearchTerm] = useState('');
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showSendConfirmModal, setShowSendConfirmModal] = useState(false);
  const [showClearCartModal, setShowClearCartModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [note, setNote] = useState('');
  const [activeTab, setActiveTab] = useState('home'); 
  const [showCartItemNoteModal, setShowCartItemNoteModal] = useState(false);
  const [currentCartItem, setCurrentCartItem] = useState(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const debouncedCustomerSearchTerm = useDebounce(customerSearchTerm, 300);
  const [foundCustomers, setFoundCustomers] = useState([]);
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);

  const {
    products, tempCart, selectedCustomer, setSelectedCustomer, defaultCustomer, quickProducts,
    isInitialLoading, isSearchingProducts, isSubmitting, error, setError, fetchProducts,
    loadMoreProducts, fetchProductsByCategory, fetchCategories, fetchDefaultCustomer,
    addToTempCart, removeFromTempCart, updateQuantity, handleClearCart: clearCartFromContext,
    sendToCashier, searchCustomers, addQuickProduct, removeQuickProduct, addNoteToCartItem,
    hasMoreProducts, currentPage,
  } = usePelayanState();

  const cartTotal = useMemo(() => {
    return tempCart.reduce((total, item) => (total + ((item.price || 0) * (item.quantity || 0))), 0);
  }, [tempCart]);

  const { showNotification } = useNotification();

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.storeId && !selectedCustomer) {
      fetchDefaultCustomer();
    } else if (status === 'authenticated' && !session?.user?.storeId) {
      setError('Anda tidak terkait dengan toko manapun. Silakan hubungi administrator.');
    }
  }, [status, session, selectedCustomer, fetchDefaultCustomer, setError]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.storeId) {
      fetchProducts(debouncedSearchTerm, 1);
    }
  }, [debouncedSearchTerm, status, session, fetchProducts]);

  useEffect(() => {
    const fetchMembers = async () => {
      if (debouncedCustomerSearchTerm.trim() === '') {
        setFoundCustomers([]);
        return;
      }
      setIsSearchingMembers(true);
      try {
        const result = await searchCustomers(debouncedCustomerSearchTerm);
        setFoundCustomers(result);
      } catch (err) {
        showNotification(`Gagal mencari member: ${err.message}`, 'error');
      } finally {
        setIsSearchingMembers(false);
      }
    };
    fetchMembers();
  }, [debouncedCustomerSearchTerm, searchCustomers, showNotification]);

  const handleBarcodeScan = useCallback(async (decodedText) => {
    try {
        const productResponse = await fetch(`/api/products/by-code/${encodeURIComponent(decodedText)}`);
        if (productResponse.ok) {
            const productData = await productResponse.json();
            if (productData && productData.id) {
                addToTempCart({ ...productData, sellingPrice: productData.retailPrice });
                showNotification(`Produk ${productData.name} ditambahkan.`, 'success');
                return;
            }
        }
        if (decodedText.toLowerCase() === 'umum') {
          if (defaultCustomer) { setSelectedCustomer(defaultCustomer); return; }
        }
        const customerData = await searchCustomers(decodedText);
        if (customerData && customerData.length > 0) {
            setSelectedCustomer(customerData[0]);
            showNotification(`Pelanggan ${customerData[0].name} dipilih.`, 'success');
            return;
        }
        showNotification('Kode tidak ditemukan.', 'warning');
    } catch (error) {
        showNotification('Gagal memproses barcode.', 'error');
    }
  }, [addToTempCart, setSelectedCustomer, showNotification, searchCustomers, defaultCustomer]);

  const [selectedCustomerForSend, setSelectedCustomerForSend] = useState(defaultCustomer || null);
  const [showCustomerSelectionModal, setShowCustomerSelectionModal] = useState(false);

  const handleConfirmSend = () => {
    setShowSendConfirmModal(false);
    setShowCustomerSelectionModal(true);
  };

  const handleSendWithNote = async () => {
    const success = await sendToCashier(note, selectedCustomerForSend?.id || null);
    if (success) {
      setSearchTerm('');
      setNote('');
      setSelectedCustomerForSend(defaultCustomer || null);
      setActiveTab('home'); // Kembalikan ke home setelah kirim
    }
    setShowNoteModal(false);
  };

  if (isInitialLoading || status === 'loading') return <EnhancedLoadingSpinner message="Memuat..." />;

  // Render Screens berdasarkan Tab
  const renderContent = () => {
    switch(activeTab) {
      case 'history':
        return <div className="animate-in fade-in duration-500"><PelayanHistory darkMode={darkMode} attendantId={session.user.id} /></div>;
      case 'notifications':
        return <div className="animate-in slide-in-from-right duration-500"><PelayanNotifications darkMode={darkMode} /></div>;
      case 'profile':
        return (
          <div className="animate-in slide-in-from-bottom duration-500 p-4 space-y-6">
            <div className={`p-8 rounded-[2.5rem] text-center shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="w-24 h-24 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-full mx-auto flex items-center justify-center text-white text-4xl font-black mb-4 shadow-lg">
                {session?.user?.name?.charAt(0) || 'U'}
              </div>
              <h2 className="text-2xl font-black">{session?.user?.name}</h2>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-1">{session?.user?.role}</p>
              <div className="mt-6 flex justify-center gap-2">
                <Badge className="bg-blue-100 text-blue-700 border-none px-4 py-1 rounded-full font-bold">{session?.user?.employeeNumber || 'ID: No Code'}</Badge>
              </div>
            </div>
            
            <div className={`rounded-3xl shadow-lg divide-y ${darkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-100'} overflow-hidden`}>
              <button className="w-full p-5 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Settings className="w-5 h-5 text-gray-400" />
                <span className="font-bold text-sm">Pengaturan Akun</span>
              </button>
              <button className="w-full p-5 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Shield className="w-5 h-5 text-gray-400" />
                <span className="font-bold text-sm">Keamanan</span>
              </button>
              <button onClick={() => signOut()} className="w-full p-5 flex items-center gap-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <LogOut className="w-5 h-5" />
                <span className="font-bold text-sm">Keluar Aplikasi</span>
              </button>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-8 pb-20 md:pb-8">
            {/* Quick Products */}
            {quickProducts.length > 0 && (
              <div className={`rounded-2xl shadow-xl ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} border overflow-hidden`}>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Produk Cepat</h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {quickProducts.map(product => (
                      <div key={product.id} className={`flex flex-col items-center p-3 rounded-xl border cursor-pointer transition-all ${darkMode ? 'bg-gray-750 border-gray-600 hover:bg-gray-700' : 'bg-white border-gray-200 hover:bg-gray-50'}`} onClick={() => addToTempCart(product)}>
                        <div className="w-12 h-12 flex items-center justify-center mb-2">
                          {product.image ? <Image src={product.image} alt={product.name} width={48} height={48} className="rounded-lg object-contain" /> : <Package className="h-6 w-6 text-gray-400" />}
                        </div>
                        <div className="text-center"><div className="font-bold text-[10px] truncate w-full">{product.name}</div><div className="text-[10px] text-purple-600 font-black">Rp {product.sellingPrice?.toLocaleString('id-ID')}</div></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Search Section */}
            <div className={`rounded-2xl shadow-xl ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} border overflow-hidden`}>
              <div className="p-6">
                <div className="relative mb-4">
                  <input type="text" placeholder="Cari nama/kode..." className={`w-full pl-12 pr-4 py-4 border rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
                </div>
                <div className="max-h-80 overflow-hidden">
                  {isSearchingProducts ? <LoadingSpinner /> : products.length > 0 ? (
                    <VirtualizedProductList products={products} addToCart={addToTempCart} addQuickProduct={addQuickProduct} removeQuickProduct={removeQuickProduct} quickProducts={quickProducts} darkMode={darkMode} height={320} />
                  ) : <div className="text-center py-8 opacity-50"><Search className="h-8 w-8 mx-auto mb-2" /><p className="text-sm">Silakan cari produk</p></div>}
                </div>
              </div>
            </div>

            {/* Cart Section */}
            <div className={`rounded-2xl shadow-xl ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} border overflow-hidden`}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold flex items-center"><ShoppingCart className="mr-2 h-5 w-5 text-purple-500" /> Keranjang</h2>
                  {tempCart.length > 0 && <button onClick={() => setShowClearCartModal(true)} className="p-2 text-red-500"><Trash2 className="h-5 w-5" /></button>}
                </div>
                <div className="max-h-80 overflow-y-auto space-y-3">
                  {tempCart.length === 0 ? <div className="text-center py-8 opacity-50"><Package className="h-8 w-8 mx-auto mb-2" /><p className="text-sm">Keranjang kosong</p></div> : 
                    tempCart.map(item => <CartItem key={item.productId} item={item} updateQuantity={updateQuantity} removeFromCart={removeFromTempCart} onEditNote={(i) => {setCurrentCartItem(i); setShowCartItemNoteModal(true);}} darkMode={darkMode} />)
                  }
                </div>
                {tempCart.length > 0 && (
                  <div className="mt-6 pt-4 border-t dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4"><span className="font-bold">Estimasi Total:</span><span className="text-xl font-black text-purple-600">Rp {cartTotal.toLocaleString('id-ID')}</span></div>
                    <button onClick={() => setShowSendConfirmModal(true)} className="w-full py-4 rounded-xl font-black text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg shadow-purple-200 dark:shadow-none flex items-center justify-center gap-2 transform active:scale-95 transition-all"><Send className="h-5 w-5" /> KIRIM KE KASIR</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <main className={`flex-1 p-4 min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} pb-24 md:pb-8`}>
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4">
          <div className="md:hidden flex items-center justify-between mb-6">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">{session?.user?.name?.charAt(0)}</div>
                <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Selamat Bekerja,</p><p className="font-black text-sm">{session?.user?.name}</p></div>
             </div>
             <button onClick={() => setActiveTab('notifications')} className="relative p-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm"><Bell className="w-5 h-5 text-gray-500" /></button>
          </div>

          {renderContent()}
        </div>

        {showBarcodeScanner && <EnhancedBarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowBarcodeScanner(false)} />}

        <BottomNavigation 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onScanClick={() => setShowBarcodeScanner(true)} 
          darkMode={darkMode} 
        />

        {/* Modals tetap sama */}
        <ConfirmationModal isOpen={showSendConfirmModal} onClose={() => setShowSendConfirmModal(false)} onConfirm={handleConfirmSend} title="Konfirmasi" message="Kirim ke daftar tangguhkan?" confirmText="Ya" cancelText="Batal" variant="info" />
        <ConfirmationModal isOpen={showClearCartModal} onClose={() => setShowClearCartModal(false)} onConfirm={() => {clearCartFromContext(); setShowClearCartModal(false);}} title="Hapus Keranjang" message="Kosongkan keranjang belanja?" confirmText="Hapus" cancelText="Batal" variant="danger" />
        
        {/* Modal Catatan & Customer tetap diperlukan */}
        {showCustomerSelectionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4">
            <div className={`rounded-3xl shadow-2xl w-full max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center"><h3 className="text-xl font-black">Pilih Pelanggan</h3><button onClick={() => setShowCustomerSelectionModal(false)}><X /></button></div>
              <div className="p-6"><input type="text" placeholder="Cari member..." className={`w-full p-3 rounded-xl border mb-4 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50'}`} value={customerSearchTerm} onChange={(e) => setCustomerSearchTerm(e.target.value)} />
                <div className="max-h-40 overflow-y-auto space-y-2 mb-4">
                  {foundCustomers.map(c => <div key={c.id} onClick={() => setSelectedCustomerForSend(c)} className={`p-3 rounded-xl cursor-pointer ${selectedCustomerForSend?.id === c.id ? 'bg-purple-100 border-purple-500 border' : 'bg-gray-50 dark:bg-gray-700'}`}>{c.name}</div>)}
                </div>
                <button onClick={() => {setShowCustomerSelectionModal(false); setShowNoteModal(true);}} className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold">LANJUTKAN</button>
              </div>
            </div>
          </div>
        )}

        {showNoteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4">
            <div className={`rounded-3xl shadow-2xl w-full max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="p-6 border-b dark:border-gray-700"><h3 className="text-xl font-black">Catatan</h3></div>
              <div className="p-6"><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan untuk kasir..." className={`w-full h-32 p-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50'}`} /><div className="mt-4 flex gap-3"><button onClick={() => setShowNoteModal(false)} className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 rounded-xl font-bold">BATAL</button><button onClick={handleSendWithNote} className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold">KIRIM</button></div></div>
            </div>
          </div>
        )}

        <CartItemNoteModal isOpen={showCartItemNoteModal} onClose={() => setShowCartItemNoteModal(false)} onSave={addNoteToCartItem} item={currentCartItem} darkMode={darkMode} />
    </main>
  );
}

const Badge = ({ children, className }) => <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${className}`}>{children}</span>;

function AttendantPageWrapper() {
  return (
    <PelayanStateProvider>
      <AttendantDashboard />
    </PelayanStateProvider>
  );
}

export default AttendantPageWrapper;