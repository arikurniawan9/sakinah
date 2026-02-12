// app/pelayan/riwayat-retur/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useUserTheme } from '../../../../components/UserThemeContext';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/Card';
import { PackageX, User, Package, Calendar, Store, AlertCircle, CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../../../../components/LoadingSpinner';

export default function PelayanReturnDetailPage() {
  const { userTheme } = useUserTheme();
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();

  const [returnData, setReturnData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const response = await fetch(`/api/return-products/${params.id}`);
        const result = await response.json();

        if (result.success) {
          // Verifikasi bahwa retur ini milik pelayan yang sedang login
          if (result.data.attendantId !== session?.user?.id) {
            alert('Anda tidak memiliki akses ke data retur ini');
            router.push('/pelayan/riwayat-retur');
            return;
          }
          
          setReturnData(result.data);
        } else {
          console.error('Failed to fetch return data:', result.message);
          alert('Gagal mengambil data retur produk');
        }
      } catch (error) {
        console.error('Error fetching return data:', error);
        alert('Terjadi kesalahan saat mengambil data retur produk');
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchData();
    }
  }, [params.id, session, router]);

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
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
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

  if (!session) {
    return <LoadingSpinner />;
  }

  if (loading) {
    return (
      <div className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${userTheme.darkMode ? 'dark' : ''}`}>
        <div className="flex items-center justify-center h-64">
          <div className={`text-center ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <PackageX className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Loading detail retur produk...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!returnData) {
    return (
      <div className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${userTheme.darkMode ? 'dark' : ''}`}>
        <div className="flex items-center justify-center h-64">
          <div className={`text-center ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <PackageX className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Data retur produk tidak ditemukan</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${userTheme.darkMode ? 'dark' : ''}`}>
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/pelayan/riwayat-retur')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className={`text-3xl font-bold ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
              Detail Retur Produk #{returnData.id}
            </h1>
            <p className={`mt-2 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Informasi lengkap tentang permintaan retur produk Anda
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card className={userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
            <CardHeader>
              <CardTitle className={userTheme.darkMode ? 'text-white' : 'text-gray-900'}>
                Informasi Retur
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className={`text-sm font-medium ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    ID Retur
                  </h3>
                  <p className={`mt-1 ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {returnData.id}
                  </p>
                </div>

                <div>
                  <h3 className={`text-sm font-medium ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Status
                  </h3>
                  <div className="mt-1 flex items-center">
                    {getStatusIcon(returnData.status)}
                    <Badge variant={getStatusBadgeVariant(returnData.status)} className="ml-2 capitalize">
                      {returnData.status === 'APPROVED' ? 'Disetujui' :
                       returnData.status === 'PENDING' ? 'Menunggu' :
                       returnData.status === 'REJECTED' ? 'Ditolak' : returnData.status}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h3 className={`text-sm font-medium ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Nomor Transaksi
                  </h3>
                  <p className={`mt-1 ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {returnData.transactionId}
                  </p>
                </div>

                <div>
                  <h3 className={`text-sm font-medium ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Tanggal Retur
                  </h3>
                  <div className="mt-1 flex items-center">
                    <Calendar className={`h-4 w-4 mr-2 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={userTheme.darkMode ? 'text-white' : 'text-gray-900'}>
                      {formatDate(returnData.returnDate)}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className={`text-sm font-medium ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Kategori Retur
                  </h3>
                  <p className={`mt-1 ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {getCategoryLabel(returnData.category)}
                  </p>
                </div>

                <div>
                  <h3 className={`text-sm font-medium ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Tanggal Dibuat
                  </h3>
                  <div className="mt-1 flex items-center">
                    <Calendar className={`h-4 w-4 mr-2 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={userTheme.darkMode ? 'text-white' : 'text-gray-900'}>
                      {formatDate(returnData.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className={`text-sm font-medium ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Alasan Retur
                </h3>
                <p className={`mt-1 ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {returnData.reason}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Product Info Card */}
          <Card className={userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
            <CardHeader>
              <CardTitle className={userTheme.darkMode ? 'text-white' : 'text-gray-900'}>
                Informasi Produk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-16 h-16 rounded-md ${userTheme.darkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center`}>
                  <Package className={`h-8 w-8 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
                <div>
                  <h3 className={`font-medium ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {returnData.product?.name || returnData.productName}
                  </h3>
                  <p className={`text-sm ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    ID Produk: {returnData.productId}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar with Related Info */}
        <div className="space-y-6">
          {/* Customer Info Card */}
          <Card className={userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
            <CardHeader>
              <CardTitle className={userTheme.darkMode ? 'text-white' : 'text-gray-900'}>
                Informasi Pelanggan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full ${userTheme.darkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center`}>
                  <User className={`h-5 w-5 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
                <div>
                  <h3 className={`font-medium ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {returnData.transaction?.member?.name || 'Pelanggan Umum'}
                  </h3>
                  <p className={`text-sm ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    ID: {returnData.transaction?.memberId || 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendant Info Card */}
          <Card className={userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
            <CardHeader>
              <CardTitle className={userTheme.darkMode ? 'text-white' : 'text-gray-900'}>
                Informasi Pelayan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full ${userTheme.darkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center`}>
                  <User className={`h-5 w-5 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
                <div>
                  <h3 className={`font-medium ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {returnData.attendant?.name || returnData.attendantName}
                  </h3>
                  <p className={`text-sm ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    ID: {returnData.attendantId}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Store Info Card */}
          <Card className={userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
            <CardHeader>
              <CardTitle className={userTheme.darkMode ? 'text-white' : 'text-gray-900'}>
                Informasi Toko
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className={`flex-shrink-0 w-10 h-10 rounded-md ${userTheme.darkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center`}>
                  <Store className={`h-5 w-5 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
                <div>
                  <h3 className={`font-medium ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {returnData.store?.name || returnData.storeName}
                  </h3>
                  <p className={`text-sm ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    ID: {returnData.storeId}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Info Card */}
          <Card className={userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
            <CardHeader>
              <CardTitle className={userTheme.darkMode ? 'text-white' : 'text-gray-900'}>
                Status Proses
              </CardTitle>
              <CardDescription>
                Informasi tentang status permintaan retur Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center">
                  {getStatusIcon(returnData.status)}
                  <span className="ml-2 capitalize font-medium">
                    {returnData.status === 'APPROVED' ? 'Disetujui' :
                     returnData.status === 'PENDING' ? 'Menunggu Persetujuan' :
                     returnData.status === 'REJECTED' ? 'Ditolak' : returnData.status}
                  </span>
                </div>
                <p className={`text-sm ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {returnData.status === 'APPROVED' 
                    ? 'Permintaan retur Anda telah disetujui. Stok produk telah diperbarui.'
                    : returnData.status === 'PENDING'
                    ? 'Permintaan retur Anda sedang menunggu persetujuan dari admin.'
                    : 'Permintaan retur Anda telah ditolak oleh admin.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}