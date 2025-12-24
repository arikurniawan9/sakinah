// components/ImportPreviewModal.js
'use client';

import { X, UploadCloud } from 'lucide-react';

export default function ImportPreviewModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Pratinjau Impor',
  isLoading = false,
  headers = [],
  data = [],
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-[100] flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="relative rounded-xl shadow-lg w-full max-w-4xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-xl leading-6 font-bold text-gray-900 dark:text-white" id="modal-title">
                {title}
            </h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="w-6 h-6 text-gray-500" />
            </button>
        </div>
        
        <div className="p-6 flex-grow overflow-y-auto">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Berikut adalah pratinjau data dari file yang Anda unggah. Periksa kembali data sebelum melanjutkan proses impor.
          </p>
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-600 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {headers.map((header) => (
                    <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {data.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    {headers.map((header) => (
                      <td key={header} className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                        {String(row[header] === null || row[header] === undefined ? '' : row[header])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Tidak ada data untuk ditampilkan atau format file tidak didukung.
            </div>
          )}
        </div>

        <div className="px-6 py-4 flex flex-row-reverse gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            disabled={isLoading || data.length === 0}
            className="inline-flex items-center justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:w-auto sm:text-sm disabled:bg-purple-400 disabled:cursor-not-allowed"
            onClick={onConfirm}
          >
            {isLoading ? 'Mengimpor...' : (
                <>
                    <UploadCloud className="w-5 h-5 mr-2"/>
                    Konfirmasi & Impor
                </>
            )}
          </button>
          <button
            type="button"
            className="inline-flex justify-center w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50"
            onClick={onClose}
            disabled={isLoading}
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}