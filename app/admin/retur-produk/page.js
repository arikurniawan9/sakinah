'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import Breadcrumb from '@/components/Breadcrumb';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserTheme } from '@/components/UserThemeContext';
import { PackageX, Search, Filter, Calendar, User, Package, AlertCircle, CheckCircle, XCircle, Clock, Edit, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

export default function ReturnProductPage() {
  const { userTheme } = useUserTheme();
  const router = useRouter();
  const [returns, setReturns] = useState([]);
  const [filteredReturns, setFilteredReturns] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDate, setFilterDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReturns: 0,
    pendingReturns: 0,
    approvedReturns: 0,
    rejectedReturns: 0
  });

  const breadcrumbItems = [
    { title: 'Admin', href: '/admin' },
    { title: 'Retur Produk', href: '/admin/retur-produk' }
  ];

  // Fetch data from API
  useEffect(() => {
    const fetchReturns = async () => {
      try {
        setLoading(true);
        console.log('Fetching returns from API...');
        const response = await fetch('/api/return-products');
        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('API result:', result);

        if (result.success) {
          setReturns(result.data || []);
          setFilteredReturns(result.data || []);

          // Calculate stats
          const data = result.data || [];
          const totalReturns = data.length;
          const pendingReturns = data.filter(r => r.status === 'PENDING').length;
          const approvedReturns = data.filter(r => r.status === 'APPROVED').length;
          const rejectedReturns = data.filter(r => r.status === 'REJECTED').length;

          setStats({
            totalReturns,
            pendingReturns,
            approvedReturns,
            rejectedReturns
          });

          // Tampilkan info jika menggunakan data mock
          if (result.source === 'mock' || result.source === 'fallback-mock') {
            console.info('Using mock data for return products');
          }
        } else {
          console.error('Failed to fetch returns:', result.message);
          // Setel ke array kosong jika gagal
          setReturns([]);
          setFilteredReturns([]);
          setStats({
            totalReturns: 0,
            pendingReturns: 0,
            approvedReturns: 0,
            rejectedReturns: 0
          });
        }
      } catch (error) {
        console.error('Error fetching returns:', error);
        // Setel ke array kosong jika terjadi error
        setReturns([]);
        setFilteredReturns([]);
        setStats({
          totalReturns: 0,
          pendingReturns: 0,
          approvedReturns: 0,
          rejectedReturns: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReturns();
  }, []);

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

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

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'ERROR_BY_ATTENDANT':
        return 'Kesalahan Pelayan';
      case 'PRODUCT_DEFECT':
        return 'Produk Cacat';
      case 'WRONG_SELECTION':
        return 'Salah Pilih';
      default:
        return 'Lainnya';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${userTheme.darkMode ? 'dark' : ''}`}>
        <Breadcrumb items={breadcrumbItems} darkMode={userTheme.darkMode} />
        
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
            Manajemen Retur Produk
          </h1>
          <p className={`mt-2 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Kelola dan pantau semua permintaan retur produk dari pelanggan
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button
            onClick={() => router.push('/admin/retur-produk/tambah')}
            className="flex items-center space-x-2"
          >
            <PackageX className="h-4 w-4" />
            <span>Tambah Retur Baru</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className={`${userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Total Retur
              </CardTitle>
              <PackageX className={`h-4 w-4 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                {stats.totalReturns}
              </div>
              <p className={`text-xs ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Semua permintaan retur
              </p>
            </CardContent>
          </Card>

          <Card className={`${userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Menunggu Persetujuan
              </CardTitle>
              <Clock className={`h-4 w-4 ${userTheme.darkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                {stats.pendingReturns}
              </div>
              <p className={`text-xs ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Permintaan menunggu
              </p>
            </CardContent>
          </Card>

          <Card className={`${userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Disetujui
              </CardTitle>
              <CheckCircle className={`h-4 w-4 ${userTheme.darkMode ? 'text-green-400' : 'text-green-500'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                {stats.approvedReturns}
              </div>
              <p className={`text-xs ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Retur berhasil
              </p>
            </CardContent>
          </Card>

          <Card className={`${userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Ditolak
              </CardTitle>
              <XCircle className={`h-4 w-4 ${userTheme.darkMode ? 'text-red-400' : 'text-red-500'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                {stats.rejectedReturns}
              </div>
              <p className={`text-xs ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Retur ditolak
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className={`mb-6 ${userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <Input
                    placeholder="Cari berdasarkan nomor transaksi, nama produk, pelanggan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`pl-10 ${userTheme.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>
              </div>
              
              <div>
                <Select value={filterStatus} onValueChange={setFilterStatus} className={userTheme.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}>
                  <option value="ALL">Semua Status</option>
                  <option value="PENDING">Menunggu</option>
                  <option value="APPROVED">Disetujui</option>
                  <option value="REJECTED">Ditolak</option>
                </Select>
              </div>
              
              <div>
                <div className="relative">
                  <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 rounded-md border ${userTheme.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Returns Table */}
        <Card className={userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
          <CardHeader>
            <CardTitle className={userTheme.darkMode ? 'text-white' : 'text-gray-900'}>
              Daftar Retur Produk
            </CardTitle>
            <CardDescription>
              {filteredReturns.length} dari {returns.length} permintaan retur ditemukan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${userTheme.darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <th className="text-left py-3 px-4 font-medium">ID Retur</th>
                    <th className="text-left py-3 px-4 font-medium">Transaksi</th>
                    <th className="text-left py-3 px-4 font-medium">Produk</th>
                    <th className="text-left py-3 px-4 font-medium">Pelanggan</th>
                    <th className="text-left py-3 px-4 font-medium">Pelayan</th>
                    <th className="text-left py-3 px-4 font-medium">Tanggal</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReturns.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-8 px-4">
                        <div className="flex flex-col items-center justify-center">
                          <PackageX className={`h-12 w-12 ${userTheme.darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                          <p className={`mt-2 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Tidak ada data retur produk
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredReturns.map((ret) => (
                      <tr key={ret.id} className={`border-b ${userTheme.darkMode ? 'border-gray-700 hover:bg-gray-750' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <td className="py-3 px-4">
                          <div className="font-medium">{ret.id || '-'}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium">{ret.transactionId || '-'}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <Package className={`h-4 w-4 mr-2 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            <span>{ret.product?.name || ret.productName || 'Produk tidak ditemukan'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <User className={`h-4 w-4 mr-2 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            <span>{ret.transaction?.member?.name || 'Umum'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <User className={`h-4 w-4 mr-2 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            <span>{ret.attendant?.name || ret.attendantName || 'Pelayan tidak ditemukan'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <Calendar className={`h-4 w-4 mr-2 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            <span>{ret.returnDate ? formatDate(ret.returnDate) : '-'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            {getStatusIcon(ret.status)}
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold capitalize ${
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
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Link href={`/admin/retur-produk/${ret.id}`}>
                              <Button variant="outline" size="sm" className="p-2">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/admin/retur-produk/${ret.id}/edit`}>
                              <Button variant="outline" size="sm" className="p-2">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button variant="outline" size="sm" className="p-2 text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination would go here in a real implementation */}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}