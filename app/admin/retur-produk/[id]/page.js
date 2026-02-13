'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import Breadcrumb from '@/components/Breadcrumb';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserTheme } from '@/components/UserThemeContext';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { 
  PackageX, User, Package, Calendar, Store, AlertCircle, 
  CheckCircle, XCircle, Clock, Edit3, ArrowLeft, Receipt,
  ShoppingBag, ClipboardList, Info, Trash2, UserCog, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function ReturnProductDetailPage() {
  const { userTheme } = useUserTheme();
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();

  const [returnData, setReturnData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // State untuk modal konfirmasi
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);

  const breadcrumbItems = [
    { title: 'Admin', href: '/admin' },
    { title: 'Retur Produk', href: '/admin/retur-produk' },
    { title: `Detail #${returnData?.invoiceNumber || params.id}`, href: `/admin/retur-produk/${params.id}` }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/return-products/${params.id}`);
        const result = await response.json();
        if (result.success) {
          setReturnData(result.data);
        }
      } catch (error) {
        console.error('Error fetching return data:', error);
        toast.error('Gagal mengambil data retur');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  const handleAction = async (status) => {
    if (!session?.user?.id) {
      toast.error('Sesi tidak valid. Silakan login kembali.');
      return;
    }

    setProcessing(true);
    try {
      const actionText = status === 'APPROVED' ? 'menyetujui' : 'menolak';
      const response = await fetch(`/api/return-products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: status,
          processedById: session.user.id
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`Berhasil ${actionText} permintaan retur`);
        setReturnData(result.data);
      } else {
        toast.error(result.message || `Gagal ${actionText} retur`);
      }
    } catch (error) {
      toast.error('Terjadi kesalahan sistem');
    } finally {
      setProcessing(false);
      setShowConfirmModal(false);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'APPROVED': return { color: 'text-green-600 bg-green-100', icon: <CheckCircle className="w-5 h-5" />, label: 'Disetujui' };
      case 'REJECTED': return { color: 'text-red-600 bg-red-100', icon: <XCircle className="w-5 h-5" />, label: 'Ditolak' };
      default: return { color: 'text-amber-600 bg-amber-100', icon: <Clock className="w-5 h-5" />, label: 'Menunggu' };
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!returnData) return (
    <div className="p-8 text-center">
      <PackageX className="w-16 h-16 mx-auto text-gray-300 mb-4" />
      <h2 className="text-xl font-bold">Data tidak ditemukan</h2>
      <Button onClick={() => router.back()} className="mt-4">Kembali</Button>
    </div>
  );

  const statusCfg = getStatusConfig(returnData.status);

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className={`min-h-screen w-full px-4 sm:px-6 lg:px-8 py-8 ${userTheme.darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-6xl mx-auto">
          <Breadcrumb items={breadcrumbItems} darkMode={userTheme.darkMode} />

          <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => router.push('/admin/retur-produk')} className="rounded-full">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className={`text-3xl font-black ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {returnData.invoiceNumber}
                  </h1>
                  <Badge className={`${statusCfg.color} border-none px-3 py-1 text-xs font-bold`}>
                    {statusCfg.label}
                  </Badge>
                </div>
                <p className="text-gray-500 text-sm mt-1 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" /> Diajukan pada {formatDate(returnData.createdAt)}
                </p>
              </div>
            </div>

            {returnData.status === 'PENDING' && (
              <div className="flex gap-3">
                <Button 
                  disabled={processing}
                  onClick={() => {
                    setPendingStatus('REJECTED');
                    setShowConfirmModal(true);
                  }}
                  variant="outline" 
                  className="bg-white hover:bg-red-50 text-red-600 border-red-200 py-6 px-6 rounded-2xl font-bold"
                >
                  <XCircle className="w-5 h-5 mr-2" /> Tolak Retur
                </Button>
                <Button 
                  disabled={processing}
                  onClick={() => {
                    setPendingStatus('APPROVED');
                    setShowConfirmModal(true);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200 py-6 px-8 rounded-2xl font-bold"
                >
                  <CheckCircle className="w-5 h-5 mr-2" /> Setujui Retur
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Transaction & Product Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Product Card */}
              <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                <CardHeader className="bg-blue-600 text-white p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 rounded-2xl">
                        <ShoppingBag className="w-8 h-8" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">Detail Produk</CardTitle>
                        <CardDescription className="text-blue-100">Informasi barang yang dikembalikan</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                    <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-[2.5rem] flex items-center justify-center flex-shrink-0">
                      <Package className="w-16 h-16 text-gray-400" />
                    </div>
                    <div className="flex-grow space-y-4 text-center md:text-left">
                      <div>
                        <h2 className="text-2xl font-black dark:text-white">{returnData.product?.name || returnData.productName}</h2>
                        <p className="text-blue-600 font-bold tracking-widest text-sm uppercase mt-1">{returnData.product?.productCode || 'N/A'}</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl">
                          <p className="text-xs text-gray-400 font-bold uppercase mb-1">Kategori Retur</p>
                          <p className="font-bold">
                            {returnData.category === 'PRODUCT_DEFECT' ? 'Cacat Produk' : 
                             returnData.category === 'WRONG_SELECTION' ? 'Salah Pilih' :
                             returnData.category === 'EXPIRED' ? 'Kadaluarsa' : 'Lainnya'}
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl">
                          <p className="text-xs text-gray-400 font-bold uppercase mb-1">Metode</p>
                          <p className="font-bold">Potong Stok</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl col-span-2 md:col-span-1">
                          <p className="text-xs text-gray-400 font-bold uppercase mb-1">Harga Satuan</p>
                          <p className="font-black text-blue-600">{formatCurrency(returnData.product?.retailPrice || 0)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transaction Detail Card */}
              <Card className="border-none shadow-lg rounded-3xl overflow-hidden">
                <CardHeader className="p-6 border-b dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <Receipt className="w-6 h-6 text-gray-400" />
                    <CardTitle className="text-xl">Referensi Transaksi</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 flex-shrink-0">
                          <Receipt className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">No. Invoice Asli</p>
                          <p className="font-bold text-lg">{returnData.transaction?.invoiceNumber || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 flex-shrink-0">
                          <UserCog className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Kasir (Oleh)</p>
                          <p className="font-bold text-lg">{returnData.transaction?.cashier?.name || 'Sistem'}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ID: {returnData.transaction?.cashier?.code || '-'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Pelanggan / Member</p>
                          <p className="font-bold text-lg">{returnData.transaction?.member?.name || 'Pelanggan Umum'}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Code: {returnData.transaction?.member?.code || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600 flex-shrink-0">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Tanggal Transaksi</p>
                          <p className="font-bold text-lg">{returnData.transaction?.date ? formatDate(returnData.transaction.date) : 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card className="border-none shadow-sm bg-amber-50 dark:bg-amber-900/10 rounded-3xl">
                <CardContent className="p-6 flex gap-4">
                  <div className="p-3 bg-amber-200 dark:bg-amber-800 rounded-2xl flex-shrink-0 self-start">
                    <ClipboardList className="w-6 h-6 text-amber-700 dark:text-amber-300" />
                  </div>
                  <div>
                    <h4 className="font-black text-amber-800 dark:text-amber-200 text-sm uppercase mb-1">Catatan Pelayan</h4>
                    <p className="text-amber-900 dark:text-amber-100 italic">
                      {returnData.notes || 'Tidak ada catatan tambahan yang diberikan oleh pelayan.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Attendant Info & Audit Trail */}
            <div className="space-y-8">
              {/* Attendant Card */}
              <Card className="border-none shadow-lg rounded-[2rem] overflow-hidden bg-white dark:bg-gray-800 ring-1 ring-black/5">
                <CardHeader className="bg-gray-900 text-white p-6">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-blue-400" /> Pelayan Terkait
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-500/20">
                      {returnData.attendant?.name?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <h4 className="font-bold text-xl dark:text-white">{returnData.attendant?.name || 'Unknown'}</h4>
                      <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50/50">
                        {returnData.attendant?.code || 'NO-CODE'}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-3 pt-4 border-t dark:border-gray-700">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 font-medium">Total Melayani:</span>
                      <span className="font-bold dark:text-white">{returnData.attendant?._count?.attendantSales || 0} Transaksi</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 font-medium">Store Unit:</span>
                      <span className="font-bold dark:text-white">{returnData.store?.name || 'Toko Pusat'}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50 dark:bg-gray-800/50 p-4">
                   <p className="text-[10px] text-center w-full text-gray-400 font-black uppercase tracking-[0.2em]">Data Karyawan Terverifikasi</p>
                </CardFooter>
              </Card>

              {/* Notification Box */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-md border-l-8 border-blue-600 ring-1 ring-black/5">
                <div className="flex gap-4">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl self-start">
                    <Info className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase tracking-tight mb-1 dark:text-white">Informasi Stok</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Persetujuan retur akan mengembalikan unit produk ke stok aktif di <strong>{returnData.store?.name}</strong> secara otomatis.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Konfirmasi */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => handleAction(pendingStatus)}
        title={pendingStatus === 'APPROVED' ? 'Setujui Permintaan Retur' : 'Tolak Permintaan Retur'}
        message={`Apakah Anda yakin ingin ${pendingStatus === 'APPROVED' ? 'menyetujui' : 'menolak'} permintaan retur ${returnData.invoiceNumber} ini? Tindakan ini akan ${pendingStatus === 'APPROVED' ? 'mengembalikan stok produk' : 'membatalkan proses retur'}.`}
        confirmText={pendingStatus === 'APPROVED' ? 'Ya, Setujui' : 'Ya, Tolak'}
        cancelText="Batal"
        variant={pendingStatus === 'APPROVED' ? 'success' : 'danger'}
        isLoading={processing}
      />
    </ProtectedRoute>
  );
}
