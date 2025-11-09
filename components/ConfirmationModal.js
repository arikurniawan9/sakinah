// components/ConfirmationModal.js
'use client';

import { X, AlertTriangle } from 'lucide-react';

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Hapus',
  cancelText = 'Batal',
  isLoading = false,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="relative rounded-xl shadow-lg w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10">
              <AlertTriangle className="h-6 w-6 text-red-500" aria-hidden="true" />
            </div>
            <div className="ml-4 text-left">
              <h3 className="text-lg leading-6 font-bold text-gray-900 dark:text-white" id="modal-title">
                {title || 'Konfirmasi Hapus'}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {message || 'Apakah Anda yakin? Tindakan ini tidak dapat dibatalkan.'}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 flex flex-row-reverse gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
          <button
            type="button"
            disabled={isLoading}
            className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm disabled:bg-red-400 disabled:cursor-not-allowed"
            onClick={onConfirm}
          >
            {isLoading ? 'Memproses...' : confirmText}
          </button>
          <button
            type="button"
            className="inline-flex justify-center w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
