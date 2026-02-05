// components/admin/ExpensePrintReport.js
'use client';

export default function ExpensePrintReport({
  expenses = [],
  categories = [],
  startDate = '',
  endDate = '',
  searchTerm = '',
  darkMode = false
}) { 
  // Format currency helper
  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Get category name helper
  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'Kategori Tidak Dikenal';
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Kategori Tidak Dikenal';
  };

  // Calculate total
  const totalExpensesAmount = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  return (
    <div className={`w-full min-h-screen ${darkMode ? 'bg-white text-gray-900' : 'bg-white text-gray-900'} p-8`}>
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background: white !important;
            color: black !important;
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          .printable-content {
            margin: 0;
            padding: 1cm;
          }
        }
      `}</style>

      {/* Report Header */}
      <div className="text-center mb-8 printable-content">
        <h1 className="text-3xl font-bold">SAKINAH</h1>
        <p className="text-xl mt-2">LAPORAN PENGELUARAN</p>
        <div className="mt-4 border-b border-gray-300 pb-2">
          <p className="font-medium">
            Periode: {startDate ? new Date(startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Awal'} - {endDate ? new Date(endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Sekarang'}
          </p>
          {searchTerm && <p className="text-sm mt-1">Pencarian: {searchTerm}</p>}
        </div>
      </div>

      {/* Summary Section */}
      <div className="mb-8 p-4 rounded-lg bg-gray-50 border border-gray-200 printable-content">
        <div className="flex justify-between">
          <div>
            <p className="text-sm">Jumlah Pengeluaran:</p>
            <p className="text-lg font-semibold">{expenses.length} item</p>
          </div>
          <div className="text-right">
            <p className="text-sm">Total Pengeluaran:</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(totalExpensesAmount)}</p>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="overflow-x-auto mb-8 printable-content">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">No</th>
              <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">Kategori</th>
              <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">Deskripsi</th>
              <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">Tanggal</th>
              <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length > 0 ? (
              expenses.map((expense, index) => (
                <tr key={expense.id}>
                  <td className="border border-gray-300 px-4 py-3">{index + 1}</td>
                  <td className="border border-gray-300 px-4 py-3">{getCategoryName(expense.expenseCategoryId)}</td>
                  <td className="border border-gray-300 px-4 py-3">{expense.description || '-'}</td>
                  <td className="border border-gray-300 px-4 py-3">{formatDate(expense.date)}</td>
                  <td className="border border-gray-300 px-4 py-3 text-right font-medium">{formatCurrency(expense.amount)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="border border-gray-300 px-4 py-6 text-center text-gray-500">
                  Tidak ada data pengeluaran
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-gray-100">
            <tr>
              <td colSpan="4" className="border border-gray-300 px-4 py-3 text-right font-bold">TOTAL</td>
              <td className="border border-gray-300 px-4 py-3 text-right font-bold">{formatCurrency(totalExpensesAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Notes */}
      {expenses.length > 0 && (
        <div className="mb-8 printable-content">
          <h3 className="font-semibold mb-2">Catatan:</h3>
          <p className="text-sm">Laporan ini mencakup pengeluaran dalam periode yang ditentukan.</p>
        </div>
      )}

      {/* Signature Area */}
      <div className="mt-12 grid grid-cols-2 gap-8 printable-content">
        <div className="text-center">
          <p className="mb-12">Disiapkan Oleh,</p>
          <p>_______________________</p>
        </div>
        <div className="text-center">
          <p className="mb-12">Disetujui Oleh,</p>
          <p>_______________________</p>
        </div>
      </div>

      {/* Prepared date */}
      <div className="text-center mt-16 text-sm printable-content">
        Jakarta, {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
      </div>

      {/* Print Controls - Only shown on screen, not when printing */}
      <div className="no-print fixed bottom-4 right-4 flex space-x-2 bg-white p-2 rounded-lg shadow-lg border">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Cetak
        </button>
        <button
          onClick={() => window.close()}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}