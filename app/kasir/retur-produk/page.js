'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import Breadcrumb from '@/components/Breadcrumb';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserTheme } from '@/components/UserThemeContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PackageX, Search, Package, AlertCircle, CheckCircle, XCircle, Clock, Calendar, X } from 'lucide-react';

export default function CashierReturnProductPage() {
  const { userTheme } = useUserTheme();
  const router = useRouter();
  const [returns, setReturns] = useState([]);
  const [filteredReturns, setFilteredReturns] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const breadcrumbItems = [
    { title: 'Kasir', href: '/kasir' },
    { title: 'Retur Produk', href: '/kasir/retur-produk' }
  ];

  // Fetch data from API
  useEffect(() => {
    const fetchReturns = async () => {
      try {
        setLoading(true);

        // Ambil data retur yang terkait dengan kasir ini
        const response = await fetch('/api/return-products');
        const result = await response.json();

        if (result.success) {
          // Filter hanya retur yang dibuat oleh kasir ini atau terkait dengan transaksinya
          const cashierReturns = result.data.filter(ret =>
            ret.attendantId === localStorage.getItem('userId') ||
            ret.cashierId === localStorage.getItem('userId')
          );

          setReturns(cashierReturns);
          setFilteredReturns(cashierReturns);
        } else {
          console.error('Failed to fetch returns:', result.message);
        }
      } catch (error) {
        console.error('Error fetching returns:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReturns();
  }, []);

  // Apply filters
  useEffect(() => {
    let result = [...returns];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(ret =>
        ret.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ret.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ret.reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'ALL') {
      result = result.filter(ret => ret.status === filterStatus);
    }

    setFilteredReturns(result);
  }, [searchTerm, filterStatus, returns]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Modal Form State
  const [formData, setFormData] = useState({
    transactionId: '',
    productId: '',
    productName: '',
    customerName: '',
    attendantId: '', // Akan diisi setelah komponen dimount
    attendantName: '',
    reason: '',
    category: 'OTHERS'
  });

  // Set attendantId setelah komponen dimount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setFormData(prev => ({
        ...prev,
        attendantId: localStorage.getItem('userId') || ''
      }));
    }
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Gunakan ID kasir dari localStorage
    const cashierId = typeof window !== 'undefined' ? localStorage.getItem('userId') : '';

    const submitData = {
      ...formData,
      attendantId: cashierId
    };

    try {
      const response = await fetch('/api/return-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (result.success) {
        alert('Retur produk berhasil diajukan');
        setShowModal(false);
        setFormData({
          transactionId: '',
          productId: '',
          productName: '',
          customerName: '',
          attendantId: cashierId,
          attendantName: '',
          reason: '',
          category: 'OTHERS'
        });
        // Refresh data
        router.refresh();
      } else {
        console.error('Error submitting return:', result.message);
        alert(`Gagal menyimpan retur: ${result.message}`);
      }
    } catch (error) {
      console.error('Error submitting return:', error);
      alert('Terjadi kesalahan saat menyimpan retur');
    }
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
                Kelola permintaan retur produk dari pelanggan
              </p>
            </div>

            <Button
              onClick={() => setShowModal(true)}
              className="flex items-center space-x-2 px-4 py-2"
            >
              <PackageX className="h-4 w-4" />
              <span>Tambah Retur</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className={`${userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${userTheme.darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                  <PackageX className={`h-6 w-6 ${userTheme.darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <div className="ml-4">
                  <p className={`text-sm ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total</p>
                  <p className={`text-xl font-bold ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {returns.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${userTheme.darkMode ? 'bg-yellow-900/30' : 'bg-yellow-100'}`}>
                  <Clock className={`h-6 w-6 ${userTheme.darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                </div>
                <div className="ml-4">
                  <p className={`text-sm ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Menunggu</p>
                  <p className={`text-xl font-bold ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {returns.filter(r => r.status === 'PENDING').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${userTheme.darkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                  <CheckCircle className={`h-6 w-6 ${userTheme.darkMode ? 'text-green-400' : 'text-green-600'}`} />
                </div>
                <div className="ml-4">
                  <p className={`text-sm ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Disetujui</p>
                  <p className={`text-xl font-bold ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {returns.filter(r => r.status === 'APPROVED').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className={`mb-6 ${userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <Input
                    placeholder="Cari transaksi atau produk..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`pl-10 ${userTheme.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <div className={`relative ${userTheme.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} border rounded-md px-3 py-2`}>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className={`w-full bg-transparent outline-none text-sm ${
                      userTheme.darkMode ? 'text-white' : 'text-gray-900'
                    } appearance-none`}
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="PENDING">Menunggu</option>
                    <option value="APPROVED">Disetujui</option>
                    <option value="REJECTED">Ditolak</option>
                  </select>
                  <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none ${
                    userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Returns List */}
        <Card className={userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
          <CardHeader className="hidden"> {/* Sembunyikan header card untuk tampilan yang lebih bersih */}</CardHeader>
          <CardContent>
            {filteredReturns.length === 0 ? (
              <div className="text-center py-12">
                <PackageX className={`h-12 w-12 mx-auto mb-4 ${userTheme.darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <p className={`text-lg ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Tidak ada retur produk
                </p>
                <p className={`mt-1 ${userTheme.darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Belum ada permintaan retur produk
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReturns.map((ret) => (
                  <div
                    key={ret.id}
                    className={`p-4 rounded-lg border ${userTheme.darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className={`font-medium ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                            #{ret.id}
                          </span>
                          <span className={`text-sm px-2 py-1 rounded ${userTheme.darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                            {ret.transactionId}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Package className={`h-4 w-4 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                          <span className={userTheme.darkMode ? 'text-gray-300' : 'text-gray-700'}>
                            {ret.product?.name || ret.productName}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(ret.status)}
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${
                            ret.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                            ret.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            ret.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {ret.status === 'APPROVED' ? 'Disetujui' :
                             ret.status === 'PENDING' ? 'Menunggu' :
                             ret.status === 'REJECTED' ? 'Ditolak' : ret.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(ret.returnDate)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal Form */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`relative w-full max-w-md rounded-lg shadow-xl ${userTheme.darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className={`text-lg font-bold ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Tambah Retur Produk
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className={`p-1 rounded-full ${userTheme.darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${userTheme.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Nomor Transaksi
                    </label>
                    <Input
                      type="text"
                      value={formData.transactionId}
                      onChange={(e) => handleChange('transactionId', e.target.value)}
                      placeholder="Contoh: INV-001"
                      className={userTheme.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${userTheme.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      ID Produk
                    </label>
                    <Input
                      type="text"
                      value={formData.productId}
                      onChange={(e) => handleChange('productId', e.target.value)}
                      placeholder="Contoh: PROD-001"
                      className={userTheme.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${userTheme.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Nama Produk
                    </label>
                    <Input
                      type="text"
                      value={formData.productName}
                      onChange={(e) => handleChange('productName', e.target.value)}
                      placeholder="Nama produk yang diretur"
                      className={userTheme.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${userTheme.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Nama Pelanggan
                    </label>
                    <Input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => handleChange('customerName', e.target.value)}
                      placeholder="Nama pelanggan"
                      className={userTheme.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${userTheme.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Kategori Retur
                    </label>
                    <div className={`relative ${userTheme.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} border rounded-md px-3 py-2`}>
                      <select
                        value={formData.category}
                        onChange={(e) => handleChange('category', e.target.value)}
                        className={`w-full bg-transparent outline-none text-sm ${
                          userTheme.darkMode ? 'text-white' : 'text-gray-900'
                        } appearance-none`}
                      >
                        <option value="ERROR_BY_ATTENDANT">Kesalahan Pelayan</option>
                        <option value="PRODUCT_DEFECT">Produk Cacat</option>
                        <option value="WRONG_SELECTION">Salah Pilih oleh Pelanggan</option>
                        <option value="OTHERS">Lainnya</option>
                      </select>
                      <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none ${
                        userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${userTheme.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Alasan Retur
                    </label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) => handleChange('reason', e.target.value)}
                      placeholder="Jelaskan alasan produk diretur..."
                      rows="3"
                      className={`w-full rounded-md border px-3 py-2 text-sm ${
                        userTheme.darkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      required
                    ></textarea>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowModal(false)}
                      className={userTheme.darkMode ? 'border-gray-600' : 'border-gray-300'}
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Simpan Retur
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}