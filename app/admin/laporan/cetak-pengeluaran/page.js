// app/admin/laporan/cetak-pengeluaran/page.js
'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useDarkMode } from '@/components/DarkModeContext';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

export default function PrintExpenseReportPage() {
  const { data: session } = useSession();
  const { darkMode } = useDarkMode();
  const searchParams = useSearchParams();
  
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Ambil parameter dari URL
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const searchTerm = searchParams.get('search') || '';

  // Ambil data dari API
  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        setError('');

        const params = new URLSearchParams({
          startDate: startDate || '',
          endDate: endDate || '',
          search: searchTerm || ''
        });

        const response = await fetch(`/api/pengeluaran?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Gagal mengambil data pengeluaran');
        }

        setExpenses(data.expenses || []);
        // Ambil juga kategori untuk ditampilkan di laporan
        const categoriesResponse = await fetch('/api/pengeluaran/kategori');
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData.categories || []);
      } catch (err) {
        console.error('Error fetching report data:', err);
        setError('Gagal mengambil data laporan: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [startDate, endDate, searchTerm]);

  // Format currency
  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
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

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Close function
  const handleClose = () => {
    window.close();
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <main className={`w-full min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'} p-8`}>
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className={`ml-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Memuat laporan...</span>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background: white !important;
            padding: 0;
            margin: 0;
          }
          .no-print {
            display: none !important;
          }
          .print-content {
            margin: 0;
            padding: 1cm;
            width: 100%;
            max-width: none;
          }
        }
      `}</style>
      
      <main className={`w-full min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'} p-8 print-content`}>
        {/* Header for print */}
        <div className="no-print mb-6 flex justify-between items-center">
          <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Laporan Pengeluaran</h1>
          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Cetak
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Tutup
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className={`${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">TOKO SAKINAH</h1>
            <p className="mt-2 text-lg">LAPORAN PENGELUARAN</p>
            <div className="mt-4 border-b border-gray-300 pb-2">
              <p className="font-medium">
                Periode: {startDate ? formatDate(startDate) : 'Semua Tanggal'} - {endDate ? formatDate(endDate) : 'Sekarang'}
              </p>
              {searchTerm && <p className="text-sm">Pencarian: {searchTerm}</p>}
            </div>
          </div>

          {error ? (
            <div className={`p-4 rounded-lg mb-6 ${
              darkMode ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-700'
            }`}>
              {error}
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className={`mb-8 p-4 rounded-lg ${
                darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
              }`}>
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
              <div className="overflow-x-auto mb-8">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className={darkMode ? 'bg-gray-700' : 'bg-gray-100'}>
                      <th className="border border-gray-300 px-4 py-2 text-left">No</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Kategori</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Deskripsi</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Tanggal</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.length > 0 ? (
                      expenses.map((expense, index) => (
                        <tr key={expense.id} className={index % 2 === 0 ? (darkMode ? 'bg-gray-800' : 'bg-white') : (darkMode ? 'bg-gray-750' : 'bg-gray-50')}>
                          <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                          <td className="border border-gray-300 px-4 py-2">{getCategoryName(expense.expenseCategoryId)}</td>
                          <td className="border border-gray-300 px-4 py-2">{expense.description || '-'}</td>
                          <td className="border border-gray-300 px-4 py-2">{formatDate(expense.date)}</td>
                          <td className="border border-gray-300 px-4 py-2 text-right font-medium">{formatCurrency(expense.amount)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="border border-gray-300 px-4 py-4 text-center">
                          Tidak ada data pengeluaran
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className={darkMode ? 'bg-gray-700' : 'bg-gray-100'}>
                    <tr>
                      <td colSpan="4" className="border border-gray-300 px-4 py-2 text-right font-bold">TOTAL</td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-bold">{formatCurrency(totalExpensesAmount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Notes */}
              {expenses.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-semibold mb-2">Catatan:</h3>
                  <p className="text-sm">Laporan ini mencakup pengeluaran dalam periode yang ditentukan.</p>
                </div>
              )}

              {/* Signature Area */}
              <div className="mt-12 grid grid-cols-2 gap-8">
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
              <div className="text-center mt-16 text-sm">
                Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}