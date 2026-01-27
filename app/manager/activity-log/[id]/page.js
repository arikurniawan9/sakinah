'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ROLES } from '@/lib/constants';
import { ArrowLeft, User, Store, Clock, Activity, FileText, Info, Hash } from 'lucide-react';
import { useUserTheme } from '@/components/UserThemeContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import ActivityDiffViewer from '@/components/manager/ActivityDiffViewer';

export default function ActivityDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = useParams();
  const { userTheme } = useUserTheme();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fungsi untuk menerjemahkan label aksi ke dalam bahasa Indonesia
  const translateActionLabel = (action, entity) => {
    const actionMap = {
      'CREATE': 'membuat', 'UPDATE': 'memperbarui', 'DELETE': 'menghapus',
      'LOGIN': 'masuk ke sistem', 'LOGOUT': 'keluar dari sistem',
      'DEACTIVATE': 'menonaktifkan', 'ACTIVATE': 'mengaktifkan',
      'TRANSFER': 'mentransfer',
    };
    const entityMap = {
      'SALE': 'sebuah penjualan', 'PRODUCT': 'sebuah produk', 'USER': 'seorang pengguna',
      'STORE': 'sebuah toko', 'CATEGORY': 'sebuah kategori', 'SUPPLIER': 'seorang supplier',
      'WAREHOUSE': 'sebuah gudang', 'MEMBER': 'seorang member', 'EXPENSE': 'sebuah pengeluaran',
      'DISTRIBUTION': 'sebuah distribusi', 'WAREHOUSE_DISTRIBUTION': 'sebuah distribusi gudang',
      'default': 'sebuah entitas'
    };
    
    const actionText = actionMap[action] || action.toLowerCase();
    const entityText = entityMap[entity] || entityMap['default'];

    return `${actionText} ${entityText}`;
  };

  const getItemName = (activity) => {
    if (!activity) return 'Entitas';
    
    try {
        const data = activity.newValue ? JSON.parse(activity.newValue) : (activity.oldValue ? JSON.parse(activity.oldValue) : null);
        if (data) {
            if (data.name) return data.name;
            if (data.invoiceNumber) return `Faktur #${data.invoiceNumber}`;
            if (data.username) return data.username;
        }
    } catch(e) {
        // ignore parsing error
    }

    return activity.entity;
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session.user.role !== ROLES.MANAGER && session.user.role !== ROLES.ADMIN) {
      router.push('/unauthorized');
      return;
    }

    if (status === 'authenticated') {
      const fetchActivity = async () => {
        try {
          const response = await fetch(`/api/manager/activity-logs/${id}`);
          if (!response.ok) {
            throw new Error('Gagal mengambil data aktivitas');
          }
          const data = await response.json();
          setActivity(data.activity);
        } catch (error) {
          console.error('Error fetching activity:', error);
          // Optionally, show a toast notification for the error
        } finally {
          setLoading(false);
        }
      };
      fetchActivity();
    }
  }, [status, session, id, router]);

  if (loading || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Aktivitas Tidak Ditemukan</h2>
          <p className="mt-1 text-sm text-gray-500">Log aktivitas yang Anda cari tidak ada atau telah dihapus.</p>
          <button
            onClick={() => router.back()}
            className="mt-6 inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const summaryText = `${activity.user?.name || 'Sistem'} telah ${translateActionLabel(activity.action, activity.entity)} "${getItemName(activity)}".`;

  return (
    <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 ${userTheme.darkMode ? 'dark' : ''}`}>
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Log Aktivitas
        </button>
      </div>

      {/* --- Card Ringkasan --- */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-8">
        <div className="p-6">
          <p className="text-lg text-gray-800 dark:text-gray-200 leading-relaxed">
            {summaryText}
          </p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-1.5" />
              <span>{activity.user?.name || 'Sistem'} ({activity.user?.role || 'SYSTEM'})</span>
            </div>
            <div className="flex items-center">
              <Store className="h-4 w-4 mr-1.5" />
              <span>{activity.store?.name || 'Global'}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1.5" />
              <time dateTime={activity.createdAt}>
                {new Date(activity.createdAt).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
              </time>
            </div>
          </div>
        </div>
      </div>

      {/* --- Card Perubahan Data --- */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-8">
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Activity className="h-5 w-5 mr-3" />
            Detail Perubahan Data
          </h3>
        </div>
        <div className="p-6">
          <ActivityDiffViewer 
            oldValue={activity.oldValue} 
            newValue={activity.newValue}
            entity={activity.entity}
          />
        </div>
      </div>
      
      {/* --- Card Metadata --- */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Info className="h-5 w-5 mr-3" />
            Metadata
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex">
                <Hash className="h-4 w-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                <div>
                    <p className="text-gray-500 dark:text-gray-400">ID Aktivitas</p>
                    <p className="font-mono text-gray-800 dark:text-gray-200">{activity.id}</p>
                </div>
            </div>
            <div className="flex">
                <Hash className="h-4 w-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                <div>
                    <p className="text-gray-500 dark:text-gray-400">ID Entitas</p>
                    <p className="font-mono text-gray-800 dark:text-gray-200">{activity.entityId}</p>
                </div>
            </div>
            <div className="flex">
                <Hash className="h-4 w-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                <div>
                    <p className="text-gray-500 dark:text-gray-400">Alamat IP</p>
                    <p className="font-mono text-gray-800 dark:text-gray-200">{activity.ipAddress || '-'}</p>
                </div>
            </div>
            <div className="flex col-span-1 sm:col-span-2">
                 <Hash className="h-4 w-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                 <div>
                    <p className="text-gray-500 dark:text-gray-400">User Agent</p>
                    <p className="font-mono text-gray-800 dark:text-gray-200 break-all">{activity.userAgent || '-'}</p>
                </div>
            </div>
        </div>
      </div>

    </div>
  );
}