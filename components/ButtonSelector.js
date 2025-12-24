// components/ButtonSelector.js
import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, ChevronUp, X, Plus } from 'lucide-react';
import Tooltip from './Tooltip';

export default function ButtonSelector({
  items = [],
  selectedItem = null,
  onSelect,
  placeholder = "Pilih item...",
  searchPlaceholder = "Cari...",
  darkMode = false,
  disabled = false,
  itemLabelKey = "name",
  itemValueKey = "id",
  addButtonLabel = "Tambah Baru",
  onAddNew = null,
  allowClear = true
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState(items);
  const dropdownRef = useRef(null);

  // Filter items based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredItems(items);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredItems(
        items.filter(item => 
          item[itemLabelKey].toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, items, itemLabelKey]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (item) => {
    onSelect(item);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    onSelect(null);
  };

  const displayedLabel = selectedItem ? selectedItem[itemLabelKey] : placeholder;

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full px-3 py-2 border rounded-md shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${
          disabled 
            ? `${darkMode ? 'bg-gray-700 border-gray-600 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-400'}`
            : `${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`
        }`}
      >
        <div className="flex items-center flex-1 min-w-0">
          <span className={`truncate ${selectedItem ? '' : 'text-gray-400'}`}>
            {displayedLabel}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          {allowClear && selectedItem && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className={`p-1 rounded-full ${darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-400 hover:bg-gray-200'}`}
            >
              <X className="h-3 w-3" />
            </button>
          )}
          {isOpen ? (
            <ChevronUp className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          ) : (
            <ChevronDown className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          )}
        </div>
      </div>

      {isOpen && (
        <div className={`absolute z-50 mt-1 w-full rounded-md shadow-lg ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-300'} max-h-60 overflow-auto`}>
          <div className="p-2">
            <div className="relative mb-2">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
              </div>
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`block w-full pl-10 pr-3 py-2 border rounded-md leading-5 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            {onAddNew && (
              <button
                type="button"
                onClick={() => {
                  onAddNew();
                  setIsOpen(false);
                }}
                className={`w-full flex items-center px-3 py-2 text-sm rounded-md mb-2 ${
                  darkMode 
                    ? 'text-blue-400 hover:bg-gray-700' 
                    : 'text-blue-600 hover:bg-gray-100'
                }`}
              >
                <Plus className="h-4 w-4 mr-2" />
                {addButtonLabel}
              </button>
            )}
            
            <div className="space-y-1">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <button
                    key={item[itemValueKey]}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                      selectedItem && selectedItem[itemValueKey] === item[itemValueKey]
                        ? `${darkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'}`
                        : `${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`
                    }`}
                  >
                    {item[itemLabelKey]}
                  </button>
                ))
              ) : (
                <div className={`px-3 py-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Tidak ditemukan
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}