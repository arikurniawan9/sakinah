'use client';

import { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import DistributionReceipt from '../warehouse/DistributionReceipt';
import { Printer, X } from 'lucide-react';
import { useUserTheme } from '../UserThemeContext';

const DistributionReceiptModal = ({ distributionData, isOpen, onClose }) => {
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const componentRef = useRef();
  const [readyToPrint, setReadyToPrint] = useState(false);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Struk Distribusi - ${distributionData?.id || 'N/A'}`,
    onAfterPrint: () => {
      setReadyToPrint(false);
      onClose();
    },
    pageStyle: `
      @page {
        size: 80mm auto;
        margin: 0.25in 0.25in 0.25in 0.25in;
      }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `
  });

  useEffect(() => {
    if (isOpen && readyToPrint) {
      handlePrint();
    }
  }, [isOpen, readyToPrint, handlePrint]);

  // Auto-print when modal opens and component is ready
  useEffect(() => {
    if (isOpen && distributionData && componentRef.current) {
      // Wait a bit for the component to fully render
      const timer = setTimeout(() => {
        setReadyToPrint(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, distributionData]);

  if (!isOpen || !distributionData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100] print:flex print:items-center print:justify-center print:inset-0 print:bg-white">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto print:max-w-none print:w-full print:max-h-none print:m-0 print:p-0 print:shadow-none`}>
        <div className="p-6 print:p-0 print:overflow-visible">
          {/* Header */}
          <div className="flex justify-between items-center mb-4 print:hidden">
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Struk Distribusi Produk
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Receipt Preview */}
          <div className="space-y-4">
            <DistributionReceipt 
              ref={componentRef} 
              distributionData={distributionData} 
            />

            {/* Print Buttons - Hidden during actual print */}
            <div className="flex space-x-3 mt-6 print:hidden">
              <button
                onClick={() => {
                  setReadyToPrint(true);
                }}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg font-medium ${
                  darkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                <Printer className="h-5 w-5 mr-2" />
                Cetak Struk
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