// components/laporan/piutang/ReceivableToolbar.js
'use client';

import { Search } from 'lucide-react';

export default function ReceivableToolbar({ searchTerm, setSearchTerm, darkMode }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center w-full max-w-md">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          <input
            type="text"
            placeholder="Cari berdasarkan nama member atau ID nota..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`block w-full pl-10 pr-3 py-2 border rounded-md leading-5 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 sm:text-sm ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
