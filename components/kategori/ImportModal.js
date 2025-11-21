'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { X, UploadCloud, FileText, Download } from 'lucide-react';
import { z } from 'zod'; // Assuming zod is available for validation
import { generateCategoryImportTemplate } from '@/utils/categoryImportTemplate';
import DuplicateCategoryConfirmationModal from './DuplicateCategoryConfirmationModal';

// Define schema for imported category data
const importedCategorySchema = z.object({
  name: z.string().trim().min(1, { message: 'Nama kategori wajib diisi' }),
  description: z.string().trim().optional().nullable(),
});

export default function ImportModal({ isOpen, onClose, onImportSuccess, darkMode }) {
  const [file, setFile] = useState(null);
  const [dataPreview, setDataPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [importReport, setImportReport] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateCategories, setDuplicateCategories] = useState([]);
  const [pendingImportData, setPendingImportData] = useState([]);

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setDataPreview([]);
      setError('');
      setImportReport(null);
      setShowDuplicateModal(false);
      setDuplicateCategories([]);
      setPendingImportData([]);
    }
  }, [isOpen]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files ? e.target.files[0] : null;
    setFile(selectedFile);
    setDataPreview([]);
    setError('');
    setImportReport(null);
    if (selectedFile) {
      readExcelFile(selectedFile);
    }
  };

  const readExcelFile = (selectedFile) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        // Map column names from Excel to API expectations
        const mappedData = json.map(row => ({
          name: row['Nama Kategori'] || row.name,
          description: row['Deskripsi'] || row.description,
        }));
        
        setDataPreview(mappedData);
      } catch (err) {
        setError('Gagal membaca file Excel. Pastikan formatnya benar.');
        console.error('Error reading Excel file:', err);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleImport = async () => {
    if (dataPreview.length === 0) {
      setError('Tidak ada data untuk diimpor.');
      return;
    }

    try {
      // Cek apakah ada kategori yang sudah ada
      const names = dataPreview.map(item => item.name);
      const response = await fetch('/api/kategori/check-duplicates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ names }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal memeriksa data duplikat');
      }

      const duplicateCategories = result.duplicates || [];

      if (duplicateCategories.length > 0) {
        // Tampilkan modal konfirmasi untuk data duplikat
        setDuplicateCategories(duplicateCategories);
        setPendingImportData(dataPreview);
        setShowDuplicateModal(true);
      } else {
        // Jika tidak ada duplikat, langsung import
        await performImport(dataPreview);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Fungsi untuk melakukan import
  const performImport = async (importData) => {
    setLoading(true);
    setError('');
    setImportReport(null);

    try {
      const response = await fetch('/api/kategori/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(importData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal melakukan import');
      }

      setImportReport(result);
      onImportSuccess(); // Refresh parent data
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk menangani konfirmasi import data duplikat
  const handleConfirmImport = async () => {
    await performImport(pendingImportData);
    setShowDuplicateModal(false);
    setDuplicateCategories([]);
    setPendingImportData([]);
  };

  // Fungsi untuk membatalkan import data duplikat
  const handleCancelImport = () => {
    setShowDuplicateModal(false);
    setDuplicateCategories([]);
    setPendingImportData([]);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={() => !loading && onClose()} // Prevent closing while loading
    >
      <div 
        className={`relative w-full max-w-2xl rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
        onClick={(e) => e.stopPropagation()} // Prevent modal from closing when clicking inside
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Impor Kategori</h3>
          <button 
            onClick={onClose} 
            disabled={loading}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-800 bg-red-100 dark:bg-red-500/10 dark:text-red-400 rounded-lg flex items-center">
              <FileText className="h-5 w-5 mr-2" /> {error}
            </div>
          )}

          {!importReport ? (
            <>
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex-1">
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-cyan-500 transition-colors">
                    <input
                      type="file"
                      accept=".csv, .xlsx, .xls"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                      disabled={loading}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer text-center">
                      <UploadCloud className={`h-12 w-12 mx-auto mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <p className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {file ? file.name : 'Pilih file Excel untuk diunggah'}
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        (Max 5MB, format .xlsx, .xls)
                      </p>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <p className={`mx-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'} hidden sm:block`}>atau</p>
                </div>

                <div className="flex-1 flex items-center justify-center">
                  <button
                    onClick={generateCategoryImportTemplate}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    } transition-colors`}
                  >
                    <Download className="h-5 w-5" />
                    <span>Unduh Template</span>
                  </button>
                </div>
              </div>

              {dataPreview.length > 0 && (
                <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <tr>
                        {Object.keys(dataPreview[0]).map((key) => (
                          <th key={key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${darkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}`}>
                      {dataPreview.slice(0, 5).map((row, index) => ( // Show first 5 rows as preview
                        <tr key={index}>
                          {Object.values(row).map((value, i) => (
                            <td key={i} className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                              {String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {dataPreview.length > 5 && (
                        <tr>
                          <td colSpan={Object.keys(dataPreview[0]).length} className="px-4 py-2 text-center text-sm text-gray-500 dark:text-gray-400">
                            ... {dataPreview.length - 5} baris lainnya
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="bg-green-100 dark:bg-green-500/10 p-4 rounded-lg text-green-800 dark:text-green-400">
              <h4 className="font-semibold text-lg mb-2">Laporan Impor Selesai</h4>
              <p>Total Diproses: {importReport.totalProcessed}</p>
              <p>Berhasil Dibuat: {importReport.created}</p>
              <p>Berhasil Diperbarui: {importReport.updated}</p>
              <p>Gagal: {importReport.failed}</p>
              {importReport.failed > 0 && (
                <div className="mt-4 text-sm max-h-40 overflow-y-auto">
                  <h5 className="font-medium">Detail Kegagalan:</h5>
                  <ul className="list-disc list-inside">
                    {importReport.results.filter(r => r.status === 'failed').map((res, idx) => (
                      <li key={idx}>
                        {res.name}: {res.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Tutup
          </button>
          {!importReport && (file || dataPreview.length > 0) && (
            <button
              type="button"
              onClick={handleImport}
              disabled={loading || dataPreview.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Mengimpor...' : 'Mulai Impor'}
            </button>
          )}
        </div>
      </div>

      {/* Modal konfirmasi data duplikat */}
      <DuplicateCategoryConfirmationModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        onConfirm={handleConfirmImport}
        onCancel={handleCancelImport}
        duplicateCategories={duplicateCategories}
        darkMode={darkMode}
        loading={loading}
      />
    </div>
  );
}