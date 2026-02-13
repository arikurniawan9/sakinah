'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { 
  PackageX, Search, Filter, Calendar, User, Package, 
  AlertCircle, CheckCircle, XCircle, Clock, Edit, Eye, 
  Trash2, RefreshCcw, ArrowUpRight, Inbox,
  MoreVertical, ChevronRight, FileText, UserCog, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProtectedRoute from '@/components/ProtectedRoute';
import Breadcrumb from '@/components/Breadcrumb';
import { useUserTheme } from '@/components/UserThemeContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import ConfirmationModal from '@/components/ConfirmationModal';
import { toast } from 'react-toastify';
import Link from 'next/link';

// Fetcher function for SWR
const fetcher = (url) => fetch(url).then((res) => res.json());

export default function AdminReturnProductPage() {
  const { userTheme } = useUserTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);

  // Real-time data fetching with SWR (polling every 10 seconds)
  const { data, error, isLoading, mutate } = useSWR('/api/return-products', fetcher, {
    refreshInterval: 10000, // Real-time check every 10 seconds
    revalidateOnFocus: true
  });

  const returns = data?.data || [];

  const stats = useMemo(() => {
    return {
      total: returns.length,
      pending: returns.filter(r => r.status === 'PENDING').length,
      approved: returns.filter(r => r.status === 'APPROVED').length,
      rejected: returns.filter(r => r.status === 'REJECTED').length,
    };
  }, [returns]);

  const filteredReturns = useMemo(() => {
    return returns.filter(ret => 
      ret.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ret.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ret.transaction?.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ret.attendant?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [returns, searchTerm]);

  const breadcrumbItems = [
    { title: 'Admin', href: '/admin' },
    { title: 'Retur Produk', href: '/admin/retur-produk' }
  ];

  const handleDelete = async (id) => {
    setDeleteItemId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const res = await fetch(`/api/return-products/${deleteItemId}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        toast.success('Data retur berhasil dihapus');
        mutate(); // Re-fetch data
      }
    } catch (err) {
      toast.error('Gagal menghapus data');
    } finally {
      setShowDeleteModal(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200';
      case 'REJECTED': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200';
      default: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className={`min-h-screen w-full px-4 sm:px-6 lg:px-8 py-8 ${userTheme.darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto">
          <Breadcrumb items={breadcrumbItems} darkMode={userTheme.darkMode} />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div>
              <h1 className={`text-3xl font-black tracking-tight ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                Manajemen Retur
              </h1>
              <p className="text-gray-500 font-medium mt-1 flex items-center">
                <RefreshCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> 
                Data diperbarui secara otomatis secara real-time
              </p>
            </div>
            <div className="flex gap-3">
               <Button className="bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 rounded-2xl py-6 px-6 font-bold">
                  <ArrowUpRight className="w-5 h-5 mr-2" /> Export Laporan
               </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[
              { label: 'Total Pengajuan', val: stats.total, color: 'blue', icon: <Inbox /> },
              { label: 'Menunggu', val: stats.pending, color: 'amber', icon: <Clock /> },
              { label: 'Disetujui', val: stats.approved, color: 'green', icon: <CheckCircle /> },
              { label: 'Ditolak', val: stats.rejected, color: 'red', icon: <XCircle /> },
            ].map((s, i) => (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={i}>
                <Card className="border-none shadow-xl rounded-3xl overflow-hidden group">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className={`p-3 rounded-2xl bg-${s.color}-100 text-${s.color}-600 dark:bg-${s.color}-900/30 dark:text-${s.color}-400`}>
                        {s.icon}
                      </div>
                      <Badge className={`bg-${s.color}-50 text-${s.color}-600 border-none font-bold`}>+0%</Badge>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{s.label}</p>
                      <h3 className="text-3xl font-black mt-1 dark:text-white">{s.val}</h3>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Main Content */}
          <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white dark:bg-gray-800 ring-1 ring-black/5">
            <CardHeader className="p-8 border-b dark:border-gray-700 flex flex-col md:flex-row justify-between gap-6">
              <div>
                <CardTitle className="text-xl font-black">Daftar Antrian Retur</CardTitle>
                <CardDescription>Kelola dan setujui pengembalian barang dari kasir</CardDescription>
              </div>
              <div className="relative md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input 
                  placeholder="Cari invoice, produk, atau pelayan..." 
                  className="pl-12 py-6 rounded-2xl border-none bg-gray-50 dark:bg-gray-700 font-medium focus:ring-2"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-gray-900/20 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                      <th className="px-8 py-5 text-left">Kode Retur</th>
                      <th className="px-6 py-5 text-left">Transaksi Asal</th>
                      <th className="px-6 py-5 text-left">Produk</th>
                      <th className="px-6 py-5 text-left">Pelayan</th>
                      <th className="px-6 py-5 text-left">Waktu</th>
                      <th className="px-6 py-5 text-left">Status</th>
                      <th className="px-8 py-5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                    <AnimatePresence>
                      {filteredReturns.length > 0 ? filteredReturns.map((ret, i) => (
                        <motion.tr 
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }} 
                          exit={{ opacity: 0 }}
                          key={ret.id} 
                          className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-all group"
                        >
                          <td className="px-8 py-6">
                            <span className="font-black text-blue-600 dark:text-blue-400">{ret.invoiceNumber || ret.id.substring(0,8)}</span>
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                               <FileText className="w-4 h-4 text-gray-400" /> {ret.transaction?.invoiceNumber || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex flex-col">
                               <span className="text-sm font-black dark:text-white">{ret.product?.name}</span>
                               <span className="text-[10px] font-bold text-gray-400 uppercase">Code: {ret.product?.productCode || '-'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex items-center gap-2">
                               <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 text-xs font-black">
                                  {ret.attendant?.name?.charAt(0)}
                               </div>
                               <span className="text-xs font-bold dark:text-gray-300">{ret.attendant?.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <span className="text-xs font-medium text-gray-500">{formatDate(ret.createdAt)}</span>
                          </td>
                          <td className="px-6 py-6">
                            <Badge className={`${getStatusStyle(ret.status)} border-2 px-3 py-1 rounded-xl font-black text-[10px]`}>
                               {ret.status}
                            </Badge>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex justify-end gap-2">
                               <Link href={`/admin/retur-produk/${ret.id}`}>
                                  <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20">
                                     <Eye className="w-5 h-5" />
                                  </Button>
                               </Link>
                               <Button 
                                 onClick={() => handleDelete(ret.id)}
                                 variant="ghost" 
                                 className="h-10 w-10 p-0 rounded-xl hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                               >
                                  <Trash2 className="w-5 h-5" />
                               </Button>
                            </div>
                          </td>
                        </motion.tr>
                      )) : (
                        <tr>
                          <td colSpan="7" className="px-8 py-20 text-center">
                             <div className="flex flex-col items-center opacity-20">
                                <PackageX className="w-20 h-20 mb-4" />
                                <p className="text-xl font-black uppercase tracking-widest">Belum Ada Data Retur</p>
                             </div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
          title="Hapus Data Retur"
          message="Apakah Anda yakin ingin menghapus data retur ini secara permanen?"
          variant="danger"
        />
      </div>
    </ProtectedRoute>
  );
}
