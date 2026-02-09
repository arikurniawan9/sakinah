// app/page.js - versi sederhana untuk testing
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-gray-800 text-white p-4">
        <div className="container mx-auto">
          <h1 className="text-xl font-bold">Sakinah - Aplikasi Kasir</h1>
        </div>
      </header>
      
      <main className="container mx-auto p-4">
        <div className="text-center py-10">
          <h2 className="text-3xl font-bold mb-4">Selamat Datang di Sakinah</h2>
          <p className="text-lg mb-6">Sistem Informasi Penjualan & Inventaris Multi-Toko</p>
          
          <div className="space-x-4">
            {status === 'authenticated' ? (
              <div>
                <p>Sudah login sebagai {session?.user?.name}</p>
                <Link href="/admin" className="text-blue-500 hover:underline">
                  Ke Dashboard
                </Link>
              </div>
            ) : (
              <Link 
                href="/login" 
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </main>
      
      <footer className="bg-gray-800 text-white p-4 mt-10">
        <div className="container mx-auto text-center">
          &copy; 2025 Sakinah. All rights reserved.
        </div>
      </footer>
    </div>
  );
}