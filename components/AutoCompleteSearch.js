// components/AutoCompleteSearch.js
import { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronDown } from 'lucide-react'; // Added ChevronDown

export default function AutoCompleteSearch({
  placeholder = 'Cari...',
  searchFunction,
  onSelect,
  darkMode = false,
  debounceTime = 300,
  minChars = 0,
  getInitialItems,
  initialValue // Nilai awal untuk mode edit
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false); // New state for dropdown open/close
  const wrapperRef = useRef(null);
  const timeoutRef = useRef(null);

  // Efek untuk menetapkan nilai awal saat mode edit
  useEffect(() => {
    if (initialValue) {
        const valueToDisplay = initialValue.label || initialValue.name || initialValue.toString();
        setQuery(valueToDisplay);
        // If an initialValue is set, we might want to pre-populate results if the dropdown is opened
        // This can be done by calling getInitialItems here if initialValue implies a selection
        // For now, let's just display the value
    }
  }, [initialValue]);

  // Klik di luar untuk menutup hasil dan dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        // If no item is selected and input is empty, clear query if it's not initialValue's name
        if (!initialValue && query === '') {
            setQuery('');
        } else if (initialValue && query !== (initialValue.label || initialValue.name || initialValue.toString())) {
            // Revert query if user typed but didn't select
            setQuery(initialValue.label || initialValue.name || initialValue.toString());
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef, initialValue, query]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return; // Only search when dropdown is open

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setLoading(true);
    timeoutRef.current = setTimeout(async () => {
      try {
        let searchResults;
        if (query.length === 0 && getInitialItems) {
            // Jika query kosong, panggil getInitialItems
            searchResults = await getInitialItems();
        } else if (query.length >= minChars) {
            // Jika ada query, panggil searchFunction
            searchResults = await searchFunction(query);
        }
        setResults(searchResults || []);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Error during search:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, debounceTime);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, searchFunction, debounceTime, minChars, getInitialItems, isOpen]); // Added isOpen dependency

  const handleToggleDropdown = async () => {
    setIsOpen(prev => !prev);
    if (!isOpen && query === '' && getInitialItems) { // If opening and no query, fetch initial items
      setLoading(true);
      try {
        const initialItems = await getInitialItems();
        setResults(initialItems || []);
      } catch (error) {
        console.error('Error fetching initial items:', error);
      } finally {
        setLoading(false);
      }
    }
    // If there's an initial value, ensure it's displayed when opening
    if (!isOpen && initialValue) {
        setQuery(initialValue.label || initialValue.name || initialValue.toString());
    }
  };

  const handleSelect = (item) => {
    const valueToDisplay = item.label || item.name || item.toString();
    setQuery(valueToDisplay);
    setIsOpen(false); // Close dropdown on select
    onSelect(item);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (!isOpen) { // If not open, open it when typing
      setIsOpen(true);
    }
    // Also call onSelect with null to clear the selected item if user starts typing
    onSelect(null);
  };

  const handleClear = (e) => {
    e.stopPropagation(); // Prevent dropdown from toggling
    setQuery('');
    setResults([]);
    // setIsOpen(false); // Keep dropdown open after clear if user wants to search new
    onSelect(null); // Beri tahu parent bahwa pilihan dibersihkan
  };
  
  const handleKeyDown = (e) => {
    if (!isOpen) { // If dropdown is closed, open it on arrow keys or enter
        if (['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {
            setIsOpen(true);
            // Optionally, fetch initial items if not already done
            if (query === '' && getInitialItems) {
                getInitialItems().then(setResults);
            }
        }
        return;
    }

    if (e.key === 'ArrowDown') {
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
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      // Revert query if user typed but didn't select, and escape
      if (initialValue && query !== (initialValue.label || initialValue.name || initialValue.toString())) {
        setQuery(initialValue.label || initialValue.name || initialValue.toString());
      } else if (!initialValue && query !== '') {
        setQuery('');
      }
    }
  };

  const displayedValue = initialValue && !isOpen && !query // When dropdown is closed, nothing is typed yet, and initialValue exists
    ? (initialValue.label || initialValue.name || initialValue.toString())
    : query;

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div
        className={`relative flex items-center justify-between px-3 py-2 border rounded-md shadow-sm cursor-pointer ${
          darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
        } focus-within:ring-2 focus-within:ring-theme-purple-500`}
        onClick={handleToggleDropdown}
      >
        <span className="flex-grow truncate">
          {displayedValue || placeholder}
        </span>
        <div className="flex items-center space-x-2">
            {query && (initialValue?.id !== results[selectedIndex]?.id || !initialValue) && ( // Show clear button if query exists AND it's not the initial value
                <button
                    type="button"
                    onClick={handleClear}
                    className="flex-shrink-0"
                >
                    <X className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                </button>
            )}
            <ChevronDown className={`h-5 w-5 text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className={`absolute z-10 mt-1 w-full rounded-md shadow-lg ${
          darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-300'
        } max-h-60 overflow-auto`}>
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                autoFocus // Keep focus on input when dropdown opens
                className={`block w-full pl-10 pr-4 py-1.5 rounded-md focus:outline-none focus:ring-1 focus:ring-theme-purple-500 ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
          </div>
          {loading && results.length === 0 ? (
            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Mencari...</div>
          ) : !loading && results.length === 0 ? (
            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Tidak ditemukan hasil</div>
          ) : (
            <ul className="py-1">
              {results.map((item, index) => (
                <li
                  key={item.id || index}
                  onClick={() => handleSelect(item)}
                  onMouseDown={(e) => e.preventDefault()} // Mencegah onBlur input
                  className={`px-4 py-2 cursor-pointer text-sm ${
                    index === selectedIndex
                      ? (darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900')
                      : (darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50')
                  }`}
                >
                  {item.label || item.name || item.toString()}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}