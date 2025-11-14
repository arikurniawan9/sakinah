// components/kasir/transaksi/UndoTransactionButton.js
'use client';

import { Undo2 } from 'lucide-react';
import { useState } from 'react';
import ConfirmationModal from '@/components/ConfirmationModal';

const UndoTransactionButton = ({ 
  saleId, 
  invoiceNumber, 
  onUndo, 
  disabled = false, 
  darkMode = false 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);

  const handleUndo = async () => {
    setIsUndoing(true);
    try {
      const response = await fetch('/api/transaksi/undo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ saleId }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Transaksi ${invoiceNumber} berhasil dibatalkan.`);
        onUndo && onUndo();
      } else {
        alert(`Gagal membatalkan transaksi: ${result.error}`);
      }
    } catch (error) {
      console.error('Error undoing transaction:', error);
      alert('Terjadi kesalahan saat membatalkan transaksi.');
    } finally {
      setIsUndoing(false);
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={disabled}
        className={`p-2 rounded-md ${
          disabled 
            ? (darkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-500 cursor-not-allowed')
            : (darkMode ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-red-600 hover:bg-red-500 text-white')
        } transition-colors`}
        title="Batalkan Transaksi (dalam 5 menit pertama)"
      >
        <Undo2 className="h-4 w-4" />
      </button>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleUndo}
        title="Batalkan Transaksi"
        message={
          <div>
            <p className="mb-2">Anda akan membatalkan transaksi berikut:</p>
            <div className={`p-3 rounded-md text-left ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <p className="font-semibold">No. Invoice: {invoiceNumber}</p>
              <p className="text-sm mt-1">Peringatan: Fitur ini hanya tersedia dalam 5 menit pertama setelah transaksi.</p>
            </div>
            <p className="mt-3 text-red-500 font-medium">Tindakan ini akan mengembalikan stok produk dan menghapus transaksi. Lanjutkan?</p>
          </div>
        }
        confirmText="Batalkan Transaksi"
        cancelText="Batal"
        isLoading={isUndoing}
        variant="danger"
        darkMode={darkMode}
      />
    </>
  );
};

export default UndoTransactionButton;