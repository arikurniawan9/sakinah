'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import Breadcrumb from '@/components/Breadcrumb';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserTheme } from '@/components/UserThemeContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PackageX, Bell, CheckCircle, XCircle, Clock, User, Package, Calendar, Eye, Archive, Filter } from 'lucide-react';

export default function ReturnNotificationPage() {
  const { userTheme } = useUserTheme();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterUnread, setFilterUnread] = useState(false);
  const [loading, setLoading] = useState(true);

  const breadcrumbItems = [
    { title: 'Admin', href: '/admin' },
    { title: 'Notifikasi Retur', href: '/admin/notifikasi-retur' }
  ];

  // Fetch data from API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);

        // Dalam implementasi nyata, ini akan mengambil dari endpoint notifikasi retur
        // Untuk saat ini, kita ambil data retur yang belum diproses
        const response = await fetch('/api/return-products?status=PENDING');
        const result = await response.json();

        if (result.success) {
          // Format data untuk notifikasi
          const formattedNotifications = Array.isArray(result.data) ? result.data.map(item => ({
            id: item.id,
            returnId: item.id,
            transactionId: item.transactionId,
            productName: item.product?.name || item.productName || 'Produk tidak ditemukan',
            customerName: item.transaction?.member?.name || 'Umum',
            attendantName: item.attendant?.name || item.attendantName || 'Pelayan tidak ditemukan',
            reason: item.reason || 'Tidak ada alasan',
            category: item.category || 'OTHERS',
            status: item.status || 'PENDING',
            isRead: false, // Dalam implementasi nyata, ini akan diambil dari sistem notifikasi
            createdAt: item.createdAt,
            priority: item.category === 'PRODUCT_DEFECT' ? 'high' : 'medium'
          })) : [];

          setNotifications(formattedNotifications);
          setFilteredNotifications(formattedNotifications);
        } else {
          console.error('Failed to fetch notifications:', result.message);
          // Setel ke array kosong jika gagal
          setNotifications([]);
          setFilteredNotifications([]);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        // Setel ke array kosong jika terjadi error
        setNotifications([]);
        setFilteredNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Apply filters
  useEffect(() => {
    let result = notifications;
    
    // Apply status filter
    if (filterStatus !== 'ALL') {
      result = result.filter(notif => notif.status === filterStatus);
    }
    
    // Apply unread filter
    if (filterUnread) {
      result = result.filter(notif => !notif.isRead);
    }
    
    setFilteredNotifications(result);
  }, [filterStatus, filterUnread, notifications]);

  const markAsRead = (notificationId) => {
    setNotifications(prev => prev.map(notif =>
      notif.id === notificationId ? {...notif, isRead: true} : notif
    ));
    setFilteredNotifications(prev => prev.map(notif =>
      notif.id === notificationId ? {...notif, isRead: true} : notif
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({...notif, isRead: true})));
    setFilteredNotifications(prev => prev.map(notif => ({...notif, isRead: true})));
  };

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

  const getPriorityBadgeVariant = (priority) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
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
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewReturn = (returnId) => {
    router.push(`/admin/retur-produk/${returnId}`);
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${userTheme.darkMode ? 'dark' : ''}`}>
        <Breadcrumb items={breadcrumbItems} darkMode={userTheme.darkMode} />
        
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className={`text-3xl font-bold ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                Notifikasi Retur Produk
              </h1>
              <p className={`mt-2 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Daftar permintaan retur produk yang menunggu persetujuan
              </p>
            </div>
            <Button onClick={markAllAsRead} variant="outline" className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>Tandai Semua Sudah Dibaca</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className={`${userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Total Notifikasi
              </CardTitle>
              <Bell className={`h-4 w-4 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                {notifications.length}
              </div>
              <p className={`text-xs ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Semua notifikasi
              </p>
            </CardContent>
          </Card>

          <Card className={`${userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Belum Dibaca
              </CardTitle>
              <Clock className={`h-4 w-4 ${userTheme.darkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                {notifications.filter(n => !n.isRead).length}
              </div>
              <p className={`text-xs ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Menunggu perhatian
              </p>
            </CardContent>
          </Card>

          <Card className={`${userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Prioritas Tinggi
              </CardTitle>
              <PackageX className={`h-4 w-4 ${userTheme.darkMode ? 'text-red-400' : 'text-red-500'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                {notifications.filter(n => n.priority === 'high').length}
              </div>
              <p className={`text-xs ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Perlu segera ditindak
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
                {notifications.filter(n => n.status === 'PENDING').length}
              </div>
              <p className={`text-xs ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Permintaan menunggu
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className={`mb-6 ${userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${userTheme.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Status
                </label>
                <div className="flex space-x-2">
                  <Button 
                    variant={filterStatus === 'ALL' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setFilterStatus('ALL')}
                    className="flex-1"
                  >
                    Semua
                  </Button>
                  <Button 
                    variant={filterStatus === 'PENDING' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setFilterStatus('PENDING')}
                    className="flex-1"
                  >
                    Menunggu
                  </Button>
                  <Button 
                    variant={filterStatus === 'APPROVED' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setFilterStatus('APPROVED')}
                    className="flex-1"
                  >
                    Disetujui
                  </Button>
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${userTheme.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Prioritas
                </label>
                <div className="flex space-x-2">
                  <Button 
                    variant={filterUnread ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setFilterUnread(!filterUnread)}
                    className="flex-1"
                  >
                    Belum Dibaca
                  </Button>
                </div>
              </div>
              
              <div className="flex items-end">
                <Button variant="outline" className="w-full flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <span>Filter Lanjutan</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card className={userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
          <CardHeader>
            <CardTitle className={userTheme.darkMode ? 'text-white' : 'text-gray-900'}>
              Daftar Notifikasi
            </CardTitle>
            <CardDescription>
              {filteredNotifications.length} dari {notifications.length} notifikasi ditemukan
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <PackageX className={`h-12 w-12 mx-auto mb-4 ${userTheme.darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <p className={`text-lg ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Tidak ada notifikasi retur produk
                </p>
                <p className={`mt-2 ${userTheme.darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Semua permintaan retur telah ditangani
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-4 rounded-lg border ${notification.isRead 
                      ? (userTheme.darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50') 
                      : (userTheme.darkMode ? 'border-blue-500 bg-gray-800' : 'border-blue-300 bg-blue-50')}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className={`font-medium truncate ${notification.isRead 
                            ? (userTheme.darkMode ? 'text-gray-300' : 'text-gray-700') 
                            : (userTheme.darkMode ? 'text-white' : 'text-gray-900')}`}>
                            Retur Produk: {notification.productName}
                          </h3>
                          {!notification.isRead && (
                            <div className={`w-2 h-2 rounded-full ${userTheme.darkMode ? 'bg-blue-400' : 'bg-blue-500'}`}></div>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            notification.priority === 'high' ? 'bg-red-100 text-red-800' :
                            notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {notification.priority === 'high' ? 'Tinggi' :
                             notification.priority === 'medium' ? 'Sedang' : 'Rendah'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center">
                            <Package className={`h-4 w-4 mr-2 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            <span>ID: {notification.transactionId}</span>
                          </div>
                          <div className="flex items-center">
                            <User className={`h-4 w-4 mr-2 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            <span>{notification.customerName}</span>
                          </div>
                          <div className="flex items-center">
                            <User className={`h-4 w-4 mr-2 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            <span>Pelayan: {notification.attendantName}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className={`h-4 w-4 mr-2 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            <span>{formatDate(notification.createdAt)}</span>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex flex-wrap items-center gap-4">
                          <div>
                            <span className={`text-xs ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Kategori:</span>
                            <span className="ml-2 px-2 py-1 rounded-full text-xs font-semibold border border-gray-300 bg-gray-100 text-gray-800">
                              {getCategoryLabel(notification.category)}
                            </span>
                          </div>
                          
                          <div>
                            <span className={`text-xs ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status:</span>
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                              notification.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                              notification.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              notification.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {notification.status === 'APPROVED' ? 'Disetujui' :
                               notification.status === 'PENDING' ? 'Menunggu' :
                               notification.status === 'REJECTED' ? 'Ditolak' : notification.status}
                            </span>
                          </div>
                          
                          <div className="flex-1"></div>
                          
                          <p className={`text-sm ${userTheme.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <span className="font-medium">Alasan:</span> {notification.reason}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-2 ml-4">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            markAsRead(notification.id);
                            handleViewReturn(notification.returnId);
                          }}
                          className="flex items-center space-x-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Lihat</span>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => markAsRead(notification.id)}
                          className="flex items-center space-x-1"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Tandai</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}