// components/InteractiveTable.js
'use client';

import { useState, useMemo } from 'react';
import { useUserTheme } from './UserThemeContext';
import { Search, Filter, Download, SortAsc, SortDesc, Eye, Edit, Trash2 } from 'lucide-react';

const InteractiveTable = ({ 
  columns, 
  data, 
  onRowClick, 
  actions = [], 
  searchable = true, 
  filterable = true,
  exportable = false,
  pagination = true,
  itemsPerPage = 10
}) => {
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(item =>
      columns.some(column => {
        const value = item[column.key];
        return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, columns]);
  
  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);
  
  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);
  
  // Handle sort
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };
  
  // Get sort indicator
  const getSortIndicator = (columnKey) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? <SortAsc className="h-4 w-4 ml-1" /> : <SortDesc className="h-4 w-4 ml-1" />;
  };
  
  return (
    <div className={`rounded-xl shadow-lg overflow-hidden ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    } border`}>
      {/* Table Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {searchable && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Cari..."
                value={searchTerm}
                onChange={handleSearch}
                className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500'
                    : 'border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
            </div>
          )}
          
          <div className="flex flex-wrap gap-2">
            {filterable && (
              <button className={`flex items-center px-3 py-2 rounded-lg ${
                darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              }`}>
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </button>
            )}
            
            {exportable && (
              <button className={`flex items-center px-3 py-2 rounded-lg ${
                darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              }`}>
                <Download className="h-4 w-4 mr-2" />
                Ekspor
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer ${
                    darkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                >
                  <div className="flex items-center">
                    {column.title}
                    {column.sortable !== false && getSortIndicator(column.key)}
                  </div>
                </th>
              ))}
              {actions.length > 0 && (
                <th
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    darkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}
                >
                  Aksi
                </th>
              )}
            </tr>
          </thead>
          <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions.length > 0 ? 1 : 0)} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  Tidak ada data ditemukan
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr 
                  key={row.id || index} 
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((column) => (
                    <td
                      key={`${row.id || index}-${column.key}`}
                      className="px-6 py-4 whitespace-nowrap text-sm"
                    >
                      <div className={darkMode ? 'text-gray-300' : 'text-gray-900'}>
                        {column.render 
                          ? column.render(row[column.key], row, index) 
                          : row[column.key]
                        }
                      </div>
                    </td>
                  ))}
                  {actions.length > 0 && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        {actions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onClick(row);
                            }}
                            className={`p-1 rounded-full ${
                              darkMode
                                ? action.color === 'red' 
                                  ? 'text-red-400 hover:bg-red-700/30' 
                                  : action.color === 'blue'
                                  ? 'text-blue-400 hover:bg-blue-700/30'
                                  : 'text-gray-400 hover:bg-gray-700/30'
                                : action.color === 'red'
                                ? 'text-red-500 hover:bg-red-100'
                                : action.color === 'blue'
                                ? 'text-blue-500 hover:bg-blue-100'
                                : 'text-gray-500 hover:bg-gray-100'
                            }`}
                          >
                            {action.icon && <action.icon className="h-4 w-4" />}
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className={`px-6 py-4 border-t ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Menampilkan {(currentPage - 1) * itemsPerPage + 1} sampai{' '}
              {Math.min(currentPage * itemsPerPage, sortedData.length)} dari{' '}
              {sortedData.length} hasil
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === 1
                    ? 'opacity-50 cursor-not-allowed'
                    : darkMode
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Sebelumnya
              </button>

              <span className={`px-3 py-2 text-sm font-medium ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Halaman {currentPage} dari {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === totalPages
                    ? 'opacity-50 cursor-not-allowed'
                    : darkMode
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Berikutnya
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveTable;