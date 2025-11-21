// components/SearchBar.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Users, Package, ShoppingCart, Building, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const SearchBar = ({ darkMode = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const router = useRouter();

  // Fungsi untuk membuka/cari pencarian
  const toggleSearch = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
      setSelectedIndex(-1);
    }
  };

  // Fungsi untuk menutup pencarian
  const closeSearch = () => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
    setSelectedIndex(-1);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggleSearch();
      }
      
      if (isOpen) {
        if (e.key === 'Escape') {
          closeSearch();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : 0
          );
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : results.length - 1
          );
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
          e.preventDefault();
          const selected = results[selectedIndex];
          if (selected && selected.href) {
            router.push(selected.href);
            closeSearch();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, router]);

  // Fungsi untuk pencarian data
  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    
    // Simulasi pencarian (dalam implementasi nyata, ini akan mengambil dari API)
    try {
      // Ini adalah contoh data pencarian - dalam implementasi nyata ini akan mengambil dari API
      const mockResults = [
        { id: 1, name: 'Toko Pusat', type: 'store', href: '/admin' },
        { id: 2, name: 'Toko Cabang Barat', type: 'store', href: '/admin' },
        { id: 3, name: 'John Doe', type: 'user', href: '/admin/users' },
        { id: 4, name: 'Kemeja Batik', type: 'product', href: '/admin/produk' },
        { id: 5, name: 'Member Silver', type: 'member', href: '/admin/member' },
        { id: 6, name: 'Supplier ABC', type: 'supplier', href: '/admin/supplier' },
      ].filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setResults(mockResults);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change
  useEffect(() => {
    if (query) {
      const timeoutId = setTimeout(() => {
        performSearch(query);
      }, 300); // Debounce 300ms

      return () => clearTimeout(timeoutId);
    } else {
      setResults([]);
      setSelectedIndex(-1);
    }
  }, [query]);

  // Fungsi untuk mendapatkan ikon berdasarkan tipe
  const getIcon = (type) => {
    switch (type) {
      case 'user':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'product':
        return <Package className="h-4 w-4 text-green-500" />;
      case 'member':
        return <Users className="h-4 w-4 text-purple-500" />;
      case 'store':
        return <Building className="h-4 w-4 text-indigo-500" />;
      case 'supplier':
        return <ShoppingCart className="h-4 w-4 text-orange-500" />;
      default:
        return <Search className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="relative">
      {/* Search button for mobile */}
      <button
        onClick={toggleSearch}
        className={`lg:hidden p-2 rounded-md ${
          darkMode 
            ? 'text-gray-300 hover:bg-gray-700' 
            : 'text-gray-600 hover:bg-gray-100'
        }`}
        aria-label="Search"
      >
        <Search className="h-5 w-5" />
      </button>

      {/* Search button for desktop */}
      <button
        onClick={toggleSearch}
        className={`hidden lg:flex items-center space-x-2 px-4 py-2 rounded-md border ${
          isOpen 
            ? 'ring-2 ring-blue-500 ring-offset-2' 
            : ''
        } ${
          darkMode
            ? 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
            : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
        }`}
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Cari...</span>
        <span className="hidden sm:inline text-xs bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded ml-2">
          ⌘K
        </span>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className={`fixed inset-0 z-50 flex items-start justify-center pt-20 ${darkMode ? 'bg-black bg-opacity-50' : 'bg-black bg-opacity-50'}`}>
          <div 
            className={`relative w-full max-w-2xl mx-4 rounded-lg shadow-xl ${
              darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center px-4 py-3 border-b ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <Search className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari toko, produk, pengguna, member..."
                className={`flex-1 bg-transparent border-none focus:outline-none focus:ring-0 ml-3 ${
                  darkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
                }`}
                autoFocus
              />
              <button
                onClick={closeSearch}
                className={`p-1 rounded-md ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className={`p-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Mencari...
                </div>
              ) : results.length > 0 ? (
                <ul>
                  {results.map((result, index) => (
                    <li 
                      key={result.id}
                      className={`px-4 py-3 cursor-pointer ${
                        index === selectedIndex 
                          ? (darkMode ? 'bg-gray-700' : 'bg-blue-50') 
                          : (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50')
                      }`}
                      onClick={() => {
                        router.push(result.href);
                        closeSearch();
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div className="flex items-center space-x-3">
                        {getIcon(result.type)}
                        <div>
                          <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {result.name}
                          </div>
                          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : query ? (
                <div className={`p-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Tidak ditemukan hasil untuk "{query}"
                </div>
              ) : (
                <div className={`p-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Masukkan kata kunci pencarian
                </div>
              )}
            </div>

            <div className={`px-4 py-3 text-xs text-center ${darkMode ? 'text-gray-400 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>
              Gunakan ↑↓ untuk navigasi, Enter untuk memilih, ESC untuk menutup
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;