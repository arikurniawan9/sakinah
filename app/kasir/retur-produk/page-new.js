'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Search, PackageX, Package, Calendar, User, CreditCard, AlertTriangle, CheckCircle, XCircle, Clock, Plus, X, Home } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useUserTheme } from '@/components/UserThemeContext';
import Breadcrumb from '@/components/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function CashierReturnProductPage() {
  const { userTheme } = useUserTheme();
  const router = useRouter();
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [invoiceData, setInvoiceData] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [selectedReason, setSelectedReason] = useState('');
  const [returnNotes, setReturnNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'return'
  
  const searchInputRef = useRef(null);

  const breadcrumbItems = [
    { title: 'Kasir', href: '/kasir' },
    { title: 'Retur Produk', href: '/kasir/retur-produk' }
  ];

  // Mock function to search for invoices
  const searchInvoices = async (term) => {
    if (!term.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setLoading(true);
    try {
      // Simulate API call to search for transactions/invoices
      const response = await fetch(`/api/transaksi/search?q=${encodeURIComponent(term)}`);
      const result = await response.json();
      
      if (result.success) {
        setSearchResults(result.transactions || []);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        console.error('Failed to search invoices:', result.message);
      }
    } catch (error) {
      console.error('Error searching invoices:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.length > 2) {
      searchInvoices(value);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // Handle invoice selection
  const handleInvoiceSelect = (invoice) => {
    setInvoiceData(invoice);
    setReturnItems(invoice.items.map(item => ({
      ...item,
      returnQuantity: 0,
      isSelected: false
    })));
    setShowSearchResults(false);
    setActiveTab('return');
  };

  // Handle item selection for return
  const toggleItemSelection = (itemId) => {
    setReturnItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { ...item, isSelected: !item.isSelected, returnQuantity: !item.isSelected ? 1 : 0 } 
          : item
      )
    );
  };

  // Handle quantity change for return
  const handleQuantityChange = (itemId, quantity) => {
    setReturnItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { ...item, returnQuantity: Math.min(quantity, item.quantity) } 
          : item
      )
    );
  };

  // Submit return request
  const handleSubmitReturn = async () => {
    if (!invoiceData) {
      alert('Silakan pilih invoice terlebih dahulu');
      return;
    }

    const selectedItems = returnItems.filter(item => item.isSelected && item.returnQuantity > 0);
    if (selectedItems.length === 0) {
      alert('Silakan pilih setidaknya satu item untuk diretur');
      return;
    }

    if (!selectedReason) {
      alert('Silakan pilih alasan retur');
      return;
    }

    setLoading(true);
    try {
      const returnData = {
        transactionId: invoiceData.id,
        cashierId: session?.user?.id,
        items: selectedItems.map(item => ({
          productId: item.productId,
          quantity: item.returnQuantity,
          originalPrice: item.price,
          subtotal: item.price * item.returnQuantity
        })),
        reason: selectedReason,
        notes: returnNotes,
        status: 'PENDING'
      };

      const response = await fetch('/api/return-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(returnData),
      });

      const result = await response.json();

      if (result.success) {
        alert('Permintaan retur berhasil dikirim');
        // Reset form
        setInvoiceData(null);
        setReturnItems([]);
        setSelectedReason('');
        setReturnNotes('');
        setSearchTerm('');
        setActiveTab('search');
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      } else {
        alert(`Gagal mengirim permintaan retur: ${result.message}`);
      }
    } catch (error) {
      console.error('Error submitting return:', error);
      alert('Terjadi kesalahan saat mengirim permintaan retur');
    } finally {
      setLoading(false);
    }
  };

  // Format currency helper
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date helper
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <ProtectedRoute requiredRole="CASHIER">
      <div className={`w-full px-4 sm:px-6 lg:px-8 py-6 ${userTheme.darkMode ? 'dark' : ''}`}>
        <Breadcrumb items={breadcrumbItems} darkMode={userTheme.darkMode} />

        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className={`text-2xl font-bold ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                Retur Produk
              </h1>
              <p className={`mt-1 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Proses retur produk dari transaksi sebelumnya
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex mb-6 border-b">
          <button
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === 'search'
                ? userTheme.darkMode
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-blue-600 border-b-2 border-blue-600'
                : userTheme.darkMode
                ? 'text-gray-400 hover:text-gray-300'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('search')}
          >
            Cari Transaksi
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === 'return'
                ? userTheme.darkMode
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-blue-600 border-b-2 border-blue-600'
                : userTheme.darkMode
                ? 'text-gray-400 hover:text-gray-300'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('return')}
            disabled={!invoiceData}
          >
            Proses Retur
          </button>
        </div>

        {/* Search Tab */}
        {activeTab === 'search' && (
          <Card className={userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
            <CardHeader>
              <CardTitle className={userTheme.darkMode ? 'text-white' : 'text-gray-900'}>
                Cari Transaksi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <Input
                    ref={searchInputRef}
                    placeholder="Cari nomor invoice atau nama pelanggan..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className={`pl-10 ${userTheme.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                  
                  {showSearchResults && searchResults.length > 0 && (
                    <div className={`absolute z-10 mt-1 w-full rounded-md shadow-lg ${userTheme.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border max-h-60 overflow-auto`}>
                      {searchResults.map((invoice) => (
                        <div
                          key={invoice.id}
                          className={`p-3 cursor-pointer hover:${userTheme.darkMode ? 'bg-gray-600' : 'bg-gray-100'} border-b ${userTheme.darkMode ? 'border-gray-600' : 'border-gray-200'}`}
                          onClick={() => handleInvoiceSelect(invoice)}
                        >
                          <div className="flex justify-between items-center">
                            <span className={`font-medium ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {invoice.invoiceNumber || invoice.id}
                            </span>
                            <span className={`text-sm ${userTheme.darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {formatCurrency(invoice.total)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm mt-1">
                            <span className={userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}>
                              {invoice.customerName || 'Umum'}
                            </span>
                            <span className={userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}>
                              {formatDate(invoice.createdAt)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {showSearchResults && searchResults.length === 0 && (
                    <div className={`absolute z-10 mt-1 w-full rounded-md shadow-lg ${userTheme.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border p-3`}>
                      <p className={userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}>Tidak ditemukan transaksi</p>
                    </div>
                  )}
                </div>
                
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <p>Masukkan nomor invoice atau nama pelanggan untuk mencari transaksi sebelumnya</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Return Processing Tab */}
        {activeTab === 'return' && invoiceData && (
          <div className="space-y-6">
            {/* Invoice Summary */}
            <Card className={userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
              <CardHeader>
                <CardTitle className={userTheme.darkMode ? 'text-white' : 'text-gray-900'}>
                  Detail Transaksi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className={`text-sm ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Nomor Invoice</p>
                    <p className={`font-medium ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {invoiceData.invoiceNumber || invoiceData.id}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Tanggal</p>
                    <p className={`font-medium ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatDate(invoiceData.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pelanggan</p>
                    <p className={`font-medium ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {invoiceData.customerName || 'Umum'}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total</p>
                    <p className={`font-medium ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(invoiceData.total)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items to Return */}
            <Card className={userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
              <CardHeader>
                <CardTitle className={userTheme.darkMode ? 'text-white' : 'text-gray-900'}>
                  Barang untuk Diretur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {returnItems.map((item) => (
                    <div 
                      key={item.id} 
                      className={`p-3 rounded-lg border ${item.isSelected ? (userTheme.darkMode ? 'border-blue-500 bg-blue-900/20' : 'border-blue-300 bg-blue-50') : (userTheme.darkMode ? 'border-gray-700' : 'border-gray-200')}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={item.isSelected}
                            onChange={() => toggleItemSelection(item.id)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="ml-3">
                            <p className={`font-medium ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {item.name || item.productName}
                            </p>
                            <p className={`text-sm ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Harga: {formatCurrency(item.price)} | Stok: {item.quantity}
                            </p>
                          </div>
                        </div>
                        
                        {item.isSelected && (
                          <div className="flex items-center">
                            <span className={`mr-2 ${userTheme.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Qty:</span>
                            <input
                              type="number"
                              min="1"
                              max={item.quantity}
                              value={item.returnQuantity}
                              onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                              className={`w-16 rounded border px-2 py-1 text-sm ${userTheme.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Return Reason and Notes */}
            <Card className={userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
              <CardHeader>
                <CardTitle className={userTheme.darkMode ? 'text-white' : 'text-gray-900'}>
                  Alasan Retur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${userTheme.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Kategori Retur
                    </label>
                    <select
                      value={selectedReason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className={`w-full rounded-md border px-3 py-2 text-sm ${
                        userTheme.darkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">Pilih alasan retur</option>
                      <option value="PRODUCT_DEFECT">Produk Cacat</option>
                      <option value="WRONG_SELECTION">Salah Pilih oleh Pelanggan</option>
                      <option value="ERROR_BY_ATTENDANT">Kesalahan Pelayan</option>
                      <option value="OTHERS">Lainnya</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${userTheme.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Catatan Tambahan
                    </label>
                    <textarea
                      value={returnNotes}
                      onChange={(e) => setReturnNotes(e.target.value)}
                      placeholder="Jelaskan secara detail alasan produk diretur..."
                      rows="3"
                      className={`w-full rounded-md border px-3 py-2 text-sm ${
                        userTheme.darkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    ></textarea>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setActiveTab('search');
                  setInvoiceData(null);
                  setReturnItems([]);
                  setSelectedReason('');
                  setReturnNotes('');
                  setSearchTerm('');
                }}
                className={userTheme.darkMode ? 'border-gray-600' : 'border-gray-300'}
              >
                Kembali
              </Button>
              <Button
                onClick={handleSubmitReturn}
                disabled={loading || !selectedReason}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? 'Memproses...' : 'Ajukan Retur'}
              </Button>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`p-6 rounded-lg ${userTheme.darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
                <span className={userTheme.darkMode ? 'text-white' : 'text-gray-900'}>Memproses...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}