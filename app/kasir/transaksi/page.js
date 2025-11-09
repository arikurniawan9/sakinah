// app/kasir/transaksi/page.js
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Save, History, X, DollarSign } from 'lucide-react'; // Import necessary icons

import ProtectedRoute from '../../../components/ProtectedRoute';
import { useDarkMode } from '../../../components/DarkModeContext';
import ProductSearch from '../../../components/kasir/transaksi/ProductSearch';
import TransactionCart from '../../../components/kasir/transaksi/TransactionCart';
import MemberSelection from '../../../components/kasir/transaksi/MemberSelection';
import PaymentSummary from '../../../components/kasir/transaksi/PaymentSummary';
import TransactionHeader from '../../../components/kasir/transaksi/TransactionHeader';
import AttendantSelection from '../../../components/kasir/transaksi/AttendantSelection';
import Receipt from '../../../components/kasir/transaksi/Receipt';
import ConfirmationModal from '../../../components/ConfirmationModal';
import Tooltip from '../../../components/Tooltip';
import { useReactToPrint } from 'react-to-print';


export default function CashierTransaction() {
  const { data: session } = useSession();
  const { darkMode } = useDarkMode();
  const router = useRouter();
  
  // State Management
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [attendants, setAttendants] = useState([]);
  const [selectedAttendant, setSelectedAttendant] = useState(null);
  const [defaultMember, setDefaultMember] = useState(null);
  const [payment, setPayment] = useState(0);
  const [calculation, setCalculation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isProductListLoading, setIsProductListLoading] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showAttendantsModal, setShowAttendantsModal] = useState(false);
  const [confirmingType, setConfirmingType] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [additionalDiscount, setAdditionalDiscount] = useState(0);

  // States for Suspend/Resume feature
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [suspendedSales, setSuspendedSales] = useState([]);
  const [suspendFormData, setSuspendFormData] = useState({ name: '', notes: '' });

  // States for Pay Debt feature
  const [isPayDebtModalOpen, setIsPayDebtModalOpen] = useState(false);
  const [debtSearchTerm, setDebtSearchTerm] = useState('');
  const [debtList, setDebtList] = useState([]);
  const [debtListLoading, setDebtListLoading] = useState(false);
  const [selectedDebtToPay, setSelectedDebtToPay] = useState(null);
  const [debtPaymentAmount, setDebtPaymentAmount] = useState(0);


  const receiptRef = useRef();

  const resetTransactionState = useCallback(() => {
    setCart([]);
    setSelectedMember(null);
    setSelectedAttendant(null);
    setPayment(0);
    setCalculation(null);
    setSearchTerm('');
    setProducts([]);
    setAdditionalDiscount(0);
    setSuspendFormData({ name: '', notes: '' });
  }, []);

  // --- HELPER & LOGIC FUNCTIONS ---

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTierPrice = useCallback((product, quantity) => {
    if (!product.priceTiers || product.priceTiers.length === 0) return 0;
    const sortedTiers = [...product.priceTiers].sort((a, b) => a.minQty - b.minQty);
    let applicablePrice = sortedTiers[0]?.price || 0;
    for (let i = sortedTiers.length - 1; i >= 0; i--) {
      if (quantity >= sortedTiers[i].minQty) {
        applicablePrice = sortedTiers[i].price;
        break;
      }
    }
    return applicablePrice;
  }, []);

  const handleInitiatePaidPayment = () => {
    if (!calculation) {
      alert('Keranjang belanja kosong!');
      return;
    }
    if (payment < calculation.grandTotal) {
      alert('Jumlah pembayaran kurang dari total tagihan.');
      return;
    }
    if (!loading) {
      setConfirmingType('PAID');
    }
  };

  const handleInitiateUnpaidPayment = () => {
    if (!calculation) {
      alert('Keranjang belanja kosong!');
      return;
    }
    if (!selectedMember || selectedMember.name === 'Pelanggan Umum') {
      alert('Pilih member spesifik untuk menyimpan sebagai hutang.');
      return;
    }
    if (!loading) {
      setConfirmingType('UNPAID');
    }
  };

  const processPayment = useCallback(async (transactionType) => {
    setConfirmingType(null);
    if (!session?.user?.id) {
      alert('Sesi pengguna tidak ditemukan.');
      return;
    }
    if (cart.length === 0) {
      alert('Keranjang belanja kosong!');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/transaksi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cashierId: session.user.id,
          attendantId: selectedAttendant?.id || null,
          memberId: selectedMember?.id || defaultMember?.id || null,
          items: cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: getTierPrice(item, item.quantity),
            discount: getTierPrice(item, 1) - getTierPrice(item, item.quantity),
          })),
          total: calculation.grandTotal,
          payment: payment,
          change: payment - calculation.grandTotal,
          tax: calculation.tax,
          discount: calculation.totalDiscount,
          additionalDiscount: additionalDiscount,
          transactionType: transactionType,
        })
      });
      const result = await response.json();
      if (response.ok) {
        if (transactionType === 'PAID') {
          const receiptPayload = {
            ...calculation,
            id: result.id,
            date: result.date,
            cashier: session.user,
            attendant: selectedAttendant,
            payment: payment,
            change: payment - calculation.grandTotal,
          };
          setReceiptData(receiptPayload);
        } else {
          alert(`Transaksi berhasil disimpan sebagai hutang untuk member: ${selectedMember.name}`);
        }
        resetTransactionState();
      } else {
        alert(`Gagal: ${result.error}`);
      }
    } catch (error) {
      alert('Terjadi kesalahan saat memproses pembayaran');
    } finally {
      setLoading(false);
    }
  }, [calculation, payment, session, selectedAttendant, selectedMember, cart, getTierPrice, defaultMember, additionalDiscount, resetTransactionState]);

  const handleOpenSuspendModal = () => {
    if (cart.length === 0) {
      alert('Keranjang kosong, tidak ada yang bisa ditangguhkan.');
      return;
    }
    setIsSuspendModalOpen(true);
  };

  const handleSuspendSale = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/suspended-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...suspendFormData,
          cartItems: cart,
          memberId: selectedMember?.id || null,
        }),
      });
      if (response.ok) {
        alert('Transaksi berhasil ditangguhkan.');
        resetTransactionState();
        setIsSuspendModalOpen(false);
      } else {
        const result = await response.json();
        alert(`Gagal menangguhkan transaksi: ${result.error}`);
      }
    } catch (error) {
      alert('Terjadi kesalahan saat menangguhkan transaksi.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResumeModal = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/suspended-sales');
      const data = await response.json();
      if (response.ok) {
        setSuspendedSales(data.suspendedSales);
        setIsResumeModalOpen(true);
      } else {
        alert(`Gagal mengambil data: ${data.error}`);
      }
    } catch (error) {
      alert('Terjadi kesalahan saat mengambil transaksi yang ditangguhkan.');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeSale = async (saleToResume) => {
    if (cart.length > 0) {
      if (!confirm('Keranjang saat ini akan diganti. Lanjutkan?')) {
        return;
      }
    }
    resetTransactionState();
    setCart(saleToResume.cartItems);
    if (saleToResume.memberId) {
      const memberToSelect = members.find(m => m.id === saleToResume.memberId);
      setSelectedMember(memberToSelect || null);
    }
    
    try {
      await fetch(`/api/suspended-sales?id=${saleToResume.id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to delete resumed sale, but continuing...', error);
    }
    
    setIsResumeModalOpen(false);
  };

  const handleOpenPayDebtModal = () => {
    setIsPayDebtModalOpen(true);
    setDebtSearchTerm('');
    setDebtList([]);
  };

  const handlePayDebt = async () => {
    if (!selectedDebtToPay || debtPaymentAmount <= 0) {
      alert('Pilih hutang dan masukkan jumlah bayar yang valid.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/laporan/piutang/bayar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receivableId: selectedDebtToPay.id,
          paymentAmount: debtPaymentAmount,
        }),
      });
      const result = await response.json();
      if (response.ok) {
        alert('Pembayaran hutang berhasil diproses.');
        setSelectedDebtToPay(null);
        setDebtPaymentAmount(0);
        // Refresh the list in the main modal
        const refreshResponse = await fetch(`/api/laporan/piutang?status=UNPAID,PARTIALLY_PAID&search=${debtSearchTerm}`);
        const refreshedData = await refreshResponse.json();
        setDebtList(refreshedData.receivables || []);
      } else {
        alert(`Gagal: ${result.error}`);
      }
    } catch (error) {
      alert('Terjadi kesalahan saat memproses pembayaran hutang.');
    } finally {
      setLoading(false);
    }
  };

  // --- HOOKS ---

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    onAfterPrint: () => setReceiptData(null),
  });

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (searchTerm.trim().length === 0) {
        setProducts([]);
        return;
      }
      setIsProductListLoading(true);
      try {
        const response = await fetch(`/api/produk?search=${encodeURIComponent(searchTerm)}&limit=20`);
        const data = await response.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsProductListLoading(false);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [membersRes, attendantsRes] = await Promise.all([
          fetch('/api/member'),
          fetch('/api/pelayan')
        ]);
        const membersData = await membersRes.json();
        const attendantsData = await attendantsRes.json();
        
        const allMembers = membersData.members || [];
        setMembers(allMembers);
        
        const generalCustomer = allMembers.find(m => m.name === 'Pelanggan Umum');
        setDefaultMember(generalCustomer);

        setAttendants(attendantsData.attendants || []);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    fetchInitialData();
  }, []);

  // Debounced search for debts
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!isPayDebtModalOpen) return;
      setDebtListLoading(true);
      try {
        const response = await fetch(`/api/laporan/piutang?status=UNPAID,PARTIALLY_PAID&search=${encodeURIComponent(debtSearchTerm)}`);
        const data = await response.json();
        if (response.ok) {
          setDebtList(data.receivables || []);
        } else {
          console.error('Failed to fetch debt list');
          setDebtList([]);
        }
      } catch (error) {
        console.error('Error fetching debt list:', error);
      } finally {
        setDebtListLoading(false);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [debtSearchTerm, isPayDebtModalOpen]);

  // Replicate button disabled logic here for shortcuts
  const grandTotal = calculation?.grandTotal || 0;
  const hasCalculation = !!calculation;
  const isPaidDisabled = loading || !hasCalculation || payment < grandTotal || !selectedAttendant;
  const isUnpaidDisabled = loading || !hasCalculation || !selectedMember || selectedMember.name === 'Pelanggan Umum' || payment >= grandTotal;

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.altKey) {
        switch (event.key.toLowerCase()) {
          case 'm': event.preventDefault(); setShowMembersModal(prev => !prev); break;
          case 'p': event.preventDefault(); setShowAttendantsModal(prev => !prev); break;
          case 'h': event.preventDefault(); router.push('/kasir'); break;
          case 'enter': event.preventDefault(); if (!isPaidDisabled) handleInitiatePaidPayment(); break;
          case 's': event.preventDefault(); if (!isUnpaidDisabled) handleInitiateUnpaidPayment(); break;
          case 't': event.preventDefault(); handleOpenSuspendModal(); break;
          case 'l': event.preventDefault(); handleOpenResumeModal(); break;
          case 'b': event.preventDefault(); handleOpenPayDebtModal(); break;
          default: break;
        }
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        if (selectedDebtToPay) setSelectedDebtToPay(null);
        else if (isPayDebtModalOpen) setIsPayDebtModalOpen(false);
        else if (confirmingType) setConfirmingType(null);
        else if (isSuspendModalOpen) setIsSuspendModalOpen(false);
        else if (isResumeModalOpen) setIsResumeModalOpen(false);
        else if (showMembersModal) setShowMembersModal(false);
        else if (showAttendantsModal) setShowAttendantsModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    calculation, payment, loading, confirmingType, selectedMember, 
    handleInitiatePaidPayment, handleInitiateUnpaidPayment, 
    isSuspendModalOpen, isResumeModalOpen, showMembersModal, showAttendantsModal, router,
    isPaidDisabled, isUnpaidDisabled, isPayDebtModalOpen, selectedDebtToPay
  ]);

  useEffect(() => {
    if (receiptData) {
      const timer = setTimeout(() => handlePrint(), 100);
      return () => clearTimeout(timer);
    }
  }, [receiptData, handlePrint]);

  useEffect(() => {
    if (cart.length === 0) {
      setCalculation(null);
      return;
    }
    let subtotal = 0;
    let itemDiscount = 0;
    const calculatedItems = cart.map(item => {
      const basePrice = getTierPrice(item, 1);
      const actualPrice = getTierPrice(item, item.quantity);
      const discountPerItem = basePrice - actualPrice;
      const itemSubtotal = actualPrice * item.quantity;
      const totalItemDiscount = discountPerItem * item.quantity;
      subtotal += itemSubtotal;
      itemDiscount += totalItemDiscount;
      return { ...item, originalPrice: basePrice, priceAfterItemDiscount: actualPrice, itemDiscount: totalItemDiscount, subtotal: itemSubtotal };
    });
    let memberDiscount = 0;
    if (selectedMember?.discount) {
      memberDiscount = (subtotal * selectedMember.discount) / 100;
    }
    const totalDiscount = itemDiscount + memberDiscount;
    const grandTotal = subtotal - memberDiscount;
    const finalGrandTotal = grandTotal - additionalDiscount;
    const finalTotalDiscount = totalDiscount + additionalDiscount;
    setCalculation({ items: calculatedItems, subTotal: subtotal, itemDiscount: itemDiscount, memberDiscount: memberDiscount, additionalDiscount: additionalDiscount, totalDiscount: finalTotalDiscount, tax: 0, grandTotal: Math.round(finalGrandTotal) });
  }, [cart, selectedMember, getTierPrice, additionalDiscount]);

  // --- CART LOGIC ---

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.productId === product.id);
    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      setCart(prevCart => [...prevCart, { productId: product.id, name: product.name, productCode: product.productCode, quantity: 1, stock: product.stock, priceTiers: product.priceTiers }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart => prevCart.map(item => {
      if (item.productId === productId) {
        if (newQuantity > item.stock) {
          console.warn(`Cannot add more ${item.name}. Stock limit reached.`);
          return { ...item, quantity: item.stock };
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const handleScan = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmedSearchTerm = searchTerm.trim();
      if (!trimmedSearchTerm) return;
      setIsProductListLoading(true);
      try {
        let response = await fetch(`/api/produk?productCode=${encodeURIComponent(trimmedSearchTerm)}`);
        let data = await response.json();
        let scannedProduct = data.products && data.products.length > 0 ? data.products[0] : null;
        if (!scannedProduct) {
          response = await fetch(`/api/produk?search=${encodeURIComponent(trimmedSearchTerm)}`);
          data = await response.json();
          scannedProduct = data.products.find(p => p.productCode.toLowerCase() === trimmedSearchTerm.toLowerCase() || p.name.toLowerCase() === trimmedSearchTerm.toLowerCase());
        }
        if (scannedProduct) {
          addToCart(scannedProduct);
          setSearchTerm('');
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

  return (
    <ProtectedRoute requiredRole="CASHIER">
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50'}`}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <TransactionHeader cashierName={session?.user?.name} />

          {/* Action Buttons */}
          <div className="flex justify-end mb-4">
            <div className="flex bg-gray-900 dark:bg-black w-fit h-10 items-center justify-around rounded-lg shadow-lg">
              <Tooltip content="Tangguhkan" position="bottom">
                <button
                  onClick={handleOpenSuspendModal}
                  disabled={cart.length === 0 || loading}
                  className="button outline-none border-none w-10 h-10 rounded-full bg-transparent flex items-center justify-center text-white transition-all ease-in-out duration-300 cursor-pointer hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-5 w-5" />
                </button>
              </Tooltip>
              <Tooltip content="Lanjutkan Transaksi" position="bottom">
                <button
                  onClick={handleOpenResumeModal}
                  disabled={loading}
                  className="button outline-none border-none w-10 h-10 rounded-full bg-transparent flex items-center justify-center text-white transition-all ease-in-out duration-300 cursor-pointer hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <History className="h-5 w-5" />
                </button>
              </Tooltip>
              <Tooltip content="Bayar Hutang" position="bottom">
                <button
                  onClick={handleOpenPayDebtModal}
                  disabled={loading}
                  className="button outline-none border-none w-10 h-10 rounded-full bg-transparent flex items-center justify-center text-white transition-all ease-in-out duration-300 cursor-pointer hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <DollarSign className="h-5 w-5" />
                </button>
              </Tooltip>
            </div>
          </div>
          <div className="flex justify-end text-xs text-gray-500 dark:text-gray-400 mt-1 px-2 space-x-4">
            <span>Tangguhkan (Alt+T)</span>
            <span>Lanjutkan Transaksi (Alt+L)</span>
            <span>Bayar Hutang (Alt+B)</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ProductSearch
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              handleScan={handleScan}
              products={products}
              addToCart={addToCart}
              isProductListLoading={isProductListLoading}
              darkMode={darkMode}
              getTierPrice={getTierPrice}
              total={calculation?.grandTotal || 0}
            />

            <div className="space-y-6">
              <MemberSelection
                selectedMember={selectedMember}
                onSelectMember={setSelectedMember}
                onRemoveMember={() => setSelectedMember(null)}
                members={members}
                darkMode={darkMode}
                isOpen={showMembersModal}
                onToggle={setShowMembersModal}
              />
              <AttendantSelection
                selectedAttendant={selectedAttendant}
                onSelectAttendant={setSelectedAttendant}
                onRemoveAttendant={() => setSelectedAttendant(null)}
                attendants={attendants}
                darkMode={darkMode}
                isOpen={showAttendantsModal}
                onToggle={setShowAttendantsModal}
              />
              <TransactionCart
                cart={calculation?.items || []}
                updateQuantity={updateQuantity}
                removeFromCart={removeFromCart}
                darkMode={darkMode}
              />
              <PaymentSummary
                calculation={calculation}
                payment={payment}
                setPayment={setPayment}
                initiatePaidPayment={handleInitiatePaidPayment}
                initiateUnpaidPayment={handleInitiateUnpaidPayment}
                loading={loading}
                darkMode={darkMode}
                additionalDiscount={additionalDiscount}
                setAdditionalDiscount={setAdditionalDiscount}
                sessionStatus={session?.status ?? 'loading'}
                selectedMember={selectedMember}
                selectedAttendant={selectedAttendant}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="printable-receipt">
        <Receipt ref={receiptRef} receiptData={receiptData} />
      </div>
      <ConfirmationModal
        isOpen={confirmingType !== null}
        onClose={() => setConfirmingType(null)}
        onConfirm={() => processPayment(confirmingType)}
        title={confirmingType === 'PAID' ? 'Konfirmasi Pembayaran' : 'Konfirmasi Simpan Hutang'}
        message={confirmingType === 'PAID' 
          ? 'Apakah Anda yakin ingin melanjutkan pembayaran lunas?' 
          : `Simpan transaksi ini sebagai hutang untuk member "${selectedMember?.name}"?`}
        confirmText={confirmingType === 'PAID' ? 'Bayar Lunas' : 'Simpan Hutang'}
        cancelText="Batal"
        darkMode={darkMode}
        isLoading={loading}
      />

      {/* Suspend Modal */}
      {isSuspendModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <div className={`relative rounded-xl shadow-lg w-full sm:max-w-md mx-auto my-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold">Tangguhkan Transaksi</h3>
                <button onClick={() => setIsSuspendModalOpen(false)}><X size={24} /></button>
              </div>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="suspendName" className="block text-sm font-medium mb-1">Nama/Label (Opsional)</label>
                  <input
                    type="text"
                    id="suspendName"
                    value={suspendFormData.name}
                    onChange={(e) => setSuspendFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    placeholder="Contoh: Ibu Baju Merah"
                  />
                </div>
                <div>
                  <label htmlFor="suspendNotes" className="block text-sm font-medium mb-1">Catatan (Opsional)</label>
                  <textarea
                    id="suspendNotes"
                    rows="3"
                    value={suspendFormData.notes}
                    onChange={(e) => setSuspendFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  ></textarea>
                </div>
              </div>
            </div>
            <div className={`px-6 py-4 flex flex-row-reverse gap-3 ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
              <button onClick={handleSuspendSale} disabled={loading} className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50">
                {loading ? 'Menyimpan...' : 'Simpan & Tangguhkan'}
              </button>
              <button onClick={() => setIsSuspendModalOpen(false)} className={`px-4 py-2 rounded-md ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resume Modal */}
      {isResumeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <div className={`relative rounded-xl shadow-lg w-full sm:max-w-lg md:max-w-2xl mx-auto my-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold">Lanjutkan Transaksi</h3>
                <button onClick={() => setIsResumeModalOpen(false)}><X size={24} /></button>
              </div>
              <div className="mt-4 max-h-96 overflow-y-auto">
                {loading ? <p>Memuat...</p> : (
                  <ul className="space-y-2">
                    {suspendedSales.length > 0 ? suspendedSales.map(sale => (
                      <li key={sale.id} className={`p-3 rounded-md flex justify-between items-center ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <div>
                          <p className="font-semibold">{sale.name || `Transaksi #${sale.id.substring(0, 6)}`}</p>
                          <p className="text-sm text-gray-500">{sale.cartItems.length} item - {new Date(sale.createdAt).toLocaleString('id-ID')}</p>
                          {sale.notes && <p className="text-xs italic text-gray-400 mt-1">"{sale.notes}"</p>}
                        </div>
                        <button onClick={() => handleResumeSale(sale)} className="px-3 py-1 bg-cyan-500 text-white text-sm rounded-md hover:bg-cyan-600">
                          Lanjutkan
                        </button>
                      </li>
                    )) : <p>Tidak ada transaksi yang ditangguhkan.</p>}
                  </ul>
                )}
              </div>
            </div>
            <div className={`px-6 py-4 flex flex-row-reverse gap-3 ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
              <button onClick={() => setIsResumeModalOpen(false)} className={`px-4 py-2 rounded-md ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Debt Modals */}
      {isPayDebtModalOpen && !selectedDebtToPay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <div className={`relative rounded-xl shadow-lg w-full sm:max-w-xl md:max-w-3xl mx-auto my-4 flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6 border-b dark:border-gray-700">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold">Bayar Hutang Member</h3>
                <button onClick={() => setIsPayDebtModalOpen(false)}><X size={24} /></button>
              </div>
              <input
                type="text"
                placeholder="Cari nama member..."
                value={debtSearchTerm}
                onChange={(e) => setDebtSearchTerm(e.target.value)}
                className={`w-full mt-4 px-3 py-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                autoFocus
              />
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {debtListLoading ? <p>Mencari data piutang...</p> : (
                <div className="space-y-3">
                  {debtList.length > 0 ? debtList.map(debt => (
                    <div key={debt.id} className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{debt.member.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Nota: {debt.sale.id}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Tanggal: {new Date(debt.sale.date).toLocaleDateString('id-ID')}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-red-500">{formatCurrency(debt.amountDue - debt.amountPaid)}</p>
                          <p className="text-xs text-gray-500">dari {formatCurrency(debt.amountDue)}</p>
                        </div>
                        <button 
                          onClick={() => {
                            setDebtPaymentAmount(debt.amountDue - debt.amountPaid); // Pre-fill payment amount
                            setSelectedDebtToPay(debt);
                          }}
                          className="px-4 py-2 bg-green-500 text-white text-sm rounded-md hover:bg-green-600"
                        >
                          Bayar
                        </button>
                      </div>
                    </div>
                  )) : <p className="text-center text-gray-500">Tidak ada piutang yang ditemukan.</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Final Payment Confirmation for Debt */}
      {selectedDebtToPay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <div className={`relative rounded-xl shadow-lg w-full sm:max-w-sm mx-auto my-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6">
              <h3 className="text-lg font-bold mb-2">Pembayaran Hutang</h3>
              <p className="text-sm mb-1">Member: <span className="font-semibold">{selectedDebtToPay.member.name}</span></p>
              <p className="text-sm mb-4">Sisa Hutang: <span className="font-semibold">{formatCurrency(selectedDebtToPay.amountDue - selectedDebtToPay.amountPaid)}</span></p>
              <div>
                <label htmlFor="debtPayment" className="block text-sm font-medium mb-1">Jumlah Bayar</label>
                <input
                  type="number"
                  id="debtPayment"
                  value={debtPaymentAmount}
                  onChange={(e) => setDebtPaymentAmount(Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && !loading && handlePayDebt()}
                />
              </div>
            </div>
            <div className={`px-6 py-4 flex flex-row-reverse gap-3 ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
              <button onClick={handlePayDebt} disabled={loading || debtPaymentAmount <= 0 || debtPaymentAmount > (selectedDebtToPay.amountDue - selectedDebtToPay.amountPaid)} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50">
                {loading ? 'Memproses...' : 'Proses Pembayaran'}
              </button>
              <button onClick={() => setSelectedDebtToPay(null)} className={`px-4 py-2 rounded-md ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}