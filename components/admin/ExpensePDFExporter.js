// components/admin/ExpensePDFExporter.js
import { useState } from 'react';
import { Download, FileText } from 'lucide-react';

export default function ExpensePDFExporter({
  darkMode = false,
  startDate = null,
  endDate = null,
  searchTerm = '',
  categoryId = '',
  onExport = () => {}
}) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      await onExport();
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk menghasilkan URL ekspor
  const generateExportUrl = () => {
    const params = new URLSearchParams();
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (searchTerm) params.append('search', searchTerm);
    if (categoryId) params.append('categoryId', categoryId);
    
    return `/api/pengeluaran/pdf?${params.toString()}`;
  };

  return (
    <a
      href={generateExportUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className={`p-2 rounded-lg inline-flex items-center justify-center ${
        darkMode 
          ? 'bg-red-600 hover:bg-red-700 text-white' 
          : 'bg-red-600 hover:bg-red-700 text-white'
      } transition-all duration-200 hover:scale-105`}
      title="Ekspor Laporan PDF"
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
      ) : (
        <FileText className="h-4 w-4" />
      )}
    </a>
  );
}