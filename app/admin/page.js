// app/admin/page.js
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { subDays } from 'date-fns';

import ProtectedRoute from '../../components/ProtectedRoute';
import { useDarkMode } from '../../components/DarkModeContext';
import useDashboardData from '../../lib/hooks/useDashboardData';
import StatCard from '../../components/admin/StatCard';
import RecentActivityTable from '../../components/admin/RecentActivityTable';
import Breadcrumb from '../../components/Breadcrumb';
import BestSellingProductsTable from '../../components/admin/BestSellingProductsTable';
import {
  ShoppingBag,
  Users,
  CreditCard,
  UserRound,
  DollarSign,
  TrendingUp,
  CalendarIcon
} from 'lucide-react';

// Helper to format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

export default function AdminDashboard() {
  const { data: session } = useSession();
  const { darkMode } = useDarkMode();
  
  const [startDate, setStartDate] = useState(subDays(new Date(), 6));
  const [endDate, setEndDate] = useState(new Date());

  const {
    totalSales,
    totalProfit,
    totalTransactions,
    totalProductsCount,
    totalMembersCount,
    activeEmployeesCount,
    recentActivitiesData,
    bestSellingProducts,
    loading,
    error,
  } = useDashboardData(startDate, endDate);

  const breadcrumbItems = [{ title: 'Dashboard', href: '/admin' }];

  const renderLoadingSkeleton = () => (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <h2 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-6`}>Memuat Data Dasbor...</h2>
      {/* Skeleton for stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`p-6 rounded-xl shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
       {/* Skeleton for chart */}
      <div className={`rounded-xl shadow ${darkMode ? 'bg-gray-800' : 'bg-white'} h-80 animate-pulse mb-8`}></div>
    </main>
  );

  if (error) {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb items={breadcrumbItems} darkMode={darkMode} />
          <div className="text-center py-10">
            <h2 className="text-2xl font-semibold text-red-500">Gagal memuat data</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">{error.message}</p>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={breadcrumbItems} darkMode={darkMode} />

        {/* Header and Date Picker */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h2 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Dasbor Analitik
          </h2>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <CalendarIcon className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              className={`p-2 rounded-md border w-32 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              dateFormat="dd/MM/yyyy"
            />
            <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>-</span>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              className={`p-2 rounded-md border w-32 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              dateFormat="dd/MM/yyyy"
            />
          </div>
        </div>

        {/* Stats for Selected Range */}
        <div className="mb-8">
          <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4`}>Statistik Rentang Terpilih</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard title="Total Penjualan" value={formatCurrency(totalSales)} icon={DollarSign} darkMode={darkMode} loading={loading} />
            <StatCard title="Total Keuntungan" value={formatCurrency(totalProfit)} icon={TrendingUp} darkMode={darkMode} loading={loading} />
            <StatCard title="Total Transaksi" value={totalTransactions} icon={CreditCard} darkMode={darkMode} loading={loading} />
          </div>
        </div>

        {/* System Summary */}
        <div className="mb-8">
          <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4`}>Ringkasan Sistem</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard title="Total Produk" value={totalProductsCount} icon={ShoppingBag} darkMode={darkMode} href="/admin/produk" loading={loading} />
            <StatCard title="Total Member" value={totalMembersCount} icon={UserRound} darkMode={darkMode} href="/admin/member" loading={loading} />
            <StatCard title="Karyawan Aktif" value={activeEmployeesCount} icon={Users} darkMode={darkMode} href="/admin/pelayan" loading={loading} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <BestSellingProductsTable products={bestSellingProducts} darkMode={darkMode} loading={loading} />
          <RecentActivityTable recentActivitiesData={recentActivitiesData} darkMode={darkMode} loading={loading} />
        </div>
      </main>
    </ProtectedRoute>
  );
}