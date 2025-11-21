// components/kategori/DuplicateCategoryConfirmationModal.js
'use client';

import { X } from 'lucide-react';

const DuplicateCategoryConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  onCancel,
  duplicateCategories,
  darkMode,
  loading = false
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleOverlayClick}
    >
      <div className={`relative w-full max-w-md rounded-xl shadow-lg transform transition-all ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Data Kategori Sudah Ada
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            className={`p-2 rounded-full ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'} transition-colors disabled:opacity-50`}
            aria-label="Tutup modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="mb-4 p-3 rounded-lg bg-yellow-100 dark:bg-yellow-500/20">
            <p className={`text-sm ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
              Ditemukan {duplicateCategories.length} kategori yang sudah ada dalam sistem. Apakah Anda ingin menggantinya?
            </p>
          </div>
          
          <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg mb-4">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {duplicateCategories.map((category, index) => (
                <li key={index} className="px-4 py-2 text-sm">
                  <div className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {category.name}
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {category.description || 'Tidak ada deskripsi'}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Data yang sudah ada akan diperbarui dengan data baru. Data yang tidak ada akan ditambahkan baru.
          </p>
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 ${
              darkMode 
                ? 'text-gray-300 bg-gray-600 hover:bg-gray-700' 
                : 'text-gray-700 bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50`}
          >
            {loading ? 'Memproses...' : 'Lanjutkan Import'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DuplicateCategoryConfirmationModal;