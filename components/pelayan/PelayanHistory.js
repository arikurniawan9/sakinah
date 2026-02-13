// components/pelayan/PelayanHistory.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Search, Calendar, User, Package, Clock, CheckCircle, AlertCircle, Eye, RefreshCw, Trash2 } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';
import { toast } from 'react-toastify';

const PelayanHistory = ({ 
  darkMode, 
  attendantId, 
  externalData = null, 
  isLoadingExternal = false,
  onRefresh = null 
}) => {
  const { data: session } = useSession();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchHistory = useCallback(async () => {
    // Jika ada data eksternal, gunakan itu
    if (externalData) {
      setHistory(externalData);
      setLoading(isLoadingExternal);
      return;
    }

    if (!attendantId || !session?.user?.storeId) return;

    setLoading(true);
    setError(null);
    try {
      // Fetch Suspended Sales (Aktif)
      const suspendedUrl = `/api/suspended-sales?attendantId=${attendantId}&storeId=${session.user.storeId}`;
      const suspendedRes = await fetch(suspendedUrl);
      const suspendedData = await suspendedRes.json();
      const activeSales = (suspendedData.suspendedSales || []).map(s => ({ ...s, isCompleted: false, statusLabel: 'Aktif', type: 'SUSPENDED' }));

      // Fetch Completed Sales (Selesai)
      const completedUrl = `/api/kasir/transaksi?attendantId=${attendantId}&storeId=${session.user.storeId}&limit=100`;
      const completedRes = await fetch(completedUrl);
      const completedData = await completedRes.json();
      const finishedSales = (completedData.transactions || []).map(s => ({
        id: s.id,
        name: s.invoiceNumber,
        customerName: s.member?.name || 'Pelanggan Umum',
        createdAt: s.date || s.createdAt,
        totalItems: (s.saleDetails || []).reduce((acc, item) => acc + (item.quantity || 0), 0),
        isCompleted: true,
        statusLabel: 'Selesai',
        type: 'SALE'
      }));

      const combined = [...activeSales, ...finishedSales].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setHistory(combined);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [attendantId, session, externalData, isLoadingExternal]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, externalData, isLoadingExternal]);

  const filteredHistory = history.filter(item => {
    const nameToSearch = item.name || '';
    const customerToSearch = item.customerName || '';
    
    const matchesSearch = !searchTerm || 
      nameToSearch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerToSearch.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !dateFilter || 
      new Date(item.createdAt).toDateString() === new Date(dateFilter).toDateString();
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && !item.isCompleted) ||
      (statusFilter === 'completed' && item.isCompleted);
    
    return matchesSearch && matchesDate && matchesStatus;
  });

  const getStatusColor = (isCompleted) => {
    if (isCompleted) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const handleDeleteSuspended = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus daftar belanja ini?')) return;
    try {
      const res = await fetch(`/api/suspended-sales?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Berhasil menghapus');
        if (onRefresh) onRefresh(); else fetchHistory();
      }
    } catch (err) { toast.error('Gagal menghapus'); }
  };

  if (loading || isLoadingExternal) return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center">
          <Package className="mr-2 h-5 w-5 text-purple-500" /> Daftar Aktivitas
        </h2>
        <button onClick={onRefresh || fetchHistory} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Cari invoice/pelanggan..." className={`w-full pl-10 pr-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="date" className={`w-full pl-10 pr-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
          </div>
          <select className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Semua Status</option>
            <option value="active">Aktif (Belum Bayar)</option>
            <option value="completed">Selesai (Sudah Bayar)</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 opacity-50"><Package className="h-12 w-12 mx-auto mb-2" /><p>Tidak ada histori transaksi</p></div>
        ) : (
          filteredHistory.map((item) => (
            <div key={`${item.type}-${item.id}`} className={`p-4 rounded-xl border transition-all hover:shadow-md ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} ${item.isCompleted ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-amber-500'}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-bold">{item.isCompleted ? item.name : (item.name || 'Daftar Belanja')}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(item.isCompleted)}`}>{item.statusLabel}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center"><User className="h-4 w-4 mr-1" />{item.customerName || 'Pelanggan Umum'}</div>
                    <div className="flex items-center"><Clock className="h-4 w-4 mr-1" />{formatDate(item.createdAt)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-purple-500">{item.totalItems || 0} Item</div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t dark:border-gray-700 flex justify-end gap-2">
                {item.isCompleted ? (
                  <button className="flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-500 text-white hover:bg-blue-600 transition-colors" onClick={() => toast.info('Detail transaksi sedang disiapkan')}><Eye className="h-3.5 w-3.5 mr-1" /> Detail</button>
                ) : (
                  <>
                    <button className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 transition-colors" onClick={() => toast.info('Lanjutkan di menu utama')}>Lanjutkan</button>
                    <button className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" onClick={() => handleDeleteSuspended(item.id)}><Trash2 className="h-4 w-4" /></button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PelayanHistory;