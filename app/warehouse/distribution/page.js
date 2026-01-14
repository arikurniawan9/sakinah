'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useUserTheme } from '../../../components/UserThemeContext';
import Breadcrumb from '../../../components/Breadcrumb';
import DistributionReceiptModal from '../../../components/warehouse/DistributionReceiptModal';
import UserSelectionModal from '../../../components/shared/UserSelectionModal';
import ConfirmationModal from '../../../components/ConfirmationModal';
import ErrorBoundary from '../../../components/ErrorBoundary';

// New Hooks
import { useDistributionCart } from '../../../lib/hooks/warehouse/useDistributionCart';
import { useCachedDistributionProductSearch } from '../../../lib/hooks/warehouse/useCachedDistributionProductSearch';
import { useCachedWarehouseData } from '../../../lib/hooks/warehouse/useCachedWarehouseData';
import { useHotkeys } from '../../../lib/hooks/useHotkeys';


// New Components (Lazy Loaded)
import LazyDistributionProductSearch from '../../../components/warehouse/distribution/LazyDistributionProductSearch';
import LazyDistributionCart from '../../../components/warehouse/distribution/LazyDistributionCart';
import LazyDistributionDetails from '../../../components/warehouse/distribution/LazyDistributionDetails';
import DraftDistributionManager from '../../../components/warehouse/distribution/DraftDistributionManager';
import BarcodeScannerManager from '../../../components/warehouse/distribution/BarcodeScannerManager';

export default function WarehouseDistributionPage() {
  const { data: session } = useSession();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const searchRef = useRef(null);

  // State managed by the page
  const [selectedStore, setSelectedStore] = useState('');
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

  // New hooks for product search and cart management
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

  // Hotkeys setup
  const hotkeys = [
    {
      keys: 'alt+s',
      callback: () => searchRef.current?.focus(),
    },
    {
      keys: 'alt+enter',
      callback: () => {
        if (!isSubmitting && distributionItems.length > 0) {
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
  useHotkeys(hotkeys, [isSubmitting, distributionItems]);

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

  const submitDistribution = async () => {
    if (!selectedStore || distributionItems.length === 0) {
      setConfirmationMessage('Toko tujuan dan item distribusi wajib diisi.');
      setConfirmationCallback(null);
      setShowConfirmationModal(true);
      return;
    }

    // Konfirmasi sebelum submit
    setConfirmationMessage(`Apakah Anda yakin ingin membuat distribusi ke toko ${stores.find(s => s.id === selectedStore)?.name || 'terpilih'} dengan ${distributionItems.length} item?`);
    setConfirmationCallback(() => async () => {
      setIsSubmitting(true);
      try {
        const response = await fetch('/api/warehouse/distribution', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeId: selectedStore,
            distributionDate: distributionDate.toISOString(),
            items: distributionItems.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              purchasePrice: item.purchasePrice,
            })),
            distributedBy: selectedWarehouseUser?.id || session.user.id,
            notes: notes,
            status: 'PENDING_ACCEPTANCE',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Gagal membuat distribusi');
        }

        const result = await response.json();

        const receiptPayload = {
          id: result.distribution.id,
          invoiceNumber: result.distribution.invoiceNumber, // Include the invoice number
          store: stores.find(s => s.id === selectedStore),
          warehouse: { name: 'Gudang Pusat' },
          distributedByUser: warehouseUsers.find(u => u.id === selectedWarehouseUser) || session.user,
          distributedAt: distributionDate.toISOString(),
          items: distributionItems.map(item => ({ ...item, unitPrice: item.purchasePrice })),
          notes: notes,
          status: 'PENDING_ACCEPTANCE',
          totalAmount: cartTotal,
        };

        setReceiptData(receiptPayload);
        setShowReceiptModal(true);

        // Clear form after submission
        clearCart();
        setSelectedStore('');
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
      setSelectedStore('');
      setSelectedWarehouseUser(null);
      setNotes('');
      setDistributionDate(new Date());
    });
    setShowConfirmationModal(true);
  };

  const breadcrumbItems = [
    { title: 'Gudang', href: '/warehouse' },
    { title: 'Distribusi', href: '/warehouse/distribution' },
  ];

  return (
    <ProtectedRoute requiredRole="WAREHOUSE">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={breadcrumbItems} darkMode={darkMode} />
        <div className="mb-6">
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Distribusi Produk ke Toko
          </h1>
          <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Buat pengiriman produk dari gudang ke toko-toko dengan bantuan pelayan gudang.
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
                  selectedStore={selectedStore}
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
                    setSelectedStore(draft.storeId);
                    setNotes(draft.notes || '');
                  }}
                  onDeleteDraft={async (draftId) => {
                    // This will be handled inside the component
                  }}
                />
              </ErrorBoundary>
            </div>

            {/* Barcode Scanner Manager */}
            <BarcodeScannerManager
              products={availableProducts}
              addToCart={addToCart}
              darkMode={darkMode}
            />
          </div>

          {/* Distribution Details - Right side, top position */}
          <div>
            <ErrorBoundary darkMode={darkMode}>
              <LazyDistributionDetails
                stores={stores}
                warehouseUsers={warehouseUsers}
                selectedStore={selectedStore}
                setSelectedStore={setSelectedStore}
                selectedWarehouseUser={selectedWarehouseUser}
                setSelectedWarehouseUser={setSelectedWarehouseUser}
                notes={notes}
                setNotes={setNotes}
                onSubmit={submitDistribution}
                isSubmitting={isSubmitting}
                darkMode={darkMode}
                setIsUserModalOpen={setIsUserModalOpen}
              />
            </ErrorBoundary>
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
        onUserAdded={(newUser) => {
          // Tambahkan pengguna baru ke daftar pengguna gudang
          mutateUsers();
        }}
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
        title={confirmationCallback ? "Konfirmasi Distribusi" : "Peringatan"}
        message={confirmationMessage}
        confirmText={confirmationCallback ? "Ya, Distribusikan" : "OK"}
        cancelText="Batal"
        variant={confirmationCallback ? "info" : "warning"}
      />
    </ProtectedRoute>
  );
}
