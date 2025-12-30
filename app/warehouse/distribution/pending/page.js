'use client';

import { useSession } from 'next-auth/react';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import { useUserTheme } from '../../../../components/UserThemeContext';
import Breadcrumb from '../../../../components/Breadcrumb';
import { Package, AlertTriangle } from 'lucide-react';

export default function PendingDistributionsPage() {
  const { data: session } = useSession();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;

  const breadcrumbItems = [
    { title: 'Dashboard Gudang', href: '/warehouse' },
    { title: 'Distribusi ke Toko', href: '/warehouse/distribution' },
    { title: 'Distribusi Tertunda', href: '/warehouse/distribution/pending' }
  ];

  return (
    <ProtectedRoute requiredRole="WAREHOUSE">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={breadcrumbItems} darkMode={darkMode} />

        <div className="mb-6">
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Distribusi Tertunda
          </h1>
        </div>

        <div className={`rounded-xl shadow-lg p-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="text-center">
            <AlertTriangle className={`h-16 w-16 mx-auto ${darkMode ? 'text-yellow-500' : 'text-yellow-600'}`} />
            <h3 className={`mt-4 text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Halaman Tidak Tersedia
            </h3>
            <p className={`mt-2 max-w-2xl mx-auto ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Konfirmasi penerimaan distribusi dilakukan oleh admin toko, bukan oleh gudang.
              Gudang hanya bertugas mengirimkan distribusi ke toko-toko.
            </p>
            <div className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <strong>Informasi:</strong> Distribusi yang dikirim oleh gudang akan muncul di halaman
                &quot;Distribusi Menunggu Konfirmasi&quot; pada masing-masing toko.
                Admin toko yang akan melakukan konfirmasi penerimaan atau penolakan.
              </p>
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}