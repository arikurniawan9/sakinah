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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/return-products/${params.id}`);
        const result = await response.json();

        if (result.success) {
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
      case 'APPROVED': return 'success';
      case 'PENDING': return 'warning';
      case 'REJECTED': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'PENDING': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'REJECTED': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'ERROR_BY_ATTENDANT': return 'Kesalahan Pelayan';
      case 'PRODUCT_DEFECT': return 'Produk Cacat';
      case 'WRONG_SELECTION': return 'Salah Pilih';
      default: return 'Lainnya';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (!session) return <LoadingSpinner />;

  if (loading) return (
    <div className={`w-full px-4 py-8 ${userTheme.darkMode ? 'dark' : ''}`}>
      <div className="flex items-center justify-center h-64">
        <div className="text-center"><PackageX className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Loading...</p></div>
      </div>
    </div>
  );

  if (!returnData) return (
    <div className={`w-full px-4 py-8 ${userTheme.darkMode ? 'dark' : ''}`}>
      <div className="flex items-center justify-center h-64">
        <div className="text-center"><PackageX className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Data tidak ditemukan</p></div>
      </div>
    </div>
  );

  return (
    <div className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${userTheme.darkMode ? 'dark' : ''}`}>
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/pelayan/riwayat-retur')} className="p-2"><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className={`text-3xl font-bold ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>Detail Retur #{returnData.id}</h1>
            <p className={`mt-2 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Informasi lengkap tentang permintaan retur produk Anda</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className={userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
            <CardHeader><CardTitle>Informasi Retur</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><h3 className="text-sm font-medium text-gray-500">ID Retur</h3><p className="mt-1 font-bold">{returnData.id}</p></div>
                <div><h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <div className="mt-1 flex items-center">{getStatusIcon(returnData.status)}<Badge variant={getStatusBadgeVariant(returnData.status)} className="ml-2">{returnData.status}</Badge></div>
                </div>
                <div><h3 className="text-sm font-medium text-gray-500">Invoice Transaksi</h3><p className="mt-1 font-bold">{returnData.transaction?.invoiceNumber || returnData.transactionId}</p></div>
                <div><h3 className="text-sm font-medium text-gray-500">Tanggal</h3><div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gray-400" />{formatDate(returnData.returnDate)}</div></div>
              </div>
              <div><h3 className="text-sm font-medium text-gray-500">Alasan</h3><p className="mt-1">{getCategoryLabel(returnData.reason) || returnData.reason}</p></div>
            </CardContent>
          </Card>

          <Card className={userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
            <CardHeader><CardTitle>Produk</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg"><Package className="h-8 w-8 text-gray-500" /></div>
                <div><h3 className="font-bold">{returnData.product?.name}</h3><p className="text-sm text-gray-500">Kode: {returnData.product?.productCode}</p></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className={userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
            <CardHeader><CardTitle>Personel & Toko</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Store className="h-5 w-5 text-gray-400" />
                <div><p className="text-xs text-gray-500 uppercase font-bold">Toko</p><p className="font-bold">{returnData.store?.name}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div><p className="text-xs text-gray-500 uppercase font-bold">Pelanggan</p><p className="font-bold">{returnData.transaction?.member?.name || 'Pelanggan Umum'}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div><p className="text-xs text-gray-500 uppercase font-bold">Kasir</p><p className="font-bold">{returnData.transaction?.cashier?.name}</p><p className="text-[10px] text-gray-400 font-bold">ID: {returnData.transaction?.cashier?.employeeNumber || '-'}</p></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
