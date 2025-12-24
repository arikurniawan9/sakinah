// components/supplier/SupplierPickerModal.js
import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

export default function SupplierPickerModal({ isOpen, onClose, onSelect, darkMode }) {
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/supplier')
        .then(res => res.json())
        .then(data => {
          setSuppliers(data.suppliers || []);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch suppliers:", err);
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectSupplier = (supplier) => {
    onSelect(supplier);
    onClose();
  };

  return (
    <div className="fixed z-[101] inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        <div className={`relative ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl w-full max-w-md m-4`}>
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-medium">Pilih Supplier</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
              <X size={20} />
            </button>
          </div>
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari supplier..."
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
                {filteredSuppliers.map(supplier => (
                  <li
                    key={supplier.id}
                    onClick={() => handleSelectSupplier(supplier)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                  >
                    {supplier.name}
                  </li>
                ))}
                {filteredSuppliers.length === 0 && !loading && (
                    <li className="p-2 text-center text-gray-500">Tidak ada supplier ditemukan.</li>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
