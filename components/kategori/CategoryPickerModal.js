// components/kategori/CategoryPickerModal.js
import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

export default function CategoryPickerModal({ isOpen, onClose, onSelect, darkMode }) {
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/kategori')
        .then(res => res.json())
        .then(data => {
          setCategories(data.categories || []);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch categories:", err);
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectCategory = (category) => {
    onSelect(category);
    onClose();
  };

  return (
    <div className="fixed z-[101] inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        <div className={`relative ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl w-full max-w-md m-4`}>
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-medium">Pilih Kategori</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
              <X size={20} />
            </button>
          </div>
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari kategori..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              />
            </div>
          </div>
          <div className="p-4 h-64 overflow-y-auto">
            {loading ? (
              <p>Memuat...</p>
            ) : (
              <ul>
                {filteredCategories.map(category => (
                  <li
                    key={category.id}
                    onClick={() => handleSelectCategory(category)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                  >
                    {category.name}
                  </li>
                ))}
                {filteredCategories.length === 0 && !loading && (
                    <li className="p-2 text-center text-gray-500">Tidak ada kategori ditemukan.</li>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
