'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Search, PackageX, Package, Calendar, User, CreditCard, 
  AlertTriangle, CheckCircle, XCircle, Clock, Plus, X, 
  Home, ChevronRight, ChevronLeft, RefreshCcw, Info,
  ShoppingBag, ArrowRight, Receipt, MessageSquare,
  UserCheck, UserCog, Ban, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useUserTheme } from '@/components/UserThemeContext';
import Breadcrumb from '@/components/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import SuccessModal from '@/components/SuccessModal';

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function CashierReturnProductPage() {
  const { userTheme } = useUserTheme();
  const router = useRouter();
  const { data: session } = useSession();
  
  // State Management
  const [currentStep, setCurrentStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  const [invoiceData, setInvoiceData] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [selectedReason, setSelectedReason] = useState('');
  const [returnNotes, setReturnNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const searchInputRef = useRef(null);
  const breadcrumbItems = [
    { title: 'Kasir', href: '/kasir' },
    { title: 'Retur Produk', href: '/kasir/retur-produk' }
  ];

  // Powerful Categories Configuration
  const returnCategories = [
    { id: 'PRODUCT_DEFECT', label: 'Cacat Produk', desc: 'Barang rusak atau cacat fisik', icon: <AlertTriangle className="w-6 h-6" />, color: 'red' },
    { id: 'WRONG_SELECTION', label: 'Salah Pilih', desc: 'Pelanggan salah memilih barang', icon: <ShoppingBag className="w-6 h-6" />, color: 'blue' },
    { id: 'EXPIRED', label: 'Kadaluarsa', desc: 'Produk sudah melewati batas waktu', icon: <Ban className="w-6 h-6" />, color: 'amber' },
    { id: 'OTHERS', label: 'Lainnya', desc: 'Alasan pengembalian lainnya', icon: <Plus className="w-6 h-6" />, color: 'gray' },
  ];

  // Search Logic
  useEffect(() => {
    if (debouncedSearchTerm.length > 2) {
      performSearch(debouncedSearchTerm);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [debouncedSearchTerm]);

  const performSearch = async (term) => {
    setSearching(true);
    try {
      const response = await fetch(`/api/kasir/transaksi?search=${encodeURIComponent(term)}`);
      const result = await response.json();
      if (response.ok) {
        setSearchResults(result.sales || []);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleInvoiceSelect = (invoice) => {
    setInvoiceData(invoice);
    const initialItems = invoice.items.map(item => ({
      id: `${invoice.id}-${item.productId}`,
      productId: item.productId,
      name: item.productName,
      price: item.price,
      quantity: item.quantity,
      returnQuantity: 0,
      isSelected: false
    }));
    setReturnItems(initialItems);
    setShowSearchResults(false);
    setSearchTerm('');
    setCurrentStep(2);
  };

  const toggleItemSelection = (itemId) => {
    setReturnItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, isSelected: !item.isSelected, returnQuantity: !item.isSelected ? 1 : 0 } 
        : item
    ));
  };

  const handleQuantityChange = (itemId, val) => {
    const quantity = parseInt(val) || 0;
    setReturnItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, returnQuantity: Math.max(0, Math.min(quantity, item.quantity)) } 
        : item
    ));
  };

  const calculateReturnTotal = () => {
    return returnItems.reduce((total, item) => 
      item.isSelected ? total + (item.price * item.returnQuantity) : total, 0
    );
  };

  const handleSubmitReturn = async () => {
    const selectedItems = returnItems.filter(item => item.isSelected && item.returnQuantity > 0);
    if (selectedItems.length === 0) return alert('Pilih minimal satu item untuk diretur');
    if (!selectedReason) return alert('Pilih alasan retur');

    setLoading(true);
    try {
      for (const item of selectedItems) {
        const response = await fetch('/api/return-products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeId: session?.user?.storeId,
            transactionId: invoiceData.id,
            productId: item.productId,
            attendantId: invoiceData.attendantId || session?.user?.id,
            reason: selectedReason,
            category: selectedReason,
            notes: returnNotes
          }),
        });
        if (!response.ok) throw new Error('Gagal memproses permintaan retur');
      }
      setSuccessMessage('Permintaan retur berhasil diajukan dan sedang menunggu persetujuan Admin');
      setShowSuccessModal(true);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setShowSuccessModal(false);
    setInvoiceData(null);
    setReturnItems([]);
    setSelectedReason('');
    setReturnNotes('');
    setSearchTerm('');
    setCurrentStep(1);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  return (
    <ProtectedRoute requiredRole="CASHIER">
      <div className={`min-h-screen w-full px-4 sm:px-6 lg:px-8 py-6 ${userTheme.darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-6xl mx-auto">
          <Breadcrumb items={breadcrumbItems} darkMode={userTheme.darkMode} basePath="/kasir" />

          <div className="mt-4 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className={`text-3xl font-extrabold tracking-tight ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                Retur Produk
              </h1>
              <p className={`mt-2 text-lg ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Proses pengembalian barang dengan data yang akurat dan transparan.
              </p>
            </div>
            
            <div className="flex items-center space-x-4 bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-xl ring-1 ring-gray-100 dark:ring-gray-700">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm transition-all ${
                      currentStep === step ? 'bg-blue-600 text-white shadow-lg shadow-blue-400/50 scale-110' : 
                      currentStep > step ? 'bg-green-500 text-white shadow-lg shadow-green-400/50' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                    }`}
                  >
                    {currentStep > step ? <CheckCircle className="w-5 h-5" /> : step}
                  </div>
                  {step < 3 && <div className="w-10 h-px bg-gray-200 dark:bg-gray-700 mx-2" />}
                </div>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* STEP 1: SEARCH */}
            {currentStep === 1 && (
              <motion.div key="step1" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
                <Card className="overflow-hidden border-none shadow-2xl rounded-3xl bg-white dark:bg-gray-800 ring-1 ring-black/5">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-10 pb-16">
                    <CardTitle className="text-2xl font-black">Cari Transaksi</CardTitle>
                    <CardDescription className="text-blue-100 font-medium">Masukkan nomor invoice atau nama pelanggan</CardDescription>
                  </CardHeader>
                  <CardContent className="-mt-10 px-10 pb-10">
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                        {searching ? <RefreshCcw className="h-6 w-6 text-blue-500 animate-spin" /> : <Search className="h-6 w-6 text-gray-400 group-focus-within:text-blue-500 transition-colors" />}
                      </div>
                      <Input
                        ref={searchInputRef}
                        autoFocus
                        placeholder="Ketik Nomor Invoice atau Nama Member..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-16 py-9 text-xl rounded-[1.5rem] border-none shadow-2xl focus:ring-4 focus:ring-blue-500/10 transition-all dark:bg-gray-700 dark:text-white ring-1 ring-black/5"
                      />
                    </div>

                    <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {searchResults.map((invoice) => (
                        <motion.div whileHover={{ scale: 1.02, y: -5 }} whileTap={{ scale: 0.98 }} key={invoice.id} onClick={() => handleInvoiceSelect(invoice)}
                          className={`p-6 rounded-2xl cursor-pointer border-2 transition-all shadow-lg ${userTheme.darkMode ? 'bg-gray-800 border-gray-700 hover:border-blue-500' : 'bg-white border-gray-50 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/10'}`}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200 px-3 py-1 font-black text-xs uppercase tracking-wider">
                              {invoice.invoiceNumber}
                            </Badge>
                            <span className="text-xl font-black text-blue-600 tracking-tight">{formatCurrency(invoice.totalAmount)}</span>
                          </div>
                          <div className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                               <User className="w-5 h-5 mr-3 text-amber-500" /> 
                               <span className="font-bold text-gray-800 dark:text-gray-200">
                                  {invoice.customerName || 'Pelanggan Umum'} 
                                  <Badge className="ml-2 bg-amber-50 text-amber-600 border-none text-[10px] py-0">{invoice.customerCode || '-'}</Badge>
                               </span>
                            </div>
                            <div className="flex items-center">
                               <UserCog className="w-5 h-5 mr-3 text-blue-500" /> 
                               <span className="font-medium">Kasir: <strong className="text-gray-700 dark:text-gray-300">{invoice.cashierName}</strong></span>
                               <Badge className="ml-2 bg-blue-50 text-blue-600 border-none text-[10px] py-0">{invoice.cashierCode || '-'}</Badge>
                            </div>
                            <div className="flex items-center">
                               <UserCheck className="w-5 h-5 mr-3 text-green-500" /> 
                               <span className="font-medium">Pelayan: <strong className="text-gray-700 dark:text-gray-300">{invoice.attendantName || '-'}</strong></span>
                               <Badge className="ml-2 bg-green-50 text-green-600 border-none text-[10px] py-0">{invoice.attendantCode || '-'}</Badge>
                            </div>
                            <div className="flex items-center pt-3 border-t dark:border-gray-700"><Calendar className="w-5 h-5 mr-3 text-gray-400" /> <span>{formatDate(invoice.date)}</span></div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* STEP 2: SELECT ITEMS & CATEGORY */}
            {currentStep === 2 && invoiceData && (
              <motion.div key="step2" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  {/* Powerful Header Info */}
                  <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 ring-1 ring-black/5">
                    <div className="flex flex-col md:flex-row justify-between gap-6 mb-8 pb-8 border-b dark:border-gray-700">
                       <div className="flex items-center gap-5">
                          <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-2xl shadow-inner">
                            <Receipt className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] mb-1.5">Referensi Invoice</p>
                            <h3 className="text-3xl font-black text-gray-900 dark:text-white leading-none tracking-tight">{invoiceData.invoiceNumber}</h3>
                            <p className="text-sm text-gray-500 mt-3 flex items-center font-medium"><Calendar className="w-4 h-4 mr-1.5" /> {formatDate(invoiceData.date)}</p>
                          </div>
                       </div>
                       <div className="bg-blue-600 p-6 rounded-2xl text-white text-right md:min-w-[220px] shadow-2xl shadow-blue-500/30 ring-4 ring-blue-500/20">
                          <p className="text-xs font-bold text-blue-100 uppercase tracking-widest mb-1">Total Transaksi</p>
                          <p className="text-3xl font-black tracking-tighter">{formatCurrency(invoiceData.totalAmount)}</p>
                       </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md">
                          <User className="w-8 h-8 text-amber-500" />
                          <div>
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Pelanggan</p>
                             <p className="font-bold dark:text-white truncate">{invoiceData.customerName || 'Umum'}</p>
                             <Badge className="bg-amber-100 text-amber-700 border-none text-[9px] font-black uppercase py-0 px-1.5 mt-1">{invoiceData.customerCode || '-'}</Badge>
                          </div>
                       </div>
                       <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md">
                          <UserCog className="w-8 h-8 text-blue-500" />
                          <div>
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Kasir</p>
                             <p className="font-bold dark:text-white truncate">{invoiceData.cashierName}</p>
                             <Badge className="bg-blue-100 text-blue-700 border-none text-[9px] font-black uppercase py-0 px-1.5 mt-1">{invoiceData.cashierCode || '-'}</Badge>
                          </div>
                       </div>
                       <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md">
                          <UserCheck className="w-8 h-8 text-green-500" />
                          <div>
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Pelayan</p>
                             <p className="font-bold dark:text-white truncate">{invoiceData.attendantName || '-'}</p>
                             <Badge className="bg-green-100 text-green-700 border-none text-[9px] font-black uppercase py-0 px-1.5 mt-1">{invoiceData.attendantCode || '-'}</Badge>
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Item List */}
                  <Card className="border-none shadow-2xl overflow-hidden rounded-3xl bg-white dark:bg-gray-800 ring-1 ring-black/5">
                    <CardHeader className="bg-gray-50 dark:bg-gray-800/50 p-8 border-b dark:border-gray-700">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-xl font-black text-gray-800 dark:text-white tracking-tight">Daftar Barang Belanja</CardTitle>
                        <Badge className="px-4 py-2 bg-blue-600 text-white border-none rounded-xl text-sm font-black shadow-lg shadow-blue-500/20">
                          {returnItems.filter(i => i.isSelected).length} Barang Terpilih
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y dark:divide-gray-700">
                        {returnItems.map((item) => (
                          <div key={item.id} className={`p-6 flex items-center gap-6 transition-all ${item.isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/30'}`}>
                            <div className="relative flex-shrink-0">
                               <input type="checkbox" checked={item.isSelected} onChange={() => toggleItemSelection(item.id)} className="w-7 h-7 rounded-xl border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer shadow-sm transition-all" />
                            </div>
                            <div className="flex-grow">
                              <h4 className={`text-lg font-black tracking-tight ${item.isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>{item.name}</h4>
                              <div className="flex items-center gap-3 mt-1.5">
                                 <span className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300 shadow-sm">{formatCurrency(item.price)}</span>
                                 <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Qty: {item.quantity} Unit</span>
                              </div>
                            </div>
                            {item.isSelected && (
                              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 ring-4 ring-blue-500/5">
                                <button onClick={() => handleQuantityChange(item.id, item.returnQuantity - 1)} className="w-10 h-10 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-xl transition-colors shadow-sm border dark:border-gray-700"><X className="w-5 h-5" /></button>
                                <div className="px-5 text-center">
                                   <input type="number" value={item.returnQuantity} onChange={(e) => handleQuantityChange(item.id, e.target.value)} className="w-12 text-center font-black text-2xl bg-transparent border-none focus:ring-0 p-0 dark:text-white" />
                                </div>
                                <button onClick={() => handleQuantityChange(item.id, item.returnQuantity + 1)} className="w-10 h-10 flex items-center justify-center hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 rounded-xl transition-colors shadow-sm border dark:border-gray-700"><Plus className="w-5 h-5" /></button>
                              </motion.div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar: Categories & Note */}
                <div className="space-y-6">
                  <Card className="border-none shadow-2xl rounded-3xl sticky top-6 overflow-hidden bg-white dark:bg-gray-800 ring-1 ring-black/5">
                    <CardHeader className="bg-gray-900 text-white p-6">
                      <CardTitle className="text-lg font-black tracking-tight">Lengkapi Data</CardTitle>
                      <p className="text-xs text-gray-400 font-medium mt-1">Kategori & Catatan Tambahan</p>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="space-y-4">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Kategori Retur</label>
                        <div className="grid grid-cols-1 gap-3">
                          {returnCategories.map((cat) => (
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} key={cat.id} onClick={() => setSelectedReason(cat.id)}
                              className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer shadow-sm ${
                                selectedReason === cat.id ? `bg-${cat.color}-50 border-${cat.color}-500 dark:bg-${cat.color}-900/20 shadow-lg shadow-${cat.color}-500/10` : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:shadow-md'
                              }`}
                            >
                              <div className={`p-3 rounded-xl shadow-inner ${selectedReason === cat.id ? `bg-${cat.color}-100 text-${cat.color}-600` : 'bg-gray-100 text-gray-400'}`}>
                                {cat.icon}
                              </div>
                              <div className="flex-grow">
                                <p className={`font-black text-sm tracking-tight ${selectedReason === cat.id ? `text-${cat.color}-700 dark:text-${cat.color}-400` : 'text-gray-700 dark:text-white'}`}>{cat.label}</p>
                                <p className="text-[10px] font-bold text-gray-400 leading-tight mt-0.5">{cat.desc}</p>
                              </div>
                              {selectedReason === cat.id && <CheckCircle className={`w-5 h-5 text-${cat.color}-500`} />}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Catatan</label>
                        <textarea placeholder="Detail alasan barang diretur..." rows={3} value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} className="w-full p-5 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border-none shadow-inner focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium dark:text-white" />
                      </div>
                      <div className="pt-6 border-t dark:border-gray-700">
                        <div className="flex justify-between items-center bg-red-50 dark:bg-red-900/10 p-5 rounded-2xl border border-red-100 dark:border-red-900/30 shadow-inner">
                          <span className="text-red-700 dark:text-red-400 font-black uppercase text-[10px] tracking-widest">Estimasi Nilai</span>
                          <span className="text-2xl font-black text-red-600 tracking-tighter">{formatCurrency(calculateReturnTotal())}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-8 pt-0 flex flex-col gap-4">
                      <Button className="w-full py-8 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-2xl shadow-blue-500/40 font-black text-xl tracking-tight transition-all active:scale-95" onClick={() => setCurrentStep(3)} disabled={returnItems.filter(i => i.isSelected).length === 0 || !selectedReason}>Lanjut Konfirmasi <ArrowRight className="ml-2 w-6 h-6" /></Button>
                      <Button variant="ghost" className="w-full text-gray-500 font-bold rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => { setInvoiceData(null); setCurrentStep(1); }}>Batal & Cari Lagi</Button>
                    </CardFooter>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* STEP 3: CONFIRMATION */}
            {currentStep === 3 && (
              <motion.div key="step3" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="max-w-2xl mx-auto">
                <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden bg-white dark:bg-gray-800 ring-1 ring-black/5">
                  <div className="bg-amber-500 p-10 text-white text-center relative overflow-hidden">
                    <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 0.2, scale: 1.5 }} className="absolute -top-10 -right-10 bg-white w-40 h-40 rounded-full" />
                    <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md shadow-2xl"><AlertTriangle className="w-12 h-12" /></div>
                    <h2 className="text-3xl font-black mb-2 tracking-tight">Final Check!</h2>
                    <p className="text-amber-50 font-bold opacity-90 tracking-wide uppercase text-xs">Periksa kembali data sebelum dikirim ke Admin</p>
                  </div>
                  <CardContent className="p-10 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 border-b dark:border-gray-700">
                       <div className="space-y-5">
                          <div>
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">No. Invoice</p>
                             <p className="font-black text-xl text-gray-900 dark:text-white">{invoiceData.invoiceNumber}</p>
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">Nama Pelanggan</p>
                             <p className="font-black text-xl text-amber-600">{invoiceData.customerName || 'Umum'} <Badge className="bg-amber-100 text-amber-700 border-none font-black px-2 py-0.5 ml-2 text-[10px] uppercase">#{invoiceData.customerCode || '-'}</Badge></p>
                          </div>
                       </div>
                       <div className="space-y-5">
                          <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">Personel Terkait</p>
                            <div className="flex flex-col gap-2">
                               <span className="text-sm font-bold flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                  <UserCog className="w-5 h-5 text-blue-500" /> 
                                  <div>
                                     <p className="leading-none">{invoiceData.cashierName}</p>
                                     <p className="text-[10px] text-gray-400 mt-1 uppercase font-black">ID: {invoiceData.cashierCode || '-'}</p>
                                  </div>
                               </span>
                               <span className="text-sm font-bold flex items-center gap-3 bg-green-50 dark:bg-green-900/20 p-3 rounded-xl border border-green-100 dark:border-green-900/30">
                                  <UserCheck className="w-5 h-5 text-green-500" /> 
                                  <div>
                                     <p className="leading-none">{invoiceData.attendantName || '-'}</p>
                                     <p className="text-[10px] text-gray-400 mt-1 uppercase font-black">ID: {invoiceData.attendantCode || '-'}</p>
                                  </div>
                               </span>
                            </div>
                          </div>
                       </div>
                    </div>
                    <div className="space-y-6">
                      <div className="flex justify-between items-center"><span className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Kategori Retur</span><Badge className="bg-amber-100 text-amber-700 border-none font-black px-5 py-2 rounded-xl shadow-sm">{returnCategories.find(c => c.id === selectedReason)?.label.toUpperCase()}</Badge></div>
                      <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-8 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 shadow-inner">
                        {returnItems.filter(i => i.isSelected).map(item => (
                          <div key={item.id} className="flex justify-between items-center">
                            <div><p className="font-black text-gray-900 dark:text-white leading-tight tracking-tight">{item.name}</p><p className="text-xs text-gray-500 font-black mt-1 uppercase tracking-tighter">Qty: {item.returnQuantity} x {formatCurrency(item.price)}</p></div>
                            <span className="font-black text-gray-900 dark:text-white tracking-tight">{formatCurrency(item.price * item.returnQuantity)}</span>
                          </div>
                        ))}
                        <div className="pt-6 mt-2 border-t dark:border-gray-700 flex justify-between items-center"><span className="text-sm font-black text-gray-500 uppercase tracking-widest">Total Pengembalian</span><span className="text-3xl font-black text-red-600 tracking-tighter underline decoration-4 underline-offset-8 decoration-red-600/20">{formatCurrency(calculateReturnTotal())}</span></div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-10 pt-0 flex gap-4">
                    <Button variant="outline" className="flex-1 py-8 rounded-2xl border-2 font-bold hover:bg-gray-50 transition-all" onClick={() => setCurrentStep(2)} disabled={loading}><ChevronLeft className="mr-2 w-5 h-5" /> Ubah Data</Button>
                    <Button className="flex-[2] py-8 rounded-2xl bg-green-600 hover:bg-green-700 shadow-2xl shadow-green-500/40 font-black text-xl tracking-tight transition-all active:scale-95" onClick={handleSubmitReturn} disabled={loading}>{loading ? <RefreshCcw className="w-6 h-6 animate-spin" /> : <>Kirim Ke Admin <CheckCircle className="ml-2 w-7 h-7" /></>}</Button>
                  </CardFooter>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <SuccessModal isOpen={showSuccessModal} onClose={handleReset} message={successMessage} darkMode={userTheme.darkMode} />
      </div>
    </ProtectedRoute>
  );
}
