'use client';

import { useState, useEffect, useRef } from 'react';
import DistributionReceipt from '../warehouse/DistributionReceipt';
import DistributionInvoice from '../warehouse/DistributionInvoice';
import { Printer, X } from 'lucide-react';
import { useUserTheme } from '../UserThemeContext';

const DistributionReceiptModal = ({ distributionData, isOpen, onClose }) => {
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const receiptRef = useRef();
  const invoiceRef = useRef();
  const [printType, setPrintType] = useState('receipt'); // 'receipt' or 'invoice'

  // Fungsi cetak yang lebih aman
  const handlePrint = () => {
    if (!distributionData) {
      console.error('Distribution data is not available');
      return;
    }

    let printComponentRef = null;
    let documentTitle = '';

    if (printType === 'receipt') {
      printComponentRef = receiptRef.current;
      documentTitle = `Struk Distribusi - ${distributionData.id || 'N/A'}`;
    } else {
      printComponentRef = invoiceRef.current;
      documentTitle = `Faktur Distribusi - ${distributionData.invoiceNumber || distributionData.id || 'N/A'}`;
    }

    if (!printComponentRef) {
      console.error('Print component reference is not available');
      return;
    }

    // Membuat jendela cetak baru
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Mohon izinkan popup untuk mencetak dokumen');
      return;
    }

    // Style untuk cetakan
    let pageStyle = '';
    if (printType === 'receipt') {
      pageStyle = `
        @page {
          size: 80mm auto;
          margin: 0.25in 0.25in 0.25in 0.25in;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `;
    } else {
      pageStyle = `
        @page {
          size: A4;
          margin: 0.4in 0.4in 0.4in 0.4in;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `;
    }

    // Isi dokumen cetak
    const printContent = printComponentRef.innerHTML;

    // Styling dasar untuk cetakan
    const basicStyles = `
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #000;
          background: #fff;
        }
        ${pageStyle}
        /* Styling tambahan untuk memastikan tampilan tetap bagus di mode cetak */
        .print\\:hidden { display: none !important; }
        .print\\:block { display: block !important; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; padding: 8px; }
        .border, .border-t, .border-b, .border-l, .border-r {
          border: 1px solid #000 !important;
        }
      </style>
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>${documentTitle}</title>
          ${basicStyles}
        </head>
        <body>${printContent}</body>
      </html>
    `);
    printWindow.document.close();

    // Tunggu sedikit agar konten dimuat, lalu cetak
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
      onClose(); // Tutup modal setelah cetak
    }, 500);
  };

  // Handle ESC key press to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !distributionData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100] print:flex print:items-center print:justify-center print:inset-0 print:bg-white">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto print:max-w-none print:w-full print:max-h-none print:m-0 print:p-0 print:shadow-none`}>
        <div className="p-6 print:p-0 print:overflow-visible">
          {/* Header */}
          <div className="flex justify-between items-center mb-4 print:hidden">
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Cetak Distribusi Produk
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Print Type Selector */}
          <div className="mb-4 print:hidden">
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Pilih Jenis Cetakan:
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio h-4 w-4 text-blue-600"
                  checked={printType === 'receipt'}
                  onChange={() => setPrintType('receipt')}
                />
                <span className={`ml-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Struk (80mm)</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio h-4 w-4 text-blue-600"
                  checked={printType === 'invoice'}
                  onChange={() => setPrintType('invoice')}
                />
                <span className={`ml-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Faktur (A4)</span>
              </label>
            </div>
          </div>

          {/* Receipt Preview */}
          <div className="space-y-4">
            <div className={printType === 'receipt' ? 'block' : 'hidden'}>
              <DistributionReceipt
                ref={receiptRef}
                distributionData={distributionData}
              />
            </div>

            <div className={printType === 'invoice' ? 'block' : 'hidden'}>
              <DistributionInvoice
                ref={invoiceRef}
                distributionData={distributionData}
              />
            </div>

            {/* Print Buttons - Hidden during actual print */}
            <div className="flex space-x-3 mt-6 print:hidden">
              <button
                onClick={handlePrint}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg font-medium ${
                  darkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                <Printer className="h-5 w-5 mr-2" />
                Cetak {printType === 'receipt' ? 'Struk' : 'Faktur'}
              </button>
              <button
                onClick={onClose}
                className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                  darkMode ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                }`}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DistributionReceiptModal;