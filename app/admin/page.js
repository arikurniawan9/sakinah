// app/admin/page.js
'use client';

import dynamic from 'next/dynamic';
import ProtectedRoute from '../../components/ProtectedRoute';
import Breadcrumb from '@/components/Breadcrumb';
import { useUserTheme } from '@/components/UserThemeContext';

const Dashboard = dynamic(() => import('../../components/admin/Dashboard'), {
  ssr: false,
  loading: () => <div className="animate-pulse h-screen bg-gray-100 dark:bg-gray-800 rounded-xl m-4"></div>
});

export default function AdminDashboardPage() {
    const { userTheme } = useUserTheme();

  return (
    <ProtectedRoute requiredRole="ADMIN">
       <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
            <Breadcrumb items={[]} basePath="/admin" darkMode={userTheme.darkMode} />
            <Dashboard />
       </div>
    </ProtectedRoute>
  );
}