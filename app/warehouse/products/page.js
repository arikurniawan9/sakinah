'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Plus, Download, Upload, Trash2, Folder, Edit, Eye, X, CheckCircle, XCircle } from 'lucide-react';
import { useKeyboardShortcut } from '../../../lib/hooks/useKeyboardShortcut';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useUserTheme } from '../../../components/UserThemeContext';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import Tooltip from '../../../components/Tooltip';

import { useWarehouseProductTable } from '../../../lib/hooks/useWarehouseProductTable';
import { useWarehouseProductForm } from '../../../lib/hooks/useWarehouseProductForm'; // Import new hook
import { useTableSelection } from '../../../lib/hooks/useTableSelection';
import { useCachedCategories, useCachedSuppliers } from '../../../lib/hooks/useCachedData'; // Import data hooks

import DataTable from '../../../components/DataTable';
import ProductModal from '../../../components/produk/ProductModal'; // Import modal
import ConfirmationModal from '../../../components/ConfirmationModal';
import Breadcrumb from '../../../components/Breadcrumb';
import ExportFormatSelector from '../../../components/export/ExportFormatSelector';
import ProductDetailModal from '../../../components/produk/ProductDetailModal'; // Import ProductDetailModal

// Basic Add Stock Modal (Can be moved to its own file if it grows in complexity)
function AddStockModal({ isOpen, onClose, product, darkMode, onSave }) {
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !product) return null;

  const handleSave = async () => {
    if (quantityToAdd <= 0) {
      toast.error("Jumlah stok harus lebih dari 0.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/warehouse/products/${product.id}/add-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: quantityToAdd }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menambahkan stok.');
      }

      toast.success(`Berhasil menambahkan ${quantityToAdd} stok untuk ${product.name}`);
      onSave(); // Callback to refresh table
      onClose();
    } catch (error) {
      toast.error('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[101] overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className={`${darkMode ? 'bg-gray-800 bg-opacity-75' : 'bg-gray-500 bg-opacity-75'}`}></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className={`relative inline-block align-bottom ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${darkMode ? 'border-gray-700' : 'border-gray-200'} border`}>
          <div className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${darkMode ? 'bg-gray-800' : ''}`}>
            <h3 className={`text-lg leading-6 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Tambah Stok: {product.name}
            </h3>
            <div className="mt-2">
              <label htmlFor="quantityToAdd" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Jumlah yang Ditambahkan</label>
              <input
                type="number"
                id="quantityToAdd"
                value={quantityToAdd}
                onChange={(e) => setQuantityToAdd(parseInt(e.target.value) || 0)}
                min="1"
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200 bg-white text-gray-900'}`}
                disabled={loading}
              />
            </div>
          </div>
          <div className={`px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`mt-3 w-full inline-flex justify-center rounded-md border shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm ${darkMode ? 'bg-gray-600 text-white hover:bg-gray-500 border-gray-500' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'}`}
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function WarehouseProductsPage() {
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const { data: session } = useSession();
  const isWarehouse = session?.user?.role === 'WAREHOUSE';

  const isWarehouseRef = useRef(isWarehouse);
  isWarehouseRef.current = isWarehouse;

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState(null);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [selectedProductForStockUpdate, setSelectedProductForStockUpdate] = useState(null);


  const {
    products,
    loading,
    searchTerm,
    setSearchTerm,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    pagination,
    fetchProducts,
  } = useWarehouseProductTable();
  const fetchProductsRef = useRef(fetchProducts);
  fetchProductsRef.current = fetchProducts;
  
  // Form and Modal hook
  const {
    showModal,
    editingProduct,
    formData,
    openModalForCreate,
    openModalForEdit,
    closeModal,
    handleSave,
    handleInputChange
  } = useWarehouseProductForm(fetchProducts);

  // Cached data for forms
  const { categories, loading: categoriesLoading, error: categoriesError } = useCachedCategories();
  const { suppliers, loading: suppliersLoading, error: suppliersError } = useCachedSuppliers();

  const isInitialDataLoading = categoriesLoading || suppliersLoading;

  // Keyboard shortcuts
  useKeyboardShortcut({
    'alt+n': () => isWarehouse && openModalForCreate(), // Tambah produk baru
    'alt+i': () => {
      // Memicu fungsi import dengan mengklik input file tersembunyi
      handleImport(); // Panggil handleImport tanpa parameter untuk memicu input file
    }, // Import
    'alt+e': () => isWarehouse && handleExport(), // Export
    'alt+d': () => {
      // Download template produk gudang
      const link = document.createElement('a');
      link.href = '/templates/contoh-import-produk-gudang.csv';
      link.download = 'contoh-import-produk-gudang.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, // Download template
    'ctrl+k': (e) => {
      if (e) {
        e.preventDefault();
        // Fokus ke search input di DataTable
        const searchInput = document.querySelector('input[placeholder="Cari produk..."]') ||
                          document.querySelector('input[placeholder*="Cari"]') ||
                          document.querySelector('input[type="search"]');
        if (searchInput && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
          searchInput.focus();
        }
      }
    }, // Fokus ke search
    'alt+s': (e) => {
      if (e) e.preventDefault();
      if (showModal) {
        handleSave();
      }
    }, // Simpan jika modal terbuka
  });

  const { selectedRows, handleSelectAll, handleSelectRow, clearSelection, setSelectedRows } = useTableSelection(products);

  const [importLoading, setImportLoading] = useState(false);

  // Cek status import dari localStorage saat komponen dimuat
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Akses localStorage langsung tanpa menggunakan fungsi dari useCallback
      const importData = localStorage.getItem('warehouseImportStatus');
      const storedStatus = importData ? JSON.parse(importData) : null;

      if (storedStatus) {
        // Jika status sebelumnya adalah processing, tampilkan modal import dengan status tersebut
        if (storedStatus.status === 'processing') {
          setImportStatus(storedStatus.status);
          setImportProgress(storedStatus.progress);
          setShowImportModal(true);
          // Kita tidak bisa mengembalikan file asli, tapi kita bisa menunjukkan nama file
          setImportFile({ name: storedStatus.fileName });
        } else if (['success', 'error'].includes(storedStatus.status)) {
          // Jika status sebelumnya adalah success atau error, tampilkan modal dengan status tersebut
          setImportStatus(storedStatus.status);
          setImportProgress(storedStatus.progress);
          setShowImportModal(true);
          setImportFile({ name: storedStatus.fileName });
        }
      }
      setIsCheckingStoredImport(false);
    }
  }, []); // Kosongkan dependency array karena kita mengakses localStorage langsung di sini

  // Mencegah pengguna meninggalkan halaman saat proses import sedang berlangsung
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Baca status langsung dari localStorage untuk menghindari dependensi pada state React
      const importData = localStorage.getItem('warehouseImportStatus');
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
  }, []); // Dependency array kosong, efek ini hanya berjalan sekali saat mount dan unmount
  const [exportLoading, setExportLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);
  const [showExportFormatModal, setShowExportFormatModal] = useState(false);
  const [showImportConfirmModal, setShowImportConfirmModal] = useState(false);
  const [duplicateProducts, setDuplicateProducts] = useState([]);
  const [fileToImport, setFileToImport] = useState(null);
  const fileToImportRef = useRef(fileToImport);
  fileToImportRef.current = fileToImport;
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const importFileRef = useRef(importFile);
  importFileRef.current = importFile;
  const [importStatus, setImportStatus] = useState('idle'); // idle, processing, success, error
  const [isCheckingStoredImport, setIsCheckingStoredImport] = useState(true); // Untuk mengecek apakah sedang mengecek status import dari storage
  const [isFileChecked, setIsFileChecked] = useState(false);
  const [isCheckingFile, setIsCheckingFile] = useState(false);
  const [importErrors, setImportErrors] = useState([]);
  const [previewCurrentPage, setPreviewCurrentPage] = useState(1);
  const PREVIEW_ROWS_PER_PAGE = 10;

  // Fungsi untuk menyimpan status import ke localStorage
  const saveImportStatus = useCallback((status, file = null, progress = null) => {
    if (typeof window !== 'undefined') {
      const importData = {
        status,
        timestamp: Date.now(),
        fileName: file ? file.name : null,
        progress: progress || { current: 0, total: 0, status: '' }
      };
      localStorage.setItem('warehouseImportStatus', JSON.stringify(importData));
    }
  }, []);
  const saveImportStatusRef = useRef(saveImportStatus);
  saveImportStatusRef.current = saveImportStatus;

  // Fungsi untuk mendapatkan status import dari localStorage
  const getImportStatus = useCallback(() => {
    if (typeof window !== 'undefined') {
      const importData = localStorage.getItem('warehouseImportStatus');
      return importData ? JSON.parse(importData) : null;
    }
    return null;
  }, []);

  // Fungsi untuk menghapus status import dari localStorage
  const clearImportStatus = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('warehouseImportStatus');
    }
  }, []);

  const handleDelete = (id) => {
    if (!isWarehouse) return;
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDeleteMultiple = () => {
    if (!isWarehouse || selectedRows.length === 0) return;
    setItemToDelete(selectedRows);
    setIsDeletingMultiple(false); // Reset loading state sebelum menampilkan modal
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete || !isWarehouse) return;

    const isMultiple = Array.isArray(itemToDelete);
    // Gunakan state yang sesuai tergantung apakah single atau multiple delete
    if (isMultiple) {
      setIsDeletingMultiple(true);
    } else {
      setIsDeleting(true);
    }

    let url = '/api/warehouse/products';
    let options = {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    };

    if (isMultiple) {
      options.body = JSON.stringify({ ids: itemToDelete });
    } else {
      url += `/${itemToDelete}`;
    }

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menghapus produk gudang');
      }

      fetchProducts();
      if (isMultiple) {
        clearSelection();
        toast.success(`Berhasil menghapus ${itemToDelete.length} produk gudang`);
      } else {
        setSelectedRows(prev => prev.filter(rowId => rowId !== itemToDelete));
        toast.success('Produk gudang berhasil dihapus');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat menghapus: ' + err.message);
    } finally {
      // Reset state loading yang sesuai
      if (isMultiple) {
        setIsDeletingMultiple(false);
      } else {
        setIsDeleting(false);
      }
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, status: '', show: false });
  const importProgressRef = useRef(importProgress);
  importProgressRef.current = importProgress;
  const [previewData, setPreviewData] = useState({ headers: [], previewData: [], totalRows: 0, show: false });

  const handleImport = useCallback(async (e) => {
    if (!isWarehouseRef.current) return;

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
  }, []); // Empty dependency array

  const handleCheckFile = useCallback(async () => {
    if (!importFileRef.current) {
      toast.error("Tidak ada file yang dipilih.");
      return;
    }
    setIsCheckingFile(true);
    try {
      // Baca file untuk mengetahui jumlah produk sebelum dikirim
      const totalProducts = await getTotalProductsFromFile(importFileRef.current);

      // Baca preview data
      const preview = await getPreviewDataFromFile(importFileRef.current);

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

  const processImport = useCallback(async (formData, event = null) => {
    setImportLoading(true);
    setImportStatus('processing');

    const total = importProgressRef.current.total;
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
    
    saveImportStatusRef.current('processing', importFileRef.current, importProgressRef.current);
    toast.info('Mengirim file untuk diimpor...');

    try {
      const response = await fetch('/api/warehouse/products/import', { method: 'POST', body: formData });
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
      } else if (result.needConfirmation && result.duplicateProducts) {
        setDuplicateProducts(result.duplicateProducts);
        setImportStatus('confirmation_needed');
        setShowImportConfirmModal(true);
      } else {
        setImportStatus('success');
        toast.success(result.message || `Berhasil mengimpor ${importedCount} produk.`);
      }

      fetchProductsRef.current();

    } catch (err) {
      clearInterval(progressInterval);
      setImportStatus('error');
      setImportErrors([{ row: 'General', error: err.message }]);
      toast.error('Terjadi kesalahan saat import: ' + err.message);
    } finally {
      clearInterval(progressInterval);
      setImportLoading(false);
    }
  }, []); // Empty dependency array
  const processImportRef = useRef(processImport);
  processImportRef.current = processImport;


  const handleImportWithConfirmation = useCallback(async (force) => {
    if (!fileToImportRef.current) {
        toast.error("File import tidak ditemukan. Silakan coba lagi.");
        return;
    }

    setShowImportConfirmModal(false);

    // Baca kembali file untuk mendapatkan jumlah produk
    const totalProducts = await getTotalProductsFromFileRef.current(fileToImportRef.current);

    const formData = new FormData();
    formData.append('file', fileToImportRef.current);
    formData.append('force', String(force));

    setImportLoading(true);
    setImportStatus('processing');
    const initialProgress = {
      current: 0,
      total: totalProducts,
      status: force ? `Mengimpor dan menimpa produk... (0/${totalProducts})` : `Mengimpor dan menambahkan stok... (0/${totalProducts})`,
      show: true
    };
    setImportProgress(initialProgress);
    // Simpan status import ke localStorage
    saveImportStatusRef.current('processing', fileToImportRef.current, initialProgress);
    toast.info(force ? 'Mengimpor dan menimpa produk yang sudah ada...' : 'Mengimpor dan menambahkan stok produk yang sudah ada...');

    try {
      const response = await fetch('/api/warehouse/products/import', { method: 'POST', body: formData });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal memproses file import');
      }

      // Update progress setelah selesai
      const updatedProgress = {
        current: result.importedCount || 0,
        total: totalProducts || result.importedCount || 0,
        status: `Selesai - ${result.importedCount || 0} produk berhasil diimpor`,
        show: true
      };
      setImportProgress(updatedProgress);
      // Perbarui status di localStorage
      saveImportStatusRef.current('success', fileToImportRef.current, updatedProgress);

      setImportStatus('success');
      fetchProductsRef.current();
      toast.success(result.message || `Berhasil mengimpor ${result.importedCount || 0} produk gudang`);
      if (result.errors && result.errors.length > 0) {
        console.warn('Import errors:', result.errors);
        toast.warn(`Beberapa produk gudang gagal diimpor: ${result.errors.length} error(s)`);
      }
      // Clear all import related states on success
      resetImportStateRef.current();
    } catch (err) {
      setImportStatus('error');
      // Perbarui status di localStorage
      saveImportStatusRef.current('error', fileToImportRef.current, importProgressRef.current);
      toast.error('Terjadi kesalahan saat import: ' + err.message);
    } finally {
      setImportLoading(false);
      // Hide progress after a short delay
      setTimeout(() => {
        setImportProgress({ current: 0, total: 0, status: '', show: false });
        setPreviewData({ headers: [], previewData: [], totalRows: 0, show: false });
      }, 2000);
    }
  }, []);


  const startImportProcess = useCallback(async () => {
    if (!importFileRef.current) return;

    // Simpan status import ke localStorage sebelum memulai proses
    saveImportStatusRef.current('processing', importFileRef.current, importProgressRef.current);

    const formData = new FormData();
    formData.append('file', importFileRef.current);

    await processImportRef.current(formData);
  }, []);

  const resetImportState = useCallback(() => {
    setFileToImport(null);
    setDuplicateProducts([]);
    setShowImportConfirmModal(false);
    setPreviewData({ headers: [], previewData: [], totalRows: 0, show: false });
    setImportFile(null);
    setShowImportModal(false);
    setImportStatus('idle');
    setImportErrors([]);
    // Hapus status import dari localStorage
    clearImportStatus();
  }, [clearImportStatus]);
  const resetImportStateRef = useRef(resetImportState);
  resetImportStateRef.current = resetImportState;

  const openExportFormatSelector = () => {
    setShowExportFormatModal(true);
  };

  const handleExportWithFormat = async (format) => {
    setExportLoading(true);
    try {
      const response = await fetch('/api/warehouse/products/export');
      if (!response.ok) throw new Error('Gagal mengambil data untuk export');
      const data = await response.json();

      const exportData = data.data;

      if (format === 'excel') {
        try {
          const { utils, writeFile } = await import('xlsx');
          const worksheet = utils.json_to_sheet(exportData);

          const colWidths = [
            { wch: 15 }, { wch: 20 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
            { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
            { wch: 15 }, { wch: 15 }
          ];
          worksheet['!cols'] = colWidths;

          const workbook = utils.book_new();
          utils.book_append_sheet(workbook, worksheet, 'Produk Gudang');

          const fileName = `produk-gudang-${new Date().toISOString().slice(0, 10)}.xlsx`;
          writeFile(workbook, fileName);
        } catch (error) {
          console.error('Error saat ekspor ke Excel:', error);
          toast.error('Gagal ekspor ke Excel, silakan coba format lain');
          return;
        }
      } else {
        let csvContent = 'Nama Produk,Kode Produk,Stok,Harga Beli,Kategori,Supplier,Deskripsi,Tanggal Dibuat,Tanggal Diubah\n';
        exportData.forEach(row => {
          const csvRow = [
            `"${row['Nama Produk'].replace(/"/g, '""')}"`, `"${row['Kode Produk'].replace(/"/g, '""')}"`,
            row['Stok'], row['Harga Beli'], `"${row['Kategori']}"`, `"${row['Supplier']}"`,
            `"${row['Deskripsi'].replace(/"/g, '""')}"`, `"${row['Tanggal Dibuat']}"`,
            `"${row['Tanggal Diubah']}"`
          ].join(',');
          csvContent += csvRow + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `produk-gudang-${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast.success(`Data produk gudang berhasil diekspor dalam format ${format.toUpperCase()}`);
    } catch (err) {
      toast.error('Terjadi kesalahan saat export: ' + err.message);
    } finally {
      setExportLoading(false);
    }
  };

  const handleExport = () => {
    openExportFormatSelector();
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const columns = [
    { key: 'productCode', title: 'Kode Produk', sortable: true },
    { key: 'name', title: 'Nama Produk', sortable: true },
    {
      key: 'stock',
      title: 'Stok',
      render: (value) => value?.toLocaleString('id-ID') || 0,
      sortable: true
    },
    {
      key: 'purchasePrice',
      title: 'Harga Beli',
      render: (value) => `Rp ${(value || 0).toLocaleString('id-ID')}`,
      sortable: true
    },
    {
      key: 'retailPrice',
      title: 'Harga Umum',
      render: (value) => `Rp ${(value || 0).toLocaleString('id-ID')}`,
      sortable: true
    },
    // Kategori and Supplier columns removed as per user request
    // { key: 'category.name', title: 'Kategori', render: (value, row) => row.category?.name || '-', sortable: true },
    // { key: 'supplier.name', title: 'Supplier', render: (value, row) => row.supplier?.name || '-', sortable: true }
  ];

  // Connect the Edit button to the modal
  const handleEdit = (product) => {
    if (!isWarehouse) return;
    openModalForEdit(product);
  };

  const handleViewDetails = (product) => {
    // Placeholder for opening product detail modal
    console.log('View details for:', product);
    setSelectedProductForDetail(product);
    setShowDetailModal(true);
  };

  const handleOpenAddStockModal = (product) => {
    // Placeholder for opening add stock modal
    console.log('Add stock for:', product);
    setSelectedProductForStockUpdate(product);
    setShowAddStockModal(true);
  };

  const enhancedProducts = products.map(product => ({
    ...product,
    onEdit: isWarehouse ? () => handleEdit(product) : undefined,
    onDelete: isWarehouse ? () => handleDelete(product.id) : undefined,
    onViewDetails: () => handleViewDetails(product), // Add view details action
    onAddStock: () => handleOpenAddStockModal(product) // Add add stock action
  }));

  const rowActions = (row) => (
    <div className="flex space-x-2">
      <button onClick={() => handleViewDetails(row)} className={`p-1.5 rounded-md ${darkMode ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-gray-200'}`} title="Detail Produk"><Eye className="h-4 w-4" /></button>
      <button onClick={() => handleOpenAddStockModal(row)} className={`p-1.5 rounded-md ${darkMode ? 'text-green-400 hover:bg-gray-700' : 'text-green-600 hover:bg-gray-200'}`} title="Tambah Stok"><Plus className="h-4 w-4" /></button>
      <button onClick={() => handleEdit(row)} className={`p-1.5 rounded-md ${darkMode ? 'text-yellow-400 hover:bg-gray-700' : 'text-yellow-600 hover:bg-gray-200'}`} title="Edit"><Edit className="h-4 w-4" /></button>
      <button onClick={() => handleDelete(row.id)} className={`p-1.5 rounded-md ${darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-gray-200'}`} title="Hapus"><Trash2 className="h-4 w-4" /></button>
    </div>
  );

  const paginationData = {
    currentPage: pagination.currentPage || 1,
    totalPages: pagination.totalPages || 1,
    totalItems: pagination.total || 0,
    startIndex: pagination.startIndex || 1,
    endIndex: pagination.endIndex || 0,
    onPageChange: setCurrentPage,
    itemsPerPage: itemsPerPage
  };

  return (
    <ProtectedRoute requiredRole="WAREHOUSE">
      <main className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${darkMode ? 'bg-gray-900 text-gray-100' : ''}`}>
        <Breadcrumb items={[{ title: 'Produk Gudang', href: '/warehouse/products' }]} darkMode={darkMode} />
        <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Manajemen Produk Gudang</h1>

        {/* Hidden file input for import shortcut */}
        <input
          id="hidden-import-file-input"
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: 'none' }}
          onChange={handleImport}
        />

        <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-theme-purple-700' : 'bg-white border-gray-200'} border`}>
          <DataTable
            data={enhancedProducts}
            columns={columns}
            loading={loading || categoriesLoading || suppliersLoading}
            darkMode={darkMode}
            pagination={paginationData}
            mobileColumns={['name', 'stock', 'purchasePrice']}
            rowActions={rowActions}
            emptyMessage="Tidak ada produk gudang ditemukan"
            selectable={true}
            onSelectAll={handleSelectAll}
            onSelectRow={handleSelectRow}
            selectedRows={selectedRows}
            showSearch={true}
            onSearch={setSearchTerm}
            showToolbar={true}
            showAdd={isWarehouse}
            onAdd={openModalForCreate}
            showExport={true}
            onExport={handleExport}
            showImport={isWarehouse}
            onImport={(e) => handleImport(e)}
            onItemsPerPageChange={setItemsPerPage}
            itemsPerPage={itemsPerPage}
            onDeleteMultiple={handleDeleteMultiple}
            selectedRowsCount={selectedRows.length}
            importLoading={importLoading}
            exportLoading={exportLoading}
            deleteMultipleLoading={isDeletingMultiple}
            showTemplate={true}
            onTemplateDownload={() => {
              const link = document.createElement('a');
              link.href = '/templates/contoh-import-produk-gudang.csv';
              link.download = 'contoh-import-produk-gudang.csv';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          />
        </div>

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
              <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => { if (importStatus !== 'processing') resetImportStateRef.current() }}>
                <div className={`${darkMode ? 'bg-gray-800 bg-opacity-75' : 'bg-gray-500 bg-opacity-75'}`}></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className={`inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full ${darkMode ? 'bg-gray-800' : 'bg-white'} ${darkMode ? 'border-gray-700' : 'border-gray-200'} border`}>
                <div className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${darkMode ? 'bg-gray-800' : ''}`}>
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className={`text-lg leading-6 font-medium ${darkMode ? 'text-purple-400' : 'text-purple-800'}`}>
                        Import Produk Gudang
                      </h3>
                      <button
                        onClick={() => {
                          if (importStatus !== 'processing') {
                            resetImportStateRef.current();
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
                                <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{importFile?.name || 'Belum dipilih'}</p>
                                </div>
                                {isFileChecked && (
                                <div>
                                <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-blue-700'}`}>JUMLAH DATA</span>
                                <p className={`text-sm font-medium ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>{previewData.totalRows > 0 ? `${previewData.totalRows} produk` : '0 produk'}</p>
                                </div>
                                )}
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
                  {importStatus === 'idle' && !isFileChecked && (
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
                    onClick={() => resetImportStateRef.current()}
                    className={`mt-3 w-full inline-flex justify-center rounded-md border shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm ${darkMode ? 'bg-gray-600 text-white hover:bg-gray-500 border-gray-500' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'}`}
                  >
                    {importStatus === 'idle' || importStatus === 'processing' ? 'Batal' : 'Tutup'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Product Modal */}
        {isWarehouse && (
          <ProductModal
            showModal={showModal}
            closeModal={closeModal}
            editingProduct={editingProduct}
            formData={formData}
            handleInputChange={handleInputChange}
            handleTierChange={() => {}}
            addTier={() => {}}
            removeTier={() => {}}
            handleSave={handleSave}
            darkMode={darkMode}
            categories={categories}
            suppliers={suppliers}
          />
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setItemToDelete(null);
            setIsDeletingMultiple(false); // Reset loading state saat modal ditutup
          }}
          onConfirm={handleConfirmDelete}
          title="Konfirmasi Hapus Produk"
          message={
            isDeletingMultiple || isDeleting
              ? <div className="flex items-center">
                  <span>
                    {isDeletingMultiple
                      ? `Menghapus ${Array.isArray(itemToDelete) ? itemToDelete.length : 1} produk`
                      : "Menghapus produk"}
                  </span>
                  <span className="ml-2 flex space-x-1">
                    <span className="inline-block w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="inline-block w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    <span className="inline-block w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></span>
                  </span>
                </div>
              : Array.isArray(itemToDelete) && itemToDelete.length > 1
                ? `Apakah Anda yakin ingin menghapus ${itemToDelete.length} produk ini? Tindakan ini akan menghapus produk dan semua data terkait termasuk stok. Tindakan ini tidak dapat dibatalkan.`
                : "Apakah Anda yakin ingin menghapus produk ini? Tindakan ini akan menghapus produk dan semua data terkait termasuk stok. Tindakan ini tidak dapat dibatalkan."
          }
          isLoading={isDeleting || isDeletingMultiple}
        />

        {/* Import Confirmation Modal */}
        {showImportConfirmModal && (
          <ConfirmationModal
            isOpen={showImportConfirmModal}
            onClose={() => {
              setShowImportConfirmModal(false);
              setDuplicateProducts([]);
              setFileToImport(null);
            }}
            onConfirm={() => handleImportWithConfirmation(true)}
            onConfirmSecondary={() => handleImportWithConfirmation(false)}
            title="Konfirmasi Import Produk"
            message={`Terdapat ${duplicateProducts.length} produk yang sudah ada di sistem. Apakah Anda ingin menimpa data produk yang sudah ada beserta menambahkan stoknya?`}
            hasSecondaryAction={true}
            secondaryActionText="Tambahkan stok saja"
            primaryActionText="Timpa semua"
          />
        )}

        {/* Export Format Selector Modal */}
        {showExportFormatModal && (
          <ExportFormatSelector
            isOpen={showExportFormatModal}
            onClose={() => setShowExportFormatModal(false)}
            onConfirm={handleExportWithFormat}
            title="Pilih Format Ekspor"
            description="Pilih format file yang ingin Anda gunakan untuk mengekspor data produk gudang"
          />
        )}

        {/* Product Detail Modal */}
        {selectedProductForDetail && (
            <ProductDetailModal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                product={selectedProductForDetail}
                darkMode={darkMode}
            />
        )}

        {/* Add Stock Modal */}
        {selectedProductForStockUpdate && (
            <AddStockModal
                isOpen={showAddStockModal}
                onClose={() => setShowAddStockModal(false)}
                product={selectedProductForStockUpdate}
                darkMode={darkMode}
                onSave={fetchProducts} // Refresh the product list after stock update
            />
        )}


        {/* Keyboard Shortcuts Guide */}
        <div className={`mt-4 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <div className="flex flex-wrap gap-3">
            <span>Tambah: <kbd className={`px-1.5 py-0.5 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>Alt+N</kbd></span>
            <span>Import: <kbd className={`px-1.5 py-0.5 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>Alt+I</kbd></span>
            <span>Export: <kbd className={`px-1.5 py-0.5 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>Alt+E</kbd></span>
            <span>Template: <kbd className={`px-1.5 py-0.5 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>Alt+D</kbd></span>
            <span>Cari: <kbd className={`px-1.5 py-0.5 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>Ctrl+K</kbd></span>
            <span>Simpan: <kbd className={`px-1.5 py-0.5 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>Alt+S</kbd></span>
            <span>Tutup: <kbd className={`px-1.5 py-0.5 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>ESC</kbd></span>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}