// app/warehouse/distribution/multi-store/page.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import { useUserTheme } from '../../../../components/UserThemeContext';
import Breadcrumb from '../../../../components/Breadcrumb';
import DistributionReceiptModal from '../../../../components/warehouse/DistributionReceiptModal';
import UserSelectionModal from '../../../../components/shared/UserSelectionModal';
import ConfirmationModal from '../../../../components/ConfirmationModal';
import ErrorBoundary from '../../../../components/ErrorBoundary';

// Hooks
import { useDistributionCart } from '../../../../lib/hooks/warehouse/useDistributionCart';
import { useCachedDistributionProductSearch } from '../../../../lib/hooks/warehouse/useCachedDistributionProductSearch';
import { useCachedWarehouseData } from '../../../../lib/hooks/warehouse/useCachedWarehouseData';
import { useHotkeys } from '../../../../lib/hooks/useHotkeys';

// Components
import LazyDistributionProductSearch from '../../../../components/warehouse/distribution/LazyDistributionProductSearch';
import LazyDistributionCart from '../../../../components/warehouse/distribution/LazyDistributionCart';
import DraftDistributionManager from '../../../../components/warehouse/distribution/DraftDistributionManager';
import DistributionTemplateManager from '../../../../components/warehouse/distribution/DistributionTemplateManager';

export default function MultiStoreDistributionPage() {
  const { data: session } = useSession();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const searchRef = useRef(null);

  // State untuk multiple stores selection
  const [selectedStores, setSelectedStores] = useState([]);
  const [selectedWarehouseUser, setSelectedWarehouseUser] = useState(null);
  const [notes, setNotes] = useState('');
  const [distributionDate, setDistributionDate] = useState(new Date());

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [confirmationCallback, setConfirmationCallback] = useState(null);

  // Hooks for product search and cart management
  const {
    products: availableProducts,
    loading: productsLoading,
    searchTerm,
    setSearchTerm,
    loadMore,
    hasMore,
    refresh: refreshProducts,
  } = useCachedDistributionProductSearch();

  const {
    items: distributionItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
  } = useDistributionCart();

  // Hook for cached warehouse data
  const {
    stores,
    warehouseUsers,
    isLoading: warehouseDataLoading,
    hasError: warehouseDataError,
    mutateStores,
    mutateUsers,
  } = useCachedWarehouseData();

  // Filter stores - exclude warehouse
  const regularStores = stores.filter(store => 
    !store.description || !store.description.includes('Gudang pusat')
  );

  // Hotkeys setup
  const hotkeys = [
    {
      keys: 'alt+s',
      callback: () => searchRef.current?.focus(),
    },
    {
      keys: 'alt+enter',
      callback: () => {
        if (!isSubmitting && distributionItems.length > 0 && selectedStores.length > 0) {
          submitDistribution();
        }
      },
    },
    {
      keys: 'alt+p',
      callback: () => {
        // Open user selection modal for attendant selection
        setIsUserModalOpen(true);
      },
    },
    {
      keys: 'alt+c',
      callback: () => {
        // Clear all inputs
        clearAll();
      },
    },
  ];
  useHotkeys(hotkeys, [isSubmitting, distributionItems, selectedStores]);

  // ESC key to close modals
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        setIsUserModalOpen(false);
        setShowReceiptModal(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, []);

  // Handle error from cached data
  useEffect(() => {
    if (warehouseDataError) {
      console.error('Error loading warehouse data:', warehouseDataError);
    }
  }, [warehouseDataError]);

  const toggleStoreSelection = (storeId) => {
    setSelectedStores(prev => 
      prev.includes(storeId) 
        ? prev.filter(id => id !== storeId) 
        : [...prev, storeId]
    );
  };

  const submitDistribution = async () => {
    if (selectedStores.length === 0 || distributionItems.length === 0) {
      setConfirmationMessage('Minimal satu toko tujuan dan item distribusi wajib diisi.');
      setConfirmationCallback(null);
      setShowConfirmationModal(true);
      return;
    }

    // Konfirmasi sebelum submit
    setConfirmationMessage(`Apakah Anda yakin ingin membuat distribusi ke ${selectedStores.length} toko dengan ${distributionItems.length} item?`);
    setConfirmationCallback(() => async () => {
      setIsSubmitting(true);
      try {
        const response = await fetch('/api/warehouse/distribution/multi-store', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeIds: selectedStores,
            distributionDate: distributionDate.toISOString(),
            items: distributionItems.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              purchasePrice: item.purchasePrice,
            })),
            distributedBy: selectedWarehouseUser?.id || session.user.id,
            notes: notes,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Gagal membuat distribusi multi-toko');
        }

        const result = await response.json();

        // Prepare receipt data for multiple distributions
        const receiptPayload = {
          id: 'MULTI-' + Date.now(), // ID unik untuk distribusi multi-toko
          invoiceNumber: 'MULTI-' + new Date().toISOString().slice(0, 10).replace(/-/g, ''),
          stores: selectedStores.map(storeId => 
            stores.find(s => s.id === storeId)
          ),
          warehouse: { name: 'Gudang Pusat' },
          distributedByUser: warehouseUsers.find(u => u.id === selectedWarehouseUser) || session.user,
          distributedAt: distributionDate.toISOString(),
          items: distributionItems,
          notes: notes,
          status: 'PENDING_ACCEPTANCE',
          totalAmount: cartTotal,
          isMultiStore: true,
        };

        setReceiptData(receiptPayload);
        setShowReceiptModal(true);

        // Clear form after submission
        clearCart();
        setSelectedStores([]);
        setSelectedWarehouseUser('');
        setNotes('');
        setDistributionDate(new Date());

        // Refresh cached data after successful distribution
        refreshProducts();
        mutateStores();
        mutateUsers();

      } catch (err) {
        setConfirmationMessage('Error: ' + err.message);
        setConfirmationCallback(null);
        setShowConfirmationModal(true);
      } finally {
        setIsSubmitting(false);
      }
    });
    setShowConfirmationModal(true);
  };

  // Fungsi untuk membersihkan semua isian
  const clearAll = () => {
    setConfirmationMessage('Apakah Anda yakin ingin membersihkan semua isian? Tindakan ini akan mengosongkan keranjang dan semua pilihan.');
    setConfirmationCallback(() => () => {
      clearCart();
      setSelectedStores([]);
      setSelectedWarehouseUser(null);
      setNotes('');
      setDistributionDate(new Date());
    });
    setShowConfirmationModal(true);
  };

  const breadcrumbItems = [
    { title: 'Gudang', href: '/warehouse' },
    { title: 'Distribusi', href: '/warehouse/distribution' },
    { title: 'Multi-Toko', href: '/warehouse/distribution/multi-store' },
  ];

  return (
    <ProtectedRoute requiredRole="WAREHOUSE">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={breadcrumbItems} darkMode={darkMode} />
        <div className="mb-6">
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Distribusi Multi-Toko
          </h1>
          <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Buat pengiriman produk dari gudang ke beberapa toko sekaligus.
          </p>
          <div className={`mt-2 text-xs flex flex-wrap items-center gap-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            <span className="flex items-center gap-1"><strong className="border rounded px-1.5 py-0.5">Alt + S</strong> Fokus Cari</span>
            <span className="flex items-center gap-1"><strong className="border rounded px-1.5 py-0.5">Alt + P</strong> Pilih Pelayan</span>
            <span className="flex items-center gap-1"><strong className="border rounded px-1.5 py-0.5">Alt + Enter</strong> Simpan</span>
            <span className="flex items-center gap-1"><strong className="border rounded px-1.5 py-0.5">Alt + C</strong> Bersihkan Semua</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Search - Span 2 columns */}
          <div className="lg:col-span-2">
            <div className="relative" style={{zIndex: 10}}>
              <ErrorBoundary darkMode={darkMode}>
                <LazyDistributionProductSearch
                  ref={searchRef}
                  products={availableProducts}
                  loading={productsLoading}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  addToCart={addToCart}
                  loadMore={loadMore}
                  hasMore={hasMore}
                  darkMode={darkMode}
                />
              </ErrorBoundary>
            </div>

            {/* Distribution Cart as Table - Below search */}
            <div className="mt-6">
              <ErrorBoundary darkMode={darkMode}>
                <LazyDistributionCart
                  items={distributionItems}
                  updateQuantity={updateQuantity}
                  removeFromCart={removeFromCart}
                  cartTotal={cartTotal}
                  darkMode={darkMode}
                />
              </ErrorBoundary>
            </div>
            
            {/* Draft Distribution Manager */}
            <div className="mt-6">
              <ErrorBoundary darkMode={darkMode}>
                <DraftDistributionManager
                  items={distributionItems}
                  selectedStore={selectedStores.length > 0 ? selectedStores[0] : null}
                  notes={notes}
                  darkMode={darkMode}
                  onSaveDraft={async () => {
                    // This will be handled inside the component
                  }}
                  onLoadDraft={(draft) => {
                    // Load the draft items into the cart
                    clearCart();
                    draft.items.forEach(item => {
                      addToCart({
                        id: item.productId,
                        Product: item.product,
                        quantity: item.quantity,
                        purchasePrice: item.purchasePrice,
                        stock: item.quantity, // This might need adjustment based on actual stock
                      });
                    });
                    setSelectedStores([draft.storeId]);
                    setNotes(draft.notes || '');
                  }}
                  onDeleteDraft={async (draftId) => {
                    // This will be handled inside the component
                  }}
                />
              </ErrorBoundary>
            </div>
            
            {/* Template Distribution Manager */}
            <div className="mt-6">
              <ErrorBoundary darkMode={darkMode}>
                <DistributionTemplateManager
                  items={distributionItems}
                  selectedStore={selectedStores.length > 0 ? selectedStores[0] : null}
                  notes={notes}
                  darkMode={darkMode}
                  onLoadTemplate={(template) => {
                    // Load the template items into the cart
                    clearCart();
                    template.data.items.forEach(item => {
                      addToCart({
                        id: item.productId,
                        Product: { id: item.productId, name: item.name, productCode: item.productCode },
                        quantity: item.quantity,
                        purchasePrice: item.purchasePrice,
                        stock: item.quantity, // This might need adjustment based on actual stock
                      });
                    });
                    setSelectedStores([template.storeId]);
                    setNotes(template.data.notes || '');
                  }}
                />
              </ErrorBoundary>
            </div>
          </div>

          {/* Multi-Store Distribution Details - Right side */}
          <div>
            <div className={`p-4 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="space-y-4">
                {/* Store Selector - Multi-select */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Toko Tujuan (Pilih Beberapa)
                  </label>
                  <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-2">
                    {regularStores.map(store => (
                      <div key={store.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`store-${store.id}`}
                          checked={selectedStores.includes(store.id)}
                          onChange={() => toggleStoreSelection(store.id)}
                          className={`h-4 w-4 rounded ${
                            darkMode 
                              ? 'border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500' 
                              : 'border-gray-300 text-purple-600 focus:ring-purple-500'
                          }`}
                        />
                        <label 
                          htmlFor={`store-${store.id}`} 
                          className={`ml-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                          {store.name}
                        </label>
                      </div>
                    ))}
                  </div>
                  {selectedStores.length > 0 && (
                    <div className={`mt-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {selectedStores.length} toko dipilih
                    </div>
                  )}
                </div>

                {/* User Selector Button */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Pelayan Gudang
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsUserModalOpen(true)}
                    className={`w-full p-2 border rounded-md text-left flex justify-between items-center ${
                      darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                    }`}
                  >
                    <span>{selectedWarehouseUser ? selectedWarehouseUser.code ? `${selectedWarehouseUser.name} (${selectedWarehouseUser.code})` : selectedWarehouseUser.name : 'Pilih Pelayan'}</span>
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                {/* Distribution Date */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Tanggal Distribusi
                  </label>
                  <input
                    type="date"
                    value={distributionDate.toISOString().split('T')[0]}
                    onChange={(e) => setDistributionDate(new Date(e.target.value))}
                    className={`w-full p-2 border rounded-md ${
                      darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                    }`}
                  />
                </div>

                {/* Notes Textarea */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Catatan
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className={`w-full p-2 border rounded-md ${
                      darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                    }`}
                    placeholder="Catatan tambahan untuk distribusi ke toko..."
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    onClick={submitDistribution}
                    disabled={isSubmitting || selectedStores.length === 0 || distributionItems.length === 0}
                    className={`w-full flex items-center justify-center px-4 py-3 rounded-lg text-sm font-medium text-white ${
                      isSubmitting || selectedStores.length === 0 || distributionItems.length === 0
                        ? 'bg-gray-500 cursor-not-allowed'
                        : darkMode
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                    } shadow-md hover:shadow-lg`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Memproses...
                      </>
                    ) : (
                      <>
                        Distribusikan ke {selectedStores.length} Toko
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Distribution Receipt Modal */}
      <DistributionReceiptModal
        distributionData={receiptData}
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
      />

      <UserSelectionModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        users={warehouseUsers}
        onSelectUser={setSelectedWarehouseUser}
        darkMode={darkMode}
      />

      <ConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        onConfirm={() => {
          if (confirmationCallback) {
            confirmationCallback();
          }
          setShowConfirmationModal(false);
        }}
        title={confirmationCallback ? "Konfirmasi Distribusi Multi-Toko" : "Peringatan"}
        message={confirmationMessage}
        confirmText={confirmationCallback ? "Ya, Distribusikan" : "OK"}
        cancelText="Batal"
        variant={confirmationCallback ? "info" : "warning"}
      />
    </ProtectedRoute>
  );
}