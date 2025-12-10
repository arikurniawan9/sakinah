import { useState, useRef } from 'react';
import { X, Printer, Download, FileText, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';

// Fungsi untuk mendapatkan nama toko secara aman
const getStoreName = (propStoreName) => {
  // Jika storeName diberikan sebagai objek dengan properti name
  if (propStoreName && typeof propStoreName === 'object' && propStoreName.name) {
    return propStoreName.name;
  }

  // Jika storeName diberikan sebagai string
  if (propStoreName && typeof propStoreName === 'string') {
    return propStoreName;
  }

  // Jika tidak, coba dari localStorage
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    return localStorage.getItem('storeName') || 'TOKO SAKINAH';
  }

  // Default saat di server
  return 'TOKO SAKINAH'; // Gunakan nama default dari aplikasi
};

// Fungsi untuk mendapatkan nama kota dari alamat toko
const getCityFromAddress = (address) => {
  if (!address) {
    return 'Cianjur';
  }

  // Jika alamat terlalu panjang, gunakan "Cianjur" sebagai default
  if (address.length > 100) {
    return 'Cianjur';
  }

  // Mencari nama kota dari alamat
  // Pisahkan alamat berdasarkan koma atau titik dan ambil bagian akhir yang mungkin berisi kota
  const addressParts = address.split(/[,./]/);
  // Mencari bagian yang paling mungkin sebagai nama kota
  for (let i = addressParts.length - 1; i >= 0; i--) {
    const part = addressParts[i].trim();
    // Memastikan bagian ini tidak kosong dan bukan hanya angka
    if (part && !/^\d+$/.test(part)) {
      // Jika bagian terakhir bukan hanya angka atau kode pos, kembalikan sebagai kota
      return part;
    }
  }

  // Jika tidak ada bagian yang valid, kembalikan 'Cianjur' sebagai default
  return 'Cianjur';
};

// Komponen untuk preview laporan penjualan
const SalesReportPreview = ({ reportData, darkMode, storeName, storeAddress }) => {
  const {
    totalSales = 0,
    totalTransactions = 0,
    averageTransactionValue = 0,
    dailySalesData = [],
    productSalesData = [],
    recentTransactions = []
  } = reportData;

  // Format currency
  const formatCurrencyIDR = (amount) => {
    if (typeof amount !== 'number') return 'Rp 0';
    return formatCurrency(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Fungsi untuk mendapatkan nama toko secara aman
  const getStoreNameLocal = () => {
    // Jika storeName diberikan sebagai objek dengan properti name
    if (storeName && typeof storeName === 'object' && storeName.name) {
      return storeName.name;
    }

    // Jika storeName diberikan sebagai string
    if (storeName && typeof storeName === 'string') {
      return storeName;
    }

    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      return localStorage.getItem('storeName') || 'TOKO SAKINAH';
    }

    return 'TOKO SAKINAH';
  };

  // Dapatkan kota dari alamat toko
  const city = getCityFromAddress(storeAddress);

  return (
    <div className="w-full print:w-[210mm]">
      {/* Header */}
      <div className="text-center mb-4 border-b pb-3">
        <p className="text-2xl font-bold">LAPORAN PENJUALAN</p>
        <h1 className="mt-1 text-xl font-bold">{getStoreName(storeName)}</h1>
        <p className="text-sm mt-1">Periode: {dailySalesData.length > 0 ?
          `${new Date(dailySalesData[0]?.fullDate || dailySalesData[0]?.date || '').toLocaleDateString('id-ID')} s/d ${new Date(dailySalesData[dailySalesData.length - 1]?.fullDate || dailySalesData[dailySalesData.length - 1]?.date || '').toLocaleDateString('id-ID')}`
          : '-'}</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
        <div className="border rounded p-2">
          <p className="font-semibold">Total Penjualan</p>
          <p className="text-right font-bold text-green-600">{formatCurrencyIDR(totalSales)}</p>
        </div>
        <div className="border rounded p-2">
          <p className="font-semibold">Total Transaksi</p>
          <p className="text-right font-bold">{totalTransactions}</p>
        </div>
        <div className="border rounded p-2">
          <p className="font-semibold">Rata-rata/Transaksi</p>
          <p className="text-right font-bold">{formatCurrencyIDR(averageTransactionValue)}</p>
        </div>
      </div>

      {/* Daily Sales Table */}
      <div className="mb-4">
        <h3 className="font-semibold mb-1 text-sm border-b pb-1">Penjualan Harian</h3>
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1 text-left text-xs font-medium">Tanggal</th>
              <th className="border px-2 py-1 text-right text-xs font-medium">Penjualan</th>
            </tr>
          </thead>
          <tbody>
            {dailySalesData.length > 0 ? (
              dailySalesData.map((item, index) => (
                <tr key={index}>
                  <td className="border px-2 py-1 text-xs">{item.name}</td>
                  <td className="border px-2 py-1 text-right">{formatCurrencyIDR(item.sales)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2" className="border px-2 py-1 text-center text-xs">Tidak ada data</td>
              </tr>
            )}
            <tr className="font-bold">
              <td className="border px-2 py-1 text-xs">JUMLAH</td>
              <td className="border px-2 py-1 text-right">{formatCurrencyIDR(totalSales)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Top Products Table */}
      <div className="mb-4">
        <h3 className="font-semibold mb-1 text-sm border-b pb-1">Produk Terlaris</h3>
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1 text-left text-xs font-medium">Produk</th>
              <th className="border px-2 py-1 text-right text-xs font-medium">Jumlah Terjual</th>
            </tr>
          </thead>
          <tbody>
            {productSalesData.length > 0 ? (
              productSalesData.map((item, index) => (
                <tr key={index}>
                  <td className="border px-2 py-1 text-xs">{item.name}</td>
                  <td className="border px-2 py-1 text-right">{item.value} item</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2" className="border px-2 py-1 text-center text-xs">Tidak ada data</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Recent Transactions Table */}
      <div className="mb-6">
        <h3 className="font-semibold mb-1 text-sm border-b pb-1">Transaksi Terbaru</h3>
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1 text-left text-xs font-medium">No. Invoice</th>
              <th className="border px-2 py-1 text-left text-xs font-medium">Tanggal</th>
              <th className="border px-2 py-1 text-right text-xs font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction, index) => (
                <tr key={transaction.id}>
                  <td className="border px-2 py-1 text-xs">{transaction.invoiceNumber}</td>
                  <td className="border px-2 py-1 text-xs">{new Date(transaction.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td className="border px-2 py-1 text-right">{formatCurrencyIDR(transaction.totalAmount)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="border px-2 py-1 text-center text-xs">Tidak ada data</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Signature Area */}
      <div className="mt-6 grid grid-cols-2 gap-4 text-xs">
        <div className="text-center">
          <p className="mb-8">Disiapkan Oleh,</p>
          <p>_______________________</p>
        </div>
        <div className="text-center">
          <p className="mb-8">Disetujui Oleh,</p>
          <p>_______________________</p>
        </div>
      </div>

      {/* Prepared date */}
      <div className="text-center mt-6 text-xs">
        {city}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
      </div>
    </div>
  );
};

// Komponen untuk preview laporan laba rugi
const ProfitLossReportPreview = ({ reportData, darkMode, storeName, storeAddress }) => {
  const { summary = {}, dailyData = [] } = reportData || {};

  // Format currency
  const formatCurrencyIDR = (amount) => {
    if (typeof amount !== 'number') return 'Rp 0';
    return formatCurrency(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Dapatkan kota dari alamat toko
  const city = getCityFromAddress(storeAddress);

  return (
    <div className="w-full print:w-[210mm]">
      {/* Header */}
      <div className="text-center mb-4 border-b pb-3">
        <p className="text-2xl font-bold">LAPORAN LABA RUGI</p>
        <h1 className="mt-1 text-xl font-bold">{getStoreName(storeName)}</h1>
        <p className="text-sm mt-1">Periode: {dailyData.length > 0 ?
          `${new Date(dailyData[0]?.fullDate || dailyData[0]?.date || '').toLocaleDateString('id-ID')} s/d ${new Date(dailyData[dailyData.length - 1]?.fullDate || dailyData[dailyData.length - 1]?.date || '').toLocaleDateString('id-ID')}`
          : '-'}</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
        <div className="border rounded p-2">
          <p className="font-semibold">Total Pendapatan</p>
          <p className="text-right font-bold text-green-600">{formatCurrencyIDR(summary.totalSales || 0)}</p>
        </div>
        <div className="border rounded p-2">
          <p className="font-semibold">Total Pengeluaran</p>
          <p className="text-right font-bold text-red-600">{formatCurrencyIDR(summary.totalExpenses || 0)}</p>
        </div>
        <div className="border rounded p-2">
          <p className="font-semibold">Laba Bersih</p>
          <p className={`text-right font-bold ${summary.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {formatCurrencyIDR(summary.netProfit || 0)}
          </p>
        </div>
      </div>

      {/* Daily Data Table */}
      <div className="mb-6">
        <h3 className="font-semibold mb-1 text-sm border-b pb-1">Data Harian</h3>
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1 text-left text-xs font-medium">Tanggal</th>
              <th className="border px-2 py-1 text-right text-xs font-medium">Pendapatan</th>
              <th className="border px-2 py-1 text-right text-xs font-medium">Pengeluaran</th>
              <th className="border px-2 py-1 text-right text-xs font-medium">Laba Bersih</th>
            </tr>
          </thead>
          <tbody>
            {dailyData.length > 0 ? (
              dailyData.map((item, index) => (
                <tr key={index}>
                  <td className="border px-2 py-1 text-xs">{item.name}</td>
                  <td className="border px-2 py-1 text-right">{formatCurrencyIDR(item.sales)}</td>
                  <td className="border px-2 py-1 text-right">{formatCurrencyIDR(item.expenses)}</td>
                  <td className={`border px-2 py-1 text-right ${item.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {formatCurrencyIDR(item.profit)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="border px-2 py-1 text-center text-xs">Tidak ada data</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Signature Area */}
      <div className="mt-6 grid grid-cols-2 gap-4 text-xs">
        <div className="text-center">
          <p className="mb-8">Disiapkan Oleh,</p>
          <p>_______________________</p>
        </div>
        <div className="text-center">
          <p className="mb-8">Disetujui Oleh,</p>
          <p>_______________________</p>
        </div>
      </div>

      {/* Prepared date */}
      <div className="text-center mt-6 text-xs">
        {city}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
      </div>
    </div>
  );
};

// Komponen untuk preview laporan pengeluaran
const ExpenseReportPreview = ({ reportData, darkMode, storeName, storeAddress }) => {
  const { expenses = [], categories = [] } = reportData || {};

  // Format currency
  const formatCurrencyIDR = (amount) => {
    if (typeof amount !== 'number') return 'Rp 0';
    return formatCurrency(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Get category name by ID
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Kategori Tidak Dikenal';
  };

  // Calculate total expenses
  const totalExpensesAmount = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  // Dapatkan kota dari alamat toko
  const city = getCityFromAddress(storeAddress);

  return (
    <div className="w-full print:w-[210mm]">
      {/* Header */}
      <div className="text-center mb-4 border-b pb-3">
        <p className="text-2xl font-bold">LAPORAN PENGELUARAN</p>
        <h1 className="mt-1 text-xl font-bold">{getStoreName(storeName)}</h1>
        <p className="text-sm mt-1">Periode: {expenses.length > 0 ?
          `${new Date(expenses[0]?.date || '').toLocaleDateString('id-ID')} s/d ${new Date(expenses[expenses.length - 1]?.date || '').toLocaleDateString('id-ID')}`
          : '-'}</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
        <div className="border rounded p-2">
          <p className="font-semibold">Jumlah Pengeluaran:</p>
          <p className="text-right font-bold">{expenses.length} item</p>
        </div>
        <div className="border rounded p-2">
          <p className="font-semibold">Total Pengeluaran:</p>
          <p className="text-right font-bold text-red-600">{formatCurrencyIDR(totalExpensesAmount)}</p>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="mb-6">
        <h3 className="font-semibold mb-1 text-sm border-b pb-1">Detail Pengeluaran</h3>
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1 text-left text-xs font-medium">No</th>
              <th className="border px-2 py-1 text-left text-xs font-medium">Kategori</th>
              <th className="border px-2 py-1 text-left text-xs font-medium">Deskripsi</th>
              <th className="border px-2 py-1 text-left text-xs font-medium">Tanggal</th>
              <th className="border px-2 py-1 text-right text-xs font-medium">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length > 0 ? (
              expenses.map((expense, index) => (
                <tr key={expense.id}>
                  <td className="border px-2 py-1 text-xs">{index + 1}</td>
                  <td className="border px-2 py-1 text-xs">{getCategoryName(expense.expenseCategoryId)}</td>
                  <td className="border px-2 py-1 text-xs">{expense.description || '-'}</td>
                  <td className="border px-2 py-1 text-xs">{formatDate(expense.date)}</td>
                  <td className="border px-2 py-1 text-right">{formatCurrencyIDR(expense.amount)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="border px-2 py-1 text-center text-xs">Tidak ada data</td>
              </tr>
            )}
            <tr className="font-bold">
              <td colSpan="4" className="border px-2 py-1 text-right text-xs">TOTAL</td>
              <td className="border px-2 py-1 text-right">{formatCurrencyIDR(totalExpensesAmount)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Signature Area */}
      <div className="mt-6 grid grid-cols-2 gap-4 text-xs">
        <div className="text-center">
          <p className="mb-8">Disiapkan Oleh,</p>
          <p>_______________________</p>
        </div>
        <div className="text-center">
          <p className="mb-8">Disetujui Oleh,</p>
          <p>_______________________</p>
        </div>
      </div>

      {/* Prepared date */}
      <div className="text-center mt-6 text-xs">
        {city}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
      </div>
    </div>
  );
};

// Komponen untuk preview laporan piutang
const ReceivableReportPreview = ({ reportData, darkMode, storeName, storeAddress }) => {
  const { receivables = [] } = reportData || {};

  // Format currency
  const formatCurrencyIDR = (amount) => {
    if (typeof amount !== 'number') return 'Rp 0';
    return formatCurrency(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Calculate total receivables
  const totalReceivables = receivables.reduce((sum, rec) => sum + (rec.totalAmount || 0), 0);
  const paidAmount = receivables.reduce((sum, rec) => sum + (rec.paidAmount || 0), 0);
  const remainingAmount = receivables.reduce((sum, rec) => sum + (rec.remainingAmount || 0), 0);

  // Dapatkan kota dari alamat toko
  const city = getCityFromAddress(storeAddress);

  return (
    <div className="w-full print:w-[210mm]">
      {/* Header */}
      <div className="text-center mb-4 border-b pb-3">
        <p className="text-2xl font-bold">LAPORAN PIUTANG</p>
        <h1 className="mt-1 text-xl font-bold">{getStoreName(storeName)}</h1>
        <p className="text-sm mt-1">Periode: {receivables.length > 0 ?
          `${new Date(receivables[0]?.date || '').toLocaleDateString('id-ID')} s/d ${new Date(receivables[receivables.length - 1]?.date || '').toLocaleDateString('id-ID')}`
          : '-'}</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
        <div className="border rounded p-2">
          <p className="font-semibold">Total Piutang</p>
          <p className="text-right font-bold text-blue-600">{formatCurrencyIDR(totalReceivables)}</p>
        </div>
        <div className="border rounded p-2">
          <p className="font-semibold">Sudah Dibayar</p>
          <p className="text-right font-bold text-green-600">{formatCurrencyIDR(paidAmount)}</p>
        </div>
        <div className="border rounded p-2">
          <p className="font-semibold">Belum Dibayar</p>
          <p className="text-right font-bold text-red-600">{formatCurrencyIDR(remainingAmount)}</p>
        </div>
      </div>

      {/* Receivables Table */}
      <div className="mb-6">
        <h3 className="font-semibold mb-1 text-sm border-b pb-1">Detail Piutang</h3>
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1 text-left text-xs font-medium">No</th>
              <th className="border px-2 py-1 text-left text-xs font-medium">Pelanggan</th>
              <th className="border px-2 py-1 text-left text-xs font-medium">Tanggal</th>
              <th className="border px-2 py-1 text-right text-xs font-medium">Total</th>
              <th className="border px-2 py-1 text-right text-xs font-medium">Dibayar</th>
              <th className="border px-2 py-1 text-right text-xs font-medium">Sisa</th>
            </tr>
          </thead>
          <tbody>
            {receivables.length > 0 ? (
              receivables.map((receivable, index) => (
                <tr key={receivable.id}>
                  <td className="border px-2 py-1 text-xs">{index + 1}</td>
                  <td className="border px-2 py-1 text-xs">{receivable.memberName || '-'}</td>
                  <td className="border px-2 py-1 text-xs">{formatDate(receivable.date)}</td>
                  <td className="border px-2 py-1 text-right">{formatCurrencyIDR(receivable.totalAmount)}</td>
                  <td className="border px-2 py-1 text-right">{formatCurrencyIDR(receivable.paidAmount)}</td>
                  <td className="border px-2 py-1 text-right">{formatCurrencyIDR(receivable.remainingAmount)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="border px-2 py-1 text-center text-xs">Tidak ada data</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Signature Area */}
      <div className="mt-6 grid grid-cols-2 gap-4 text-xs">
        <div className="text-center">
          <p className="mb-8">Disiapkan Oleh,</p>
          <p>_______________________</p>
        </div>
        <div className="text-center">
          <p className="mb-8">Disetujui Oleh,</p>
          <p>_______________________</p>
        </div>
      </div>

      {/* Prepared date */}
      <div className="text-center mt-6 text-xs">
        {city}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
      </div>
    </div>
  );
};

const UniversalPrintPreview = ({ isOpen, onClose, data, title, reportType, darkMode, storeName }) => {
  const [isLoading, setIsLoading] = useState(false);
  const componentRef = useRef();

  // Handler untuk download PDF
  const handleDownloadPDF = async () => {
    setIsLoading(true);
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();

      // Menyesuaikan ukuran dokumen dan margin
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 10;

      // Judul
      doc.setFontSize(16);
      doc.text(title || 'Laporan', pageWidth / 2, 20, { align: 'center' });

      // Tanggal
      doc.setFontSize(10);
      doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, pageWidth / 2, 30, { align: 'center' });

      // Menambahkan tabel menggunakan autoTable
      let tableData = [];
      let headers = [];

      // Menentukan data berdasarkan tipe laporan
      switch (reportType) {
        case 'sales':
          // Data untuk laporan penjualan
          headers = ['Tanggal', 'Penjualan'];
          tableData = data?.dailySalesData?.map(item => [
            item.name,
            `Rp ${item.sales.toLocaleString('id-ID')}`
          ]) || [];
          break;

        case 'profitLoss':
          // Data untuk laporan laba rugi
          headers = ['Tanggal', 'Pendapatan', 'Pengeluaran', 'Laba Bersih'];
          tableData = data?.dailyData?.map(item => [
            item.name,
            `Rp ${item.sales.toLocaleString('id-ID')}`,
            `Rp ${item.expenses.toLocaleString('id-ID')}`,
            `Rp ${item.profit.toLocaleString('id-ID')}`
          ]) || [];
          break;

        case 'expense':
          // Data untuk laporan pengeluaran
          headers = ['No', 'Kategori', 'Deskripsi', 'Tanggal', 'Jumlah'];
          tableData = data?.expenses?.map((expense, index) => [
            index + 1,
            data.categories?.find(cat => cat.id === expense.expenseCategoryId)?.name || 'Kategori Tidak Dikenal',
            expense.description || '-',
            new Date(expense.date).toLocaleDateString('id-ID'),
            `Rp ${expense.amount.toLocaleString('id-ID')}`
          ]) || [];
          break;

        case 'receivable':
          // Data untuk laporan piutang
          headers = ['No', 'Pelanggan', 'Tanggal', 'Total', 'Dibayar', 'Sisa'];
          tableData = data?.receivables?.map((receivable, index) => [
            index + 1,
            receivable.memberName || '-',
            new Date(receivable.date).toLocaleDateString('id-ID'),
            `Rp ${receivable.totalAmount.toLocaleString('id-ID')}`,
            `Rp ${receivable.paidAmount.toLocaleString('id-ID')}`,
            `Rp ${receivable.remainingAmount.toLocaleString('id-ID')}`
          ]) || [];
          break;

        default:
          // Untuk tipe laporan lainnya, mengambil data dari field umum
          if (data && Array.isArray(data)) {
            if (data.length > 0) {
              headers = Object.keys(data[0]).map(header =>
                header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
              );
              tableData = data.map(item =>
                Object.values(item).map(value =>
                  typeof value === 'object' && value !== null ?
                    JSON.stringify(value) :
                    String(value)
                )
              );
            }
          }
          break;
      }

      // Jika ada data yang akan ditampilkan
      if (tableData.length > 0) {
        autoTable(doc, {
          head: [headers],
          body: tableData,
          startY: 40,
          styles: {
            fontSize: 10,
            cellPadding: 4
          },
          headStyles: {
            fillColor: [100, 100, 100],
            textColor: [255, 255, 255]
          },
          bodyStyles: {
            textColor: [0, 0, 0]
          },
          alternateRowStyles: {
            fillColor: [240, 240, 240]
          },
          margin: { left: margin, right: margin }
        });
      } else {
        // Jika tidak ada data, tampilkan pesan
        doc.text('Tidak ada data untuk ditampilkan', margin, 40);
      }

      // Menambahkan bagian signature
      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 40;
      doc.setFontSize(10);

      // Membuat kolom tanda tangan
      doc.text('Disiapkan Oleh,', margin, finalY + 20);
      doc.text('_______________________', margin, finalY + 35);

      doc.text('Disetujui Oleh,', pageWidth - margin - 40, finalY + 20);
      doc.text('_______________________', pageWidth - margin - 40, finalY + 35);

      // Tanggal cetak
      // Dapatkan kota dari alamat toko
      const city = getCityFromAddress(storeName?.address);
      doc.text(`${city}, ${new Date().toLocaleDateString('id-ID')}`, pageWidth / 2, finalY + 50, { align: 'center' });

      const fileName = `${title || 'laporan'}-${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Terjadi kesalahan saat membuat PDF: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

    // Fungsi untuk merender preview berdasarkan tipe laporan
  const renderPreview = () => {
    if (!data) {
      return (
        <div className="w-full">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">{getStoreName(storeName)}</h1>
            <p className="mt-2 text-lg">{title || 'LAPORAN'}</p>
          </div>
          <div className="text-center text-gray-500 my-12">
            <AlertCircle className="mx-auto h-12 w-12" />
            <p className="mt-2">Data tidak tersedia</p>
          </div>
        </div>
      );
    }

    switch (reportType) {
      case 'sales':
        return <SalesReportPreview reportData={data} darkMode={darkMode} storeName={storeName} storeAddress={storeName?.address} />;
      case 'profitLoss':
        return <ProfitLossReportPreview reportData={data} darkMode={darkMode} storeName={storeName} storeAddress={storeName?.address} />;
      case 'expense':
        return <ExpenseReportPreview reportData={data} darkMode={darkMode} storeName={storeName} storeAddress={storeName?.address} />;
      case 'receivable':
        return <ReceivableReportPreview reportData={data} darkMode={darkMode} storeName={storeName} storeAddress={storeName?.address} />;
      default:
        // Dapatkan kota dari alamat toko untuk komponen default
        const city = getCityFromAddress(storeName?.address);
        return (
          <div className="w-full print:w-[210mm]">
            {/* Header */}
            <div className="text-center mb-4 border-b pb-3">
              <p className="text-2xl font-bold">{title || 'LAPORAN'}</p>
              <h1 className="mt-1 text-xl font-bold">{getStoreName(storeName)}</h1>
            </div>
            <div className="text-center my-12">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-500" />
              <p className="mt-2 font-semibold">Tipe laporan tidak dikenali</p>
              <p className="text-sm mt-2">Gunakan tipe laporan yang valid: sales, profitLoss, expense, atau receivable</p>
            </div>
            {/* Signature Area */}
            <div className="mt-12 grid grid-cols-2 gap-4 text-xs">
              <div className="text-center">
                <p className="mb-8">Disiapkan Oleh,</p>
                <p>_______________________</p>
              </div>
              <div className="text-center">
                <p className="mb-8">Disetujui Oleh,</p>
                <p>_______________________</p>
              </div>
            </div>
            {/* Prepared date untuk komponen default */}
            <div className="text-center mt-6 text-xs">
              {city}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed z-[100] inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className={`${darkMode ? 'bg-gray-800 bg-opacity-75' : 'bg-gray-500 bg-opacity-75'}`}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className={`inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full ${darkMode ? 'bg-gray-800' : 'bg-white'} ${darkMode ? 'border-gray-700' : 'border-gray-200'} border`}>
          <div className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="sm:flex sm:items-start">
              <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${darkMode ? 'bg-blue-900' : 'bg-blue-100'} sm:mx-0 sm:h-10 sm:w-10`}>
                <FileText className={`h-6 w-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className={`text-lg leading-6 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Pratinjau {title || 'Laporan'}
                </h3>
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className={`text-md font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {title || 'Laporan'}
                      </h4>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Pratinjau laporan sebelum dicetak atau diunduh
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          if (componentRef.current) {
                            // Buat iframe sementara untuk mencetak
                            const iframe = document.createElement('iframe');
                            iframe.style.position = 'absolute';
                            iframe.style.height = '0';
                            iframe.style.width = '0';
                            iframe.style.left = '-9999px';
                            iframe.style.top = '-9999px';
                            document.body.appendChild(iframe);

                            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                            const printContent = componentRef.current.innerHTML;

                            // Ambil CSS dari Tailwind dan buat style tag
                            const printCSS = `
                              @media print {
                                @page {
                                  size: A4;
                                  margin: 1cm;
                                  margin-top: 0.5cm;
                                  margin-bottom: 0.5cm;
                                }
                                body {
                                  -webkit-print-color-adjust: exact !important;
                                  print-color-adjust: exact !important;
                                  color-adjust: exact !important;
                                }
                                /* Hilangkan header dan footer bawaan browser */
                                @page :header {
                                  display: none;
                                }
                                @page :footer {
                                  display: none;
                                }
                                header, footer, nav, .hidden-print {
                                  display: none !important;
                                }
                              }
                              body {
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                -webkit-print-color-adjust: exact;
                                print-color-adjust: exact;
                                padding: 0;
                                margin: 0;
                                font-size: 14px;
                              }
                              .print-container {
                                padding: 1cm;
                                width: 210mm;
                                max-width: none;
                                background: white !important;
                                color: black !important;
                              }
                              /* Override dark mode styles for print */
                              .dark {
                                background: white !important;
                                color: black !important;
                              }
                              /* Tabel styles */
                              table {
                                width: 100%;
                                border-collapse: collapse;
                              }
                              th, td {
                                border: 1px solid #000;
                                padding: 4px;
                                font-size: 12px;
                              }
                              .border {
                                border: 1px solid #000;
                              }
                              .border-b {
                                border-bottom: 1px solid #000;
                              }
                              .bg-gray-100 {
                                background-color: #f3f4f6 !important;
                              }
                              .font-bold {
                                font-weight: bold;
                              }
                              .text-right {
                                text-align: right;
                              }
                              .text-center {
                                text-align: center;
                              }
                              .mb-1 {
                                margin-bottom: 0.25rem;
                              }
                              .mb-2 {
                                margin-bottom: 0.5rem;
                              }
                              .mb-4 {
                                margin-bottom: 1rem;
                              }
                              .mt-6 {
                                margin-top: 1.5rem;
                              }
                              .mt-1 {
                                margin-top: 0.25rem;
                              }
                              .mt-12 {
                                margin-top: 3rem;
                              }
                              .pb-1 {
                                padding-bottom: 0.25rem;
                              }
                              .pb-3 {
                                padding-bottom: 0.75rem;
                              }
                              .grid {
                                display: grid;
                              }
                              .grid-cols-2 {
                                grid-template-columns: 1fr 1fr;
                              }
                              .grid-cols-3 {
                                grid-template-columns: 1fr 1fr 1fr;
                              }
                              .gap-2 {
                                gap: 0.5rem;
                              }
                              .gap-4 {
                                gap: 1rem;
                              }
                              .rounded {
                                border-radius: 0.25rem;
                              }
                              .p-2 {
                                padding: 0.5rem;
                              }
                              .text-xs {
                                font-size: 0.75rem;
                              }
                              .text-sm {
                                font-size: 0.875rem;
                              }
                            `;

                            iframeDoc.write(`
                              <html>
                                <head>
                                  <title>${title || 'laporan'}-${new Date().toISOString().slice(0, 10)}</title>
                                  <style>${printCSS}</style>
                                </head>
                                <body>
                                  <div class="print-container">
                                    ${printContent}
                                  </div>
                                </body>
                              </html>
                            `);

                            iframeDoc.close();

                            // Tunggu agar konten selesai dimuat sebelum mencetak
                            setTimeout(() => {
                              iframe.contentWindow.focus();
                              iframe.contentWindow.print();
                              document.body.removeChild(iframe);
                            }, 250);
                          }
                        }}
                        className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                      >
                        <Printer className="h-4 w-4 mr-1" />
                        Cetak
                      </button>
                      <button
                        onClick={handleDownloadPDF}
                        disabled={isLoading}
                        className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 hover:bg-green-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50`}
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Memproses...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className={`border rounded-lg overflow-hidden ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className={`p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <h5 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {title || 'Laporan'}
                      </h5>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        Tanggal: {new Date().toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <div className="overflow-y-auto max-h-[60vh]" ref={componentRef}>
                      {renderPreview()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={`px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`mt-3 w-full inline-flex justify-center rounded-md border px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm ${
                darkMode
                  ? 'border-gray-600 bg-gray-600 text-white hover:bg-gray-500 focus:ring-gray-600'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-300'
              }`}
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversalPrintPreview;