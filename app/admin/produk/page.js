'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Search, Plus, Download, Upload, Trash2, Folder, Edit, Eye, Hash, X, CheckCircle, XCircle } from 'lucide-react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useUserTheme } from '../../../components/UserThemeContext';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import Tooltip from '../../../components/Tooltip';

import { useKeyboardShortcut } from '../../../lib/hooks/useKeyboardShortcut';
import { useProductTable } from '../../../lib/hooks/useProductTable';
import { useProductForm } from '../../../lib/hooks/useProductForm';
import { useTableSelection } from '../../../lib/hooks/useTableSelection';
import { useCachedCategories, useCachedSuppliers } from '../../../lib/hooks/useCachedData';

import DataTable from '../../../components/DataTable';
import Breadcrumb from '../../../components/Breadcrumb';
import AutoCompleteSearch from '../../../components/AutoCompleteSearch'; // Import AutoCompleteSearch
import KeyboardShortcutsGuide from '../../../components/KeyboardShortcutsGuide';

// Dynamic imports for performance optimization
const ProductModal = dynamic(() => import('../../../components/produk/ProductModal'), { ssr: false });
const ProductDetailModal = dynamic(() => import('../../../components/produk/ProductDetailModal'), { ssr: false });
const ConfirmationModal = dynamic(() => import('../../../components/ConfirmationModal'), { ssr: false });
const ExportFormatSelector = dynamic(() => import('../../../components/export/ExportFormatSelector'), { ssr: false });
const PDFPreviewModal = dynamic(() => import('../../../components/export/PDFPreviewModal'), { ssr: false });

export default function ProductManagement() {
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  const [showPDFPreviewModal, setShowPDFPreviewModal] = useState(false);
  const [pdfPreviewData, setPdfPreviewData] = useState(null);
  const [refreshLoading, setRefreshLoading] = useState(false); // State untuk loading refresh

  const searchInputRef = useRef(null);
  const importInputRef = useRef(null);
  const dataTableRef = useRef(null);
  
  const {
    products,
    loading,
    validating,
    error: tableError,
    searchTerm,
    setSearchTerm,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    totalProducts,
    fetchProducts,
    mutate,
    removeProductsOptimistic,
    addProductOptimistic,
    updateProductOptimistic,
    categoryFilter,
    supplierFilter,
    minStock,
    maxStock,
    minPrice,
    maxPrice,
    handleCategoryFilter,
    handleSupplierFilter,
    handleMinStockFilter,
    handleMaxStockFilter,
    handleMinPriceFilter,
    handleMaxPriceFilter,
    clearFilters,
    hasActiveFilters
  } = useProductTable();

  const {
    showModal,
    editingProduct,
    formData,
    error: formError,
    success,
    handleInputChange,
    handleTierChange,
    addTier,
    removeTier,
    openModalForEdit,
    openModalForCreate,
    closeModal,
    handleSave,
    setError: setFormError,
    setSuccess,
  } = useProductForm(fetchProducts, { removeProductsOptimistic, addProductOptimistic, updateProductOptimistic });

  const { selectedRows, handleSelectAll, handleSelectRow, clearSelection, setSelectedRows } = useTableSelection(products);

  const [importLoading, setImportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // State untuk modal peringatan
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState(null);
  const [showExportFormatModal, setShowExportFormatModal] = useState(false);
  const [showImportConfirmModal, setShowImportConfirmModal] = useState(false);
  const [duplicateProducts, setDuplicateProducts] = useState([]);
  const [fileToImport, setFileToImport] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const fileToImportRef = useRef(fileToImport);
  fileToImportRef.current = fileToImport;
  const importFileRef = useRef(importFile);
  importFileRef.current = importFile;

  const { categories: cachedCategories, loading: categoriesLoading, error: categoriesError } = useCachedCategories();
  const { suppliers: cachedSuppliers, loading: suppliersLoading, error: suppliersError } = useCachedSuppliers();

  useEffect(() => {
    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
    }
    if (suppliersError) {
      console.error('Error fetching suppliers:', suppliersError);
    }
  }, [categoriesError, suppliersError]);

  // Search handlers for AutoCompleteSearch filters
  const searchCategories = async (query) => {
    if (!query) return [];
    const response = await fetch(`/api/kategori/search?q=${query}`);
    const data = await response.json();
    return data.categories || [];
  };

  const searchSuppliers = async (query) => {
    if (!query) return [];
    const response = await fetch(`/api/supplier/search?q=${query}`);
    const data = await response.json();
    return data.suppliers || [];
  };
  
  const handleCategoryFilterSelect = (category) => {
    handleCategoryFilter(category ? category.id : '');
  };
  
  const handleSupplierFilterSelect = (supplier) => {
    handleSupplierFilter(supplier ? supplier.id : '');
  };

  const handleDelete = (id) => {
    handleDeleteSingle(id);
  };

  const handleDeleteMultiple = useCallback(() => {
    if (!isAdmin || selectedRows.length === 0) return;
    setItemToDelete(selectedRows);
    setShowDeleteModal(true);
  }, [isAdmin, selectedRows]);

  // Fungsi untuk menghapus produk tunggal dengan refresh langsung
  const handleDeleteSingle = useCallback((id) => {
    if (!isAdmin) return;
    setItemToDelete(id);
    setShowDeleteModal(true);
  }, [isAdmin]);

  const handleConfirmDelete = async () => {
    if (!itemToDelete || !isAdmin) return;
    setIsDeleting(true);

    const isMultiple = Array.isArray(itemToDelete);

    let url = '/api/produk';
    let options = {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    };

    if (isMultiple) {
      options.body = JSON.stringify({ ids: itemToDelete });
    } else {
      url += `?id=${itemToDelete}`;
    }

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menghapus produk');
      }

      // Optimistically update the UI by removing the deleted items
      if (isMultiple) {
        await removeProductsOptimistic(itemToDelete);
        clearSelection();
        setSuccess(`Berhasil menghapus ${itemToDelete.length} produk`);
      } else {
        await removeProductsOptimistic([itemToDelete]);
        setSelectedRows(prev => prev.filter(rowId => rowId !== itemToDelete));
        setSuccess('Produk berhasil dihapus');
      }

      // Force a complete refresh of the data after optimistic update
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to allow optimistic update to process
      
      // Refetch data to ensure consistency with server state
      await mutate(undefined, true); // Re-fetch and re-validate

      // Reset pagination to ensure all products are visible
      setCurrentPage(1);

      // Additional refresh to ensure UI is updated
      await refreshProducts(true); // Force refresh with server data

      // Force a re-render by updating state
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      // If deletion failed, refetch to restore original state
      await mutate();
      
      // Restore selection if it was a failed single deletion
      if (!isMultiple && itemToDelete) {
        setSelectedRows(prev => [...prev, itemToDelete]);
      }

      // Refresh the UI to ensure consistency
      await refreshProducts(true);

      // Tampilkan pesan kesalahan khusus dalam modal peringatan
      if (err.message.includes('Beberapa produk terpilih sudah memiliki riwayat transaksi') || 
          err.message.includes('tidak boleh dihapus demi integritas data laporan')) {
        setWarningMessage(err.message);
        setShowWarningModal(true);
      } else {
        toast.error('Terjadi kesalahan saat menghapus: ' + err.message);
      }
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };


  const handleViewDetails = (product) => {
    setSelectedProductForDetail(product);
    setShowDetailModal(true);
  };

  const openExportFormatSelector = useCallback(() => {
    setShowExportFormatModal(true);
  }, []);

  const handleExportWithFormat = async (format) => {
    setExportLoading(true);
    try {
      const response = await fetch('/api/produk?limit=1000'); // Fetch more for export
      if (!response.ok) throw new Error('Gagal mengambil data untuk export');
      const data = await response.json();

      const exportData = data.products.map(product => {
        return {
          'Nama': product.name,
          'Kode': product.productCode,
          'Stok': product.stock,
          'Kategori': product.category?.name || '',
          'Supplier': product.supplier?.name || '',
          'Deskripsi': product.description || '',
          'Tanggal Dibuat': new Date(product.createdAt).toLocaleDateString('id-ID'),
          'Tanggal Diubah': new Date(product.updatedAt).toLocaleDateString('id-ID'),
          'Harga Beli': product.purchasePrice || 0,
          'Harga Jual/Eceran': product.retailPrice || 0,
          'Harga Member Silver': product.silverPrice || 0,
          'Harga Member Gold': product.goldPrice || 0,
          'Harga Member Platinum (Partai)': product.platinumPrice || 0
        };
      });

      if (format === 'excel') {
        try {
          const { utils, writeFile } = await import('xlsx');
          const worksheet = utils.json_to_sheet(exportData);

          const colWidths = [
            { wch: 20 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 15 }, 
            { wch: 30 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, 
            { wch: 15 }, { wch: 15 }
          ];
          worksheet['!cols'] = colWidths;

          const workbook = utils.book_new();
          utils.book_append_sheet(workbook, worksheet, 'Produk');

          const fileName = `produk-${new Date().toISOString().slice(0, 10)}.xlsx`;
          writeFile(workbook, fileName);
        } catch (error) {
          console.error('Error saat ekspor ke Excel:', error);
          toast.error('Gagal ekspor ke Excel, silakan coba format lain');
          return;
        }
      } else if (format === 'pdf') {
        setPdfPreviewData({
          data: exportData,
          title: 'Laporan Produk',
          darkMode: darkMode
        });
        setShowPDFPreviewModal(true);
      } else {
        let csvContent = 'Nama,Kode,Stok,Kategori,Supplier,Deskripsi,Tanggal Dibuat,Tanggal Diubah,Harga Beli,Harga Jual/Eceran,Harga Member Silver,Harga Member Gold,Harga Member Platinum (Partai)\n';
        exportData.forEach(row => {
          const csvRow = [
            `"${row['Nama'].replace(/"/g, '""')}"`, `"${row['Kode'].replace(/"/g, '""')}"`,
            row['Stok'], `"${row['Kategori']}"`, `"${row['Supplier']}"`,
            `"${row['Deskripsi'].replace(/"/g, '""')}"`, `"${row['Tanggal Dibuat']}"`,
            `"${row['Tanggal Diubah']}"`, row['Harga Beli'], row['Harga Jual/Eceran'],
            row['Harga Member Silver'], row['Harga Member Gold'], row['Harga Member Platinum (Partai)']
          ].join(',');
          csvContent += csvRow + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `produk-${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast.success(`Data produk berhasil diekspor dalam format ${format.toUpperCase()}`);
    } catch (err) {
      toast.error('Terjadi kesalahan saat export: ' + err.message);
    } finally {
      setExportLoading(false);
    }
  };

  const handleExport = useCallback(() => {
    openExportFormatSelector();
  }, [openExportFormatSelector]);

  const handlePrintBarcode = useCallback(async () => {
    try {
      const productsToPrint = selectedRows.length > 0
        ? products.filter(p => selectedRows.includes(p.id))
        : products;

      if (productsToPrint.length === 0) {
        toast.warn('Tidak ada produk untuk dicetak barcode-nya');
        return;
      }

      // Dynamic import to reduce initial bundle size
      const { generateProductBarcodePDF } = await import('../../../components/admin/ProductBarcodePDFGenerator');

      generateProductBarcodePDF(productsToPrint, {
        barcodeWidth: 38, barcodeHeight: 15, labelWidth: 50, labelHeight: 25,
        margin: 5, fontSize: 8, darkMode: darkMode,
        includeProductName: false, includeProductCode: true
      });

      toast.success(`Berhasil mencetak barcode untuk ${productsToPrint.length} produk`);
    } catch (error) {
      console.error('Error printing barcode:', error);
      toast.error('Gagal mencetak barcode: ' + error.message);
    }
  }, [selectedRows, products, darkMode]);

  const [importStatus, setImportStatus] = useState('idle'); // idle, processing, success, error
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, status: '', show: false });
  const [previewData, setPreviewData] = useState({ headers: [], previewData: [], totalRows: 0, show: false });
  const [previewCurrentPage, setPreviewCurrentPage] = useState(1);
  const PREVIEW_ROWS_PER_PAGE = 10;
  const [isCheckingFile, setIsCheckingFile] = useState(false);
  const [importErrors, setImportErrors] = useState([]);

  // Fungsi untuk menyimpan status import ke localStorage
  const saveImportStatus = useCallback((status, file = null, progress = null) => {
    if (typeof window !== 'undefined') {
      const importData = {
        status,
        timestamp: Date.now(),
        fileName: file ? file.name : null,
        progress: progress || { current: 0, total: 0, status: '' }
      };
      localStorage.setItem('adminImportStatus', JSON.stringify(importData));
    }
  }, []);

  const saveImportStatusRef = useRef(saveImportStatus);
  saveImportStatusRef.current = saveImportStatus;

  // Fungsi untuk menghapus status import dari localStorage
  const clearImportStatus = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminImportStatus');
    }
  }, []);

  const clearImportStatusRef = useRef(clearImportStatus);
  clearImportStatusRef.current = clearImportStatus;

  // Cek status import dari localStorage saat komponen dimuat
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const importData = localStorage.getItem('adminImportStatus');
      const storedStatus = importData ? JSON.parse(importData) : null;

      if (storedStatus) {
        if (storedStatus.status === 'processing') {
          setImportStatus(storedStatus.status);
          setImportProgress(storedStatus.progress);
          setShowImportModal(true);
          setImportFile({ name: storedStatus.fileName });
          setFileToImport({ name: storedStatus.fileName }); // Update referensi file
        } else if (['success', 'error'].includes(storedStatus.status)) {
          setImportStatus(storedStatus.status);
          setImportProgress(storedStatus.progress);
          setShowImportModal(true);
          setImportFile({ name: storedStatus.fileName });
          setFileToImport({ name: storedStatus.fileName }); // Update referensi file
        }
      }
      setIsCheckingStoredImport(false);
    }
  }, []);

  // Mencegah pengguna meninggalkan halaman saat proses import sedang berlangsung
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const importData = localStorage.getItem('adminImportStatus');
      const storedStatus = importData ? JSON.parse(importData) : null;

      if (storedStatus && storedStatus.status === 'processing') {
        e.preventDefault();
        e.returnValue = 'Proses import sedang berlangsung. Apakah Anda yakin ingin meninggalkan halaman ini?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const [showImportModal, setShowImportModal] = useState(false);
  const [isCheckingStoredImport, setIsCheckingStoredImport] = useState(true);

  // Effect untuk refresh data produk secara berkala saat modal import sedang aktif
  useEffect(() => {
    let interval = null;

    if (showImportModal && importStatus === 'processing') {
      // Refresh data setiap 5 detik saat proses import berlangsung
      interval = setInterval(() => {
        fetchProducts(true);
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showImportModal, importStatus, fetchProducts]);

  const handleImport = async (e) => {
    if (!isAdmin) return;

    if (e && e.target && e.target.files) {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls') && !file.name.toLowerCase().endsWith('.csv')) {
        toast.error('Silakan pilih file Excel (.xlsx, .xls) atau CSV (.csv)');
        e.target.value = '';
        return;
      }

      // Reset state untuk file baru
      setImportFile(file);
      setFileToImport(file); // Update referensi file
      setImportStatus('idle');
      setIsFileChecked(false);
      setImportProgress({ current: 0, total: 0, status: '', show: false });
      setPreviewData({ headers: [], previewData: [], totalRows: 0, show: false });
      setShowImportModal(true);

    } else {
      const hiddenFileInput = document.getElementById('hidden-import-file-input');
      if (hiddenFileInput) {
        hiddenFileInput.click();
      } else {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls,.csv';
        input.style.display = 'none';
        input.onchange = (event) => handleImport(event);
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
      }
    }
  };

  const handleCheckFile = useCallback(async () => {
    if (!fileToImportRef.current) {
      toast.error("Tidak ada file yang dipilih.");
      return;
    }
    setIsCheckingFile(true);
    try {
      // Baca file untuk mengetahui jumlah produk sebelum dikirim
      const totalProducts = await getTotalProductsFromFileRef.current(fileToImportRef.current);

      // Baca preview data
      const preview = await getPreviewDataFromFileRef.current(fileToImportRef.current);

      // Update progress dengan jumlah total produk
      const initialProgress = {
        current: 0,
        total: totalProducts,
        status: `Siap mengimpor ${totalProducts} produk...`,
        show: true
      };
      setImportProgress(initialProgress);

      // Set preview data
      setPreviewData({ ...preview, show: true });

      setIsFileChecked(true);
      setPreviewCurrentPage(1);
    } catch (error) {
      toast.error("Gagal memeriksa file: " + error.message);
    } finally {
      setIsCheckingFile(false);
    }
  }, []);

  // Fungsi untuk membaca file dan menghitung jumlah produk
  const getTotalProductsFromFile = useCallback(async (file) => {
    try {
      const fileExtension = file.name.split('.').pop().toLowerCase();

      if (fileExtension === 'csv') {
        // Baca file CSV dan hitung jumlah baris (kurangi header)
        const text = await file.text();
        const lines = text.split('\n');
        // Kurangi 1 untuk header
        return Math.max(0, lines.length - 1);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Baca file Excel menggunakan library xlsx
        const XLSX = await import('xlsx');
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Kurangi 1 untuk header
        return Math.max(0, jsonData.length - 1);
      }

      return 0;
    } catch (error) {
      console.error('Error reading file for product count:', error);
      return 0;
    }
  }, []);

  const getTotalProductsFromFileRef = useRef(getTotalProductsFromFile);
  getTotalProductsFromFileRef.current = getTotalProductsFromFile;

  // Fungsi untuk menampilkan preview data dari file
  const getPreviewDataFromFile = useCallback(async (file) => {
    try {
      const fileExtension = file.name.split('.').pop().toLowerCase();

      if (fileExtension === 'csv') {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) return { headers: [], previewData: [], totalRows: 0 };

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const dataRows = lines.slice(1);
        const previewData = dataRows.map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const row = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });
            return row;
        });

        return { headers, previewData, totalRows: dataRows.length };

      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const XLSX = await import('xlsx');
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 1) {
            return { headers: [], previewData: [], totalRows: 0 };
        }

        const headers = jsonData[0];
        const dataRows = jsonData.slice(1);

        const previewData = dataRows.map(row => {
          const rowObject = {};
          headers.forEach((header, index) => {
            rowObject[header] = row[index];
          });
          return rowObject;
        });

        return { headers, previewData, totalRows: dataRows.length };
      }

      return { headers: [], previewData: [], totalRows: 0 };
    } catch (error) {
      console.error('Error reading file for preview:', error);
      return { headers: [], previewData: [], totalRows: 0 };
    }
  }, []);

  const getPreviewDataFromFileRef = useRef(getPreviewDataFromFile);
  getPreviewDataFromFileRef.current = getPreviewDataFromFile;

  const processImport = useCallback(async (formData, event = null) => {
    setImportLoading(true);
    setImportStatus('processing');

    const total = importProgress.total;
    setImportProgress({ current: 0, total: total, status: 'Mengirim file...', show: true });

    let progressInterval = null;

    // Simulate progress
    if (total > 0) {
      const simulationTime = Math.min(total * 100, 15000); // Max 15 detik simulasi
      const increment = total / (simulationTime / 100);

      progressInterval = setInterval(() => {
        setImportProgress(prev => {
          const newCurrent = Math.min(prev.current + increment, total * 0.95); // Jangan sampai 100%
          if (newCurrent >= total * 0.95) {
            clearInterval(progressInterval);
          }
          return {
            ...prev,
            current: Math.round(newCurrent),
            status: `Memproses ${Math.round(newCurrent)} dari ${total} produk...`
          };
        });
      }, 100);
    }

    saveImportStatusRef.current('processing', fileToImportRef.current, importProgress);
    toast.info('Mengirim file untuk diimpor...');

    try {
      const response = await fetch('/api/produk/import', { method: 'POST', body: formData });
      clearInterval(progressInterval); // Stop simulation on response
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal memproses file import');
      }

      const importedCount = result.importedCount || 0;
      const finalProgress = {
        current: importedCount,
        total: total,
        status: `Selesai - ${importedCount} dari ${total} produk berhasil diimpor.`,
        show: true
      };
      setImportProgress(finalProgress);

      if (result.errors && result.errors.length > 0) {
        setImportErrors(result.errors);
        setImportStatus('success_with_errors');
        toast.warn(`Berhasil mengimpor ${importedCount} produk, tetapi ${result.errors.length} baris gagal.`);
      } else {
        setImportStatus('success');
        toast.success(result.message || `Berhasil mengimport ${importedCount} produk.`);

        // Refresh data produk setelah import selesai
        await fetchProducts(true);
        // Reset pagination untuk memastikan produk baru terlihat
        setCurrentPage(1);
      }

    } catch (err) {
      clearInterval(progressInterval);
      setImportStatus('error');
      setImportErrors([{ row: 'General', error: err.message }]);
      toast.error('Terjadi kesalahan saat import: ' + err.message);
    } finally {
      // Refresh data produk setelah import selesai (baik sukses maupun gagal)
      await fetchProducts(true);
      setCurrentPage(1);

      // Panggil refreshProducts untuk memastikan tampilan tabel diperbarui
      refreshProducts();
      
      // Tunggu sebentar sebelum menutup modal untuk memberi pengguna waktu melihat hasil
      setTimeout(() => {
        resetImportState();
      }, 2000);

      clearInterval(progressInterval);
      setImportLoading(false);
    }
  }, [importProgress, fetchProducts]);

  const handleImportWithConfirmation = useCallback(async (updateMode) => {
    if (!fileToImportRef.current) {
        toast.error("File import tidak ditemukan. Silakan coba lagi.");
        return;
    }

    setShowImportConfirmModal(false);

    const totalProducts = await getTotalProductsFromFile(fileToImportRef.current);

    const formData = new FormData();
    formData.append('file', fileToImportRef.current);
    formData.append('updateMode', updateMode);

    setImportLoading(true);
    setImportStatus('processing');
    const initialProgress = {
      current: 0,
      total: totalProducts,
      status: updateMode === 'overwrite' ? `Mengimpor dan menimpa produk... (0/${totalProducts})` : `Mengimpor dan menambahkan stok... (0/${totalProducts})`,
      show: true
    };
    setImportProgress(initialProgress);
    saveImportStatusRef.current('processing', fileToImportRef.current, initialProgress);
    toast.info(updateMode === 'overwrite' ? 'Mengimpor dan menimpa produk yang sudah ada...' : 'Mengimpor dan menambahkan stok produk yang sudah ada...');

    try {
      const response = await fetch('/api/produk/import', { method: 'POST', body: formData });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal memproses file import');
      }

      const updatedProgress = {
        current: result.importedCount || 0,
        total: totalProducts || result.importedCount || 0,
        status: `Selesai - ${result.importedCount || 0} produk berhasil diimpor`,
        show: true
      };
      setImportProgress(updatedProgress);
      saveImportStatusRef.current('success', fileToImportRef.current, updatedProgress);

      setImportStatus('success');
      // Refresh data produk setelah import selesai
      await fetchProducts(true);
      // Reset pagination untuk memastikan produk baru terlihat
      setCurrentPage(1);
      
      // Panggil refreshProducts untuk memastikan tampilan tabel diperbarui
      refreshProducts();
      
      toast.success(result.message || `Berhasil mengimport ${result.importedCount || 0} produk`);
      if (result.errors && result.errors.length > 0) {
        console.warn('Import errors:', result.errors);
        toast.warn(`Beberapa produk gagal diimpor: ${result.errors.length} error(s)`);
      }
    } catch (err) {
      setImportStatus('error');
      saveImportStatusRef.current('error', fileToImportRef.current, importProgress);
      toast.error('Terjadi kesalahan saat import: ' + err.message);
    } finally {
      // Refresh data produk setelah import selesai (baik sukses maupun gagal)
      await fetchProducts(true);
      setCurrentPage(1);

      // Panggil refreshProducts untuk memastikan tampilan tabel diperbarui
      refreshProducts();
      
      // Tunggu sebentar sebelum menutup modal untuk memberi pengguna waktu melihat hasil
      setTimeout(() => {
        resetImportState();
      }, 2000);

      setImportLoading(false);
      setTimeout(() => {
        setImportProgress({ current: 0, total: 0, status: '', show: false });
        setPreviewData({ headers: [], previewData: [], totalRows: 0, show: false });
      }, 2000);
    }
  }, [getTotalProductsFromFile, fetchProducts]);

  const startImportProcess = useCallback(async () => {
    if (!fileToImportRef.current) return;

    // Simpan status import ke localStorage sebelum memulai proses
    saveImportStatusRef.current('processing', fileToImportRef.current, importProgress);

    const formData = new FormData();
    formData.append('file', fileToImportRef.current);

    await processImport(formData);
  }, [processImport, importProgress]);

  const resetImportState = useCallback(() => {
    setFileToImport(null);
    setDuplicateProducts([]);
    setShowImportConfirmModal(false);
    setPreviewData({ headers: [], previewData: [], totalRows: 0, show: false });
    setImportFile(null);
    setShowImportModal(false);
    setImportStatus('idle');
    setImportErrors([]);
    clearImportStatusRef.current();

    // Refresh data produk dan reset pagination setelah reset state import
    fetchProducts(true);
    setCurrentPage(1);
  }, [fetchProducts, setCurrentPage]);

  const [isFileChecked, setIsFileChecked] = useState(false);

  // Fungsi untuk reset pagination ke halaman pertama
  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, [setCurrentPage]);

  // Ref untuk menyimpan referensi ke resetPagination agar bisa diakses dari fungsi lain
  const resetPaginationRef = useRef(resetPagination);

  // Update ref setiap kali resetPagination berubah
  useEffect(() => {
    resetPaginationRef.current = resetPagination;
  }, [resetPagination]);

  // Fungsi untuk refresh data produk secara manual
  const refreshProducts = useCallback(async (forceRefresh = false) => {
    setRefreshLoading(true);
    try {
      await fetchProducts(forceRefresh);
      // Tambahkan sedikit delay untuk memastikan UI selesai diperbarui
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Error refreshing products:', error);
      // Pastikan untuk tetap memanggil fetchProducts bahkan jika terjadi kesalahan
      await fetchProducts(false);
    } finally {
      setRefreshLoading(false);
    }
  }, [fetchProducts]);

  const handleDownloadTemplate = () => {
    // Membuat template CSV dengan format yang sesuai dengan API import
    const csvContent = [
      'Nama,Kode,Stok,Kategori,Supplier,Deskripsi,Harga Beli,Harga Jual/Eceran,Harga Member Silver,Harga Member Gold,Harga Member Platinum (Partai)',
      '"Smartphone A","SPH001",50,"Elektronik","Supplier Elektronik","Smartphone terbaru",3000000,3500000,3400000,3300000,3200000',
      '"Kemeja B","KMB002",30,"Pakaian","Supplier Pakaian","Kemeja lengan panjang",150000,200000,190000,180000,170000',
      '"Jam Tangan C","JMT003",100,"Aksesoris","Supplier Aksesoris","Jam tangan elegan",500000,600000,580000,560000,540000',
      '"Produk Duplikat","PRD001",20,"Elektronik","Supplier ABC","Produk yang sudah ada di sistem, stok akan ditambahkan",2500000,3000000,2900000,2800000,2700000'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'template-import-produk.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTriggerImport = useCallback(() => {
    if (importInputRef.current) {
      importInputRef.current.click();
    }
  }, []);
  
  const handleFocusSearch = useCallback(() => {
    if (dataTableRef.current && dataTableRef.current.focusSearch) {
      dataTableRef.current.focusSearch();
    } else {
      // Fallback jika ref tidak tersedia
      const searchInput = document.querySelector('input[placeholder="Cari..."]');
      if (searchInput) {
        searchInput.focus();
      }
    }
  }, []);
  
  const shortcuts = {
    'alt+n': openModalForCreate,
    'alt+i': handleTriggerImport,
    'alt+e': handleExport,
    'alt+b': handlePrintBarcode,
    'alt+f': handleFocusSearch,
    'delete': handleDeleteMultiple,
  };

  useKeyboardShortcut(shortcuts);

  const shortcutList = [
    { key: 'Alt + N', description: 'Tambah Baru' },
    { key: 'Alt + F', description: 'Cari' },
    { key: 'Alt + I', description: 'Import' },
    { key: 'Alt + E', description: 'Export' },
    { key: 'Alt + B', description: 'Cetak Barcode' },
    { key: 'Delete', description: 'Hapus Terpilih' },
  ];

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const error = tableError || formError;

  const columns = [
    { key: 'productCode', title: 'Kode', sortable: true },
    { key: 'name', title: 'Nama', sortable: true },
    {
      key: 'retailPrice', title: 'Harga Jual/Eceran',
      render: (value, row) => `Rp ${row.retailPrice?.toLocaleString('id-ID') || 0}`,
      sortable: true
    },
    { key: 'stock', title: 'Stok', sortable: true }
  ];

  const enhancedProducts = products.map(product => ({
    ...product,
    onViewDetails: handleViewDetails,
    onEdit: isAdmin ? openModalForEdit : undefined,
    onDelete: isAdmin ? handleDelete : undefined
  }));

  const rowActions = (row) => (
    <div className="flex space-x-2">
      <button onClick={() => handleViewDetails(row)} className={`p-1.5 rounded-md ${darkMode ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-gray-200'}`} title="Detail"><Eye className="h-4 w-4" /></button>
      {isAdmin && <button onClick={() => openModalForEdit(row)} className={`p-1.5 rounded-md ${darkMode ? 'text-yellow-400 hover:bg-gray-700' : 'text-yellow-600 hover:bg-gray-200'}`} title="Edit"><Edit className="h-4 w-4" /></button>}
      {isAdmin && <button onClick={() => handleDelete(row.id)} className={`p-1.5 rounded-md ${darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-gray-200'}`} title="Hapus"><Trash2 className="h-4 w-4" /></button>}
    </div>
  );

  const paginationData = {
    currentPage, totalPages, totalItems: totalProducts,
    startIndex: (currentPage - 1) * itemsPerPage + 1,
    endIndex: Math.min(currentPage * itemsPerPage, totalProducts),
    onPageChange: setCurrentPage,
    itemsPerPage: itemsPerPage,
    validating: validating
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <main className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${darkMode ? 'bg-gray-900 text-gray-100' : ''}`}>
        <Breadcrumb items={[{ title: 'Produk', href: '/admin/produk' }]} darkMode={darkMode} />
        <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Manajemen Produk</h1>

        <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-theme-purple-700' : 'bg-white border-gray-200'} border`}>
          {hasActiveFilters && (
            <div className={`p-4 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
              <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Filter aktif: {searchTerm && `Pencarian: "${searchTerm}", `}
                  {categoryFilter && `Kategori: ${categoryFilter}, `}
                  {supplierFilter && `Supplier: ${supplierFilter}, `}
                  {minStock && `Min Stok: ${minStock}, `}
                  {maxStock && `Max Stok: ${maxStock}, `}
                  {minPrice && `Min Harga: ${minPrice}, `}
                  {maxPrice && `Max Harga: ${maxPrice}`}
                </div>
                <button onClick={clearFilters} className={`px-3 py-2 rounded-md text-sm font-medium ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}>Reset Filter</button>
              </div>
            </div>
          )}
          <DataTable
            ref={dataTableRef}
            data={enhancedProducts}
            columns={columns}
            loading={loading}
            selectedRows={selectedRows}
            onSelectAll={isAdmin ? handleSelectAll : undefined}
            onSelectRow={isAdmin ? handleSelectRow : undefined}
            onAdd={isAdmin ? openModalForCreate : undefined}
            onSearch={setSearchTerm}
            onExport={handleExport}
            onImport={handleImport}
            onTemplateDownload={handleDownloadTemplate}
            onItemsPerPageChange={setItemsPerPage}
            onDeleteMultiple={handleDeleteMultiple}
            selectedRowsCount={selectedRows.length}
            darkMode={darkMode}
            actions={isAdmin}
            rowActions={rowActions}
            showToolbar={true}
            showAdd={isAdmin}
            showExport={true}
            showImport={true}
            showTemplate={true}
            showItemsPerPage={true}
            onRefresh={async () => {
              if (refreshLoading) return; // Hindari multiple click
              
              try {
                // Panggil refresh dengan force refresh untuk memastikan data diambil dari server
                await refreshProducts(true);
                toast.info('Data produk berhasil diperbarui');
              } catch (err) {
                console.error('Refresh failed:', err);
                toast.error('Gagal memperbarui data produk');
              }
            }}
            refreshLoading={refreshLoading}
            pagination={paginationData}
            mobileColumns={['productCode', 'name', 'price', 'stock']}
          />
        </div>

        <KeyboardShortcutsGuide shortcuts={shortcutList} darkMode={darkMode} />

        {isAdmin && (
          <ProductModal
            showModal={showModal}
            closeModal={closeModal}
            editingProduct={editingProduct}
            formData={formData}
            handleInputChange={handleInputChange}
            handleTierChange={handleTierChange}
            addTier={addTier}
            removeTier={removeTier}
            handleSave={handleSave}
            onRefresh={refreshProducts}
            onResetPagination={() => resetPaginationRef.current && resetPaginationRef.current()}
            darkMode={darkMode}
            categories={cachedCategories}
            suppliers={cachedSuppliers}
          />
        )}

        {isAdmin && (
          <ConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleConfirmDelete}
            title="Konfirmasi Hapus"
            message={`Apakah Anda yakin ingin menghapus ${Array.isArray(itemToDelete) ? itemToDelete.length + ' produk' : 'produk ini'}?`}
            darkMode={darkMode}
            isLoading={isDeleting}
          />
        )}

        <ProductDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          product={selectedProductForDetail}
          darkMode={darkMode}
        />


        <ExportFormatSelector isOpen={showExportFormatModal} onClose={() => setShowExportFormatModal(false)} onConfirm={handleExportWithFormat} title="Produk" darkMode={darkMode} />
        <PDFPreviewModal isOpen={showPDFPreviewModal} onClose={() => setShowPDFPreviewModal(false)} data={pdfPreviewData?.data} title={pdfPreviewData?.title} darkMode={darkMode} />

        {/* Modal peringatan untuk kesalahan penghapusan */}
        <ConfirmationModal
          isOpen={showWarningModal}
          onClose={() => setShowWarningModal(false)}
          onConfirm={() => setShowWarningModal(false)}
          title="Peringatan Penghapusan"
          message={warningMessage}
          confirmText="Oke"
          cancelText="Tutup"
          variant="warning"
        />

        {/* Loading state saat mengecek status import dari storage */}
        {isCheckingStoredImport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
            <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mr-3"></div>
                <span className={`text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>Memeriksa status import sebelumnya...</span>
              </div>
            </div>
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && !isCheckingStoredImport && (
          <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => { if (importStatus !== 'processing') resetImportState() }}>
                <div className={`${darkMode ? 'bg-gray-800 bg-opacity-75' : 'bg-gray-500 bg-opacity-75'}`}></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className={`inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full ${darkMode ? 'bg-gray-800' : 'bg-white'} ${darkMode ? 'border-gray-700' : 'border-gray-200'} border`}>
                <div className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${darkMode ? 'bg-gray-800' : ''}`}>
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className={`text-lg leading-6 font-medium ${darkMode ? 'text-purple-400' : 'text-purple-800'}`}>
                          Import Produk
                        </h3>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Format kolom: Kode, Nama, Stok, Kategori, Supplier, Deskripsi, Harga Beli, Harga Jual/Eceran, Harga Member Silver, Harga Member Gold, Harga Member Platinum (Partai)
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (importStatus !== 'processing') {
                            resetImportState();
                          }
                        }}
                        disabled={importStatus === 'processing'}
                        className="p-1 rounded-md text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {/* ----- Initial View & Preview ----- */}
                    {['idle', 'processing'].includes(importStatus) && (
                       <>
                        <div className={`mb-4 p-3 rounded-lg ${darkMode ? 'bg-gray-750 border border-gray-700' : 'bg-blue-50 border border-blue-200'}`}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <div>
                                <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-blue-700'}`}>NAMA FILE</span>
                                <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{importFileRef.current?.name || 'Belum dipilih'}</p>
                                </div>
                                {isFileChecked && (
                                <div>
                                <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-blue-700'}`}>JUMLAH DATA</span>
                                <p className={`text-sm font-medium ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>{previewData.totalRows > 0 ? `${previewData.totalRows} produk` : '0 produk'}</p>
                                </div>
                                )}
                            </div>
                            <div className={`mt-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <p>Format kolom yang didukung: Kode, Nama, Stok, Kategori, Supplier, Deskripsi, Harga Beli, Harga Jual/Eceran, Harga Member Silver, Harga Member Gold, Harga Member Platinum (Partai)</p>
                            </div>
                        </div>

                        {importStatus === 'processing' && (
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{importProgress.status}</span>
                                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{Math.round(importProgress.current)} / {importProgress.total}</span>
                                </div>
                                <div className={`w-full h-3 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                <div className="h-full bg-green-500 transition-all duration-500 ease-out" style={{ width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%` }}></div>
                                </div>
                            </div>
                        )}

                        {isFileChecked && previewData.show && previewData.previewData.length > 0 && (
                            <div className={`rounded-lg overflow-hidden mb-4 ${darkMode ? 'bg-gray-750 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                            <div className={`p-3 border-b ${darkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-100'}`}>
                                <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Preview Data ({previewData.totalRows} total baris)
                                </h4>
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                    <tr>
                                    {previewData.headers.map((header, index) => (
                                        <th key={index} className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{header}</th>
                                    ))}
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${darkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'} text-xs`}>
                                    {previewData.previewData.slice((previewCurrentPage - 1) * PREVIEW_ROWS_PER_PAGE, previewCurrentPage * PREVIEW_ROWS_PER_PAGE).map((row, rowIndex) => {
                                    const absoluteIndex = ((previewCurrentPage - 1) * PREVIEW_ROWS_PER_PAGE) + rowIndex;
                                    const isUploaded = importStatus === 'processing' && absoluteIndex < importProgress.current;
                                    return (
                                        <tr key={rowIndex} className={`${isUploaded ? (darkMode ? 'bg-green-800 bg-opacity-50' : 'bg-green-100') : (rowIndex % 2 === 0 ? (darkMode ? 'bg-gray-800' : 'bg-white') : (darkMode ? 'bg-gray-750' : 'bg-gray-50'))} transition-colors duration-300`}>
                                        {previewData.headers.map((header, cellIndex) => (
                                            <td key={cellIndex} className={`px-3 py-2 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{row[header] !== undefined ? String(row[header]) : '-'}</td>
                                        ))}
                                        </tr>
                                    );
                                    })}
                                </tbody>
                                </table>
                            </div>
                            {previewData.totalRows > PREVIEW_ROWS_PER_PAGE && (
                                <div className={`p-3 flex items-center justify-between ${darkMode ? 'bg-gray-700 border-t border-gray-600' : 'bg-gray-100 border-t border-gray-200'}`}>
                                <button onClick={() => setPreviewCurrentPage(p => Math.max(1, p - 1))} disabled={previewCurrentPage === 1} className={`px-3 py-1 text-sm rounded-md ${darkMode ? 'bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:text-gray-500' : 'bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400'}`}>Sebelumnya</button>
                                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Halaman {previewCurrentPage} dari {Math.ceil(previewData.totalRows / PREVIEW_ROWS_PER_PAGE)}</span>
                                <button onClick={() => setPreviewCurrentPage(p => Math.min(Math.ceil(previewData.totalRows / PREVIEW_ROWS_PER_PAGE), p + 1))} disabled={previewCurrentPage === Math.ceil(previewData.totalRows / PREVIEW_ROWS_PER_PAGE)} className={`px-3 py-1 text-sm rounded-md ${darkMode ? 'bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:text-gray-500' : 'bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400'}`}>Berikutnya</button>
                                </div>
                            )}
                            </div>
                        )}
                        </>
                    )}

                    {/* ----- Success View ----- */}
                    {importStatus === 'success' && (
                      <div className="text-center p-6">
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium">Import Berhasil</h3>
                        <p className={`mt-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {importProgress.current} dari {importProgress.total} produk berhasil diimpor.
                        </p>
                        {importProgress.current === 0 && (
                          <div className={`mt-4 p-3 rounded-md ${darkMode ? 'bg-red-900 bg-opacity-20 text-red-400' : 'bg-red-100 text-red-700'}`}>
                            <p className="text-sm">Perhatian: Tidak ada produk yang berhasil diimpor. Pastikan format file sesuai dengan template.</p>
                            <p className="text-xs mt-2">Format kolom yang didukung: Kode, Nama, Stok, Kategori, Supplier, Deskripsi, Harga Beli, Harga Jual/Eceran, Harga Member Silver, Harga Member Gold, Harga Member Platinum (Partai)</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ----- Partial Success / Error Details View ----- */}
                    {importStatus === 'success_with_errors' && (
                        <div>
                            <div className="text-center p-6 border-b border-gray-200 dark:border-gray-700">
                                <XCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                                <h3 className="text-lg font-medium">Import Selesai dengan Peringatan</h3>
                                <p className={`mt-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                Berhasil mengimpor {importProgress.current} dari {importProgress.total} produk. Terdapat {importErrors.length} baris yang gagal.
                                </p>
                            </div>
                            <div className="p-4">
                                <h4 className="font-bold mb-2">Detail Error:</h4>
                                <ul className="max-h-48 overflow-y-auto text-sm space-y-2">
                                    {importErrors.map((err, index) => (
                                        <li key={index} className={`p-2 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-red-50'}`}>
                                            <span className="font-semibold">Baris {err.row}:</span>
                                            <span className={`ml-2 ${darkMode ? 'text-red-400' : 'text-red-700'}`}>{err.error}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* ----- General Error View ----- */}
                    {importStatus === 'error' && (
                      <div className="text-center p-6">
                        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium">Import Gagal</h3>
                        <p className={`mt-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {importErrors[0]?.error || "Terjadi kesalahan saat memproses file. Silakan coba lagi."}
                        </p>
                      </div>
                    )}

                  </div>
                </div>

                <div className={`px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  {/* --- Action Buttons --- */}
                  {importStatus === 'idle' && (
                    <button type="button" onClick={handleCheckFile} disabled={isCheckingFile || !importFile} className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${isCheckingFile || !importFile ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                        {isCheckingFile ? 'Memeriksa...' : 'Cek File'}
                    </button>
                  )}
                  {importStatus === 'idle' && isFileChecked && (
                    <button type="button" onClick={startImportProcess} disabled={importLoading || previewData.totalRows === 0} className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${importLoading || previewData.totalRows === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
                        {`Import ${previewData.totalRows} produk`}
                    </button>
                  )}


                  {/* --- Close Button --- */}
                  <button
                    type="button"
                    onClick={() => {
                      if (importStatus === 'processing') {
                        return;
                      }
                      // Always reset the state when closing the modal after import is finished
                      resetImportState();
                    }}
                    className={`mt-3 w-full inline-flex justify-center rounded-md border shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm ${darkMode ? 'bg-gray-600 text-white hover:bg-gray-500 border-gray-500' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'}`}
                  >
                    {importStatus === 'idle' || importStatus === 'processing' ? 'Batal' : 'Tutup'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}