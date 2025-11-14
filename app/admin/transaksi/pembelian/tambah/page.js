// app/admin/transaksi/pembelian/tambah/page.js
// Ini akan menjadi redirect ke halaman utama pembelian
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AddPurchasePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect ke halaman transaksi pembelian utama
    router.push('/admin/transaksi/pembelian');
  }, [router]);

  return null;
}