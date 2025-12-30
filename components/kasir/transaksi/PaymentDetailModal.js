// components/kasir/transaksi/PaymentDetailModal.js
import React from 'react';
import PaymentSummary from './PaymentSummary'; // Assuming PaymentSummary is in the same directory
import { X } from 'lucide-react';

const PaymentDetailModal = ({
  isOpen,
  onClose,
  calculation,
  payment,
  setPayment,
  additionalDiscount,
  setAdditionalDiscount,
  paymentMethod,
  setPaymentMethod,
  initiatePaidPayment,
  initiateUnpaidPayment,
  referenceNumber,
  setReferenceNumber,
  loading,
  darkMode,
  sessionStatus,
  selectedMember,
  selectedAttendant,
  clearForm,
  formatCurrency, // Pass formatCurrency from parent
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
      <div className={`relative w-full max-w-md max-h-[90vh] rounded-2xl shadow-2xl flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Modal Header */}
        <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
          <h3 className="text-lg font-semibold">Ringkasan Pembayaran</h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body - PaymentSummary content */}
        <div className="flex-1 p-4 overflow-y-auto styled-scrollbar">
          <PaymentSummary
            calculation={calculation}
            payment={payment}
            setPayment={setPayment}
            additionalDiscount={additionalDiscount}
            setAdditionalDiscount={setAdditionalDiscount}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            initiatePaidPayment={initiatePaidPayment}
            initiateUnpaidPayment={initiateUnpaidPayment}
            referenceNumber={referenceNumber}
            setReferenceNumber={setReferenceNumber}
            loading={loading}
            darkMode={darkMode}
            sessionStatus={sessionStatus}
            selectedMember={selectedMember}
            selectedAttendant={selectedAttendant}
            clearForm={clearForm}
            // formatCurrency passed here
            formatCurrency={formatCurrency}
          />
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailModal;
