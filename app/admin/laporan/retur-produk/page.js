'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import Breadcrumb from '@/components/Breadcrumb';
import { useState, useEffect } from 'react';
import { useUserTheme } from '@/components/UserThemeContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { PackageX, User, TrendingDown, Calendar, Download, Filter } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ReturnProductReportPage() {
  const { userTheme } = useUserTheme();
  const [reportData, setReportData] = useState(null);
  const [timeRange, setTimeRange] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const breadcrumbItems = [
    { title: 'Admin', href: '/admin' },
    { title: 'Laporan', href: '/admin/laporan' },
    { title: 'Retur Produk', href: '/admin/laporan/retur-produk' }
  ];

  // Fetch real data from API
  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const params = new URLSearchParams({
          timeRange,
          startDate,
          endDate
        });

        const response = await fetch(`/api/admin/reports/return-products?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setReportData(data);
      } catch (error) {
        console.error('Error fetching return product report:', error);
        // Set a basic error state or show error message to user
      }
    };

    fetchReportData();
  }, [timeRange, startDate, endDate]);

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e'];

  const downloadReport = () => {
    // In a real application, this would generate and download a PDF/Excel report
    alert('Fungsi download laporan akan diimplementasikan di produksi');
  };

  if (!reportData) {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <div className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${userTheme.darkMode ? 'dark' : ''}`}>
          <div className="flex items-center justify-center h-64">
            <div className={`text-center ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <LoadingSpinner />
              <p className="mt-4">Memuat laporan retur produk...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${userTheme.darkMode ? 'dark' : ''}`}>
        <Breadcrumb items={breadcrumbItems} darkMode={userTheme.darkMode} />
        
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className={`text-3xl font-bold ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                Laporan Retur Produk
              </h1>
              <p className={`mt-2 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Analisis mendalam tentang pola retur produk dan dampaknya terhadap operasional
              </p>
            </div>
            <Button onClick={downloadReport} className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Unduh Laporan</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className={`mb-6 ${userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${userTheme.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Rentang Waktu
                </label>
                <div className={`relative ${userTheme.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} border rounded-md px-3 py-2`}>
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className={`w-full bg-transparent outline-none text-sm ${
                      userTheme.darkMode ? 'text-white' : 'text-gray-900'
                    } appearance-none`}
                  >
                    <option value="daily">Harian</option>
                    <option value="weekly">Mingguan</option>
                    <option value="monthly">Bulanan</option>
                    <option value="quarterly">Triwulan</option>
                    <option value="yearly">Tahunan</option>
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
                <label className={`block text-sm font-medium mb-2 ${userTheme.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Tanggal Mulai
                </label>
                <div className="relative">
                  <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 rounded-md border ${userTheme.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${userTheme.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Tanggal Akhir
                </label>
                <div className="relative">
                  <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 rounded-md border ${userTheme.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
              </div>
              
              <div className="flex items-end">
                <Button className="w-full flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <span>Terapkan Filter</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className={`${userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="pb-3">
              <CardTitle className={`text-sm font-medium ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Total Retur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                {reportData.summary.totalReturns}
              </div>
              <TrendingDown className={`h-4 w-4 mt-2 ${userTheme.darkMode ? 'text-red-400' : 'text-red-500'}`} />
            </CardContent>
          </Card>

          <Card className={`${userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="pb-3">
              <CardTitle className={`text-sm font-medium ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Disetujui
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                {reportData.summary.totalApproved}
              </div>
              <div className={`text-sm ${userTheme.darkMode ? 'text-green-400' : 'text-green-500'}`}>
                {Math.round((reportData.summary.totalApproved / reportData.summary.totalReturns) * 100)}%
              </div>
            </CardContent>
          </Card>

          <Card className={`${userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="pb-3">
              <CardTitle className={`text-sm font-medium ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Ditolak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                {reportData.summary.totalRejected}
              </div>
              <div className={`text-sm ${userTheme.darkMode ? 'text-red-400' : 'text-red-500'}`}>
                {Math.round((reportData.summary.totalRejected / reportData.summary.totalReturns) * 100)}%
              </div>
            </CardContent>
          </Card>

          <Card className={`${userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="pb-3">
              <CardTitle className={`text-sm font-medium ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Nilai Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(reportData.summary.totalValue)}
              </div>
              <div className={`text-sm ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Dampak finansial
              </div>
            </CardContent>
          </Card>

          <Card className={`${userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="pb-3">
              <CardTitle className={`text-sm font-medium ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Rata-rata Proses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                {reportData.summary.avgProcessingTime} hr
              </div>
              <div className={`text-sm ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Waktu penyelesaian
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Category Distribution */}
          <Card className={userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
            <CardHeader>
              <CardTitle className={userTheme.darkMode ? 'text-white' : 'text-gray-900'}>
                Distribusi Berdasarkan Kategori
              </CardTitle>
              <CardDescription>
                Sebaran jenis retur produk
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportData.byCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {reportData.byCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value} retur`, 'Jumlah']}
                      labelFormatter={(name) => `Kategori: ${name}`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Trends */}
          <Card className={userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
            <CardHeader>
              <CardTitle className={userTheme.darkMode ? 'text-white' : 'text-gray-900'}>
                Tren Bulanan
              </CardTitle>
              <CardDescription>
                Perkembangan jumlah retur sepanjang waktu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={reportData.byMonth}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={userTheme.darkMode ? '#4b5563' : '#d1d5db'} />
                    <XAxis dataKey="month" stroke={userTheme.darkMode ? '#9ca3af' : '#6b7280'} />
                    <YAxis stroke={userTheme.darkMode ? '#9ca3af' : '#6b7280'} />
                    <Tooltip 
                      contentStyle={userTheme.darkMode ? { backgroundColor: '#374151', borderColor: '#4b5563' } : {}} 
                      labelStyle={userTheme.darkMode ? { color: 'white' } : {}}
                    />
                    <Legend />
                    <Bar dataKey="returns" name="Total Retur" fill={userTheme.darkMode ? '#ef4444' : '#dc2626'} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="approved" name="Disetujui" fill={userTheme.darkMode ? '#22c55e' : '#16a34a'} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="rejected" name="Ditolak" fill={userTheme.darkMode ? '#f59e0b' : '#f59e0b'} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendant Performance */}
        <Card className={userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
          <CardHeader>
            <CardTitle className={userTheme.darkMode ? 'text-white' : 'text-gray-900'}>
              Kinerja Pelayan Berdasarkan Retur
            </CardTitle>
            <CardDescription>
              Analisis dampak retur terhadap kinerja masing-masing pelayan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${userTheme.darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <th className="text-left py-3 px-4 font-medium">Pelayan</th>
                    <th className="text-left py-3 px-4 font-medium">Jumlah Retur</th>
                    <th className="text-left py-3 px-4 font-medium">Disetujui</th>
                    <th className="text-left py-3 px-4 font-medium">Ditolak</th>
                    <th className="text-left py-3 px-4 font-medium">Rasio Disetujui</th>
                    <th className="text-left py-3 px-4 font-medium">Nilai Kinerja</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.byAttendant.map((attendant, index) => {
                    const approvalRate = attendant.approved / attendant.returns * 100;
                    let performanceRating = '';
                    let ratingColor = '';
                    
                    if (approvalRate >= 75) {
                      performanceRating = 'Perlu Perhatian';
                      ratingColor = userTheme.darkMode ? 'text-red-400' : 'text-red-600';
                    } else if (approvalRate >= 50) {
                      performanceRating = 'Waspada';
                      ratingColor = userTheme.darkMode ? 'text-yellow-400' : 'text-yellow-600';
                    } else {
                      performanceRating = 'Baik';
                      ratingColor = userTheme.darkMode ? 'text-green-400' : 'text-green-600';
                    }
                    
                    return (
                      <tr key={index} className={`border-b ${userTheme.darkMode ? 'border-gray-700 hover:bg-gray-750' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <User className={`h-5 w-5 mr-2 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            <span>{attendant.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">{attendant.returns}</td>
                        <td className="py-3 px-4">{attendant.approved}</td>
                        <td className="py-3 px-4">{attendant.rejected}</td>
                        <td className="py-3 px-4">{approvalRate.toFixed(1)}%</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${
                            ratingColor.includes('red') ? 'bg-red-100 text-red-800 border-red-200' :
                            ratingColor.includes('yellow') ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            'bg-green-100 text-green-800 border-green-200'
                          }`}>
                            {performanceRating}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}