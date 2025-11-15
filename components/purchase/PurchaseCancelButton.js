// components/purchase/PurchaseCancelButton.js
'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';

export default function PurchaseCancelButton({ purchaseId, currentStatus, onStatusChange, darkMode = false }) {
  const [loading, setLoading] = useState(false);

  const handleCancelPurchase = async () => {
    if (currentStatus === 'CANCELLED') {
      toast.info('Pembelian sudah dibatalkan');
      return;
    }

    if (!window.confirm('Apakah Anda yakin ingin membatalkan pembelian ini? Proses ini akan mengembalikan stok produk yang dibeli.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/purchase/${purchaseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'CANCELLED'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal membatalkan pembelian');
      }

      toast.success('Pembelian berhasil dibatalkan');
      onStatusChange && onStatusChange('CANCELLED');
    } catch (error) {
      console.error('Error cancelling purchase:', error);
      toast.error(error.message || 'Gagal membatalkan pembelian');
    } finally {
      setLoading(false);
    }
  };

  // Tampilkan tombol hanya jika status saat ini bukan CANCELLED
  if (currentStatus === 'CANCELLED') {
    return null;
  }

  return (
    <button
      onClick={handleCancelPurchase}
      disabled={loading}
      className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
        loading 
          ? 'bg-gray-400 cursor-not-allowed' 
          : 'bg-red-600 hover:bg-red-700'
      } ${darkMode ? 'shadow-lg' : ''}`}
    >
      {loading ? 'Membatalkan...' : 'Batalkan Pembelian'}
    </button>
  );
}