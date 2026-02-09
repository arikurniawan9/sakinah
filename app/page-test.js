'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomeTest() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Jika sedang loading, tampilkan loading
  if (status === 'loading' || !isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-blue-700 dark:text-blue-300">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Halaman Uji - Status: {status}
          </h1>
          
          {status !== 'authenticated' && (
            <div>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Anda belum login. Ini adalah halaman publik.
              </p>
              <Link
                href="/login"
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Login
              </Link>
            </div>
          )}

          {status === 'authenticated' && (
            <div>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Anda sudah login sebagai {session?.user?.name} ({session?.user?.role})
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                Selamat datang di dashboard Anda.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}