// components/shared/UserSelectionModal.js
// Modal for selecting users with search functionality
// Search works on name, username, and employeeNumber fields
// Displays employeeNumber if available, otherwise shows username
// Supports auto-selection when exact employeeNumber is found or only one result remains
// Supports barcode scanner input: automatically selects user when exact employeeNumber is scanned
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, X, User, Plus } from 'lucide-react';
import AddUserModal from './AddUserModal';

export default function UserSelectionModal({ isOpen, onClose, users, onSelectUser, darkMode, onUserAdded }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [lastKeyTime, setLastKeyTime] = useState(0);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  const filteredUsers = useMemo(() => {
    // Filter hanya pengguna dengan role ATTENDANT
    const attendantUsers = users.filter(user => user.role === 'ATTENDANT');

    if (!searchTerm) {
      return attendantUsers;
    }
    return attendantUsers.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.employeeNumber && user.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [users, searchTerm]);

  // Handle ESC key press to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleSelect = (user) => {
    onSelectUser(user);
    onClose();
  };

  const handleAddUser = async (userData) => {
    try {
      // Kirim data pengguna baru ke API dengan role ATTENDANT secara otomatis
      const response = await fetch('/api/warehouse/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''}`
        },
        body: JSON.stringify({
          ...userData,
          role: 'ATTENDANT', // Pastikan role adalah ATTENDANT
          storeId: null // Pengguna gudang tidak terikat ke toko tertentu
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menambahkan pengguna');
      }

      const newUser = await response.json();

      // Panggil callback untuk memberi tahu bahwa pengguna baru telah ditambahkan
      if (onUserAdded) {
        onUserAdded(newUser);
      }

      // Pilih pengguna yang baru saja ditambahkan
      onSelectUser(newUser);
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Gagal menambahkan pengguna: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className={`rounded-xl shadow-2xl w-full max-w-md flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Header */}
        <div className={`flex justify-between items-center p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Pilih Pelayan</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowAddUserModal(true)}
              className={`p-2 rounded-full ${darkMode ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-gray-200'} transition-colors`}
              title="Tambah Pelayan Baru"
            >
              <Plus className="h-5 w-5" />
            </button>
            <button onClick={onClose} className={`p-2 rounded-full ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'} transition-colors`}>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search - can search by name or employeeNumber */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari nama atau nomor pegawai..."
              className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
              }`}
              value={searchTerm}
              onChange={(e) => {
                const currentTime = Date.now();
                const timeDiff = currentTime - lastKeyTime;
                setLastKeyTime(currentTime);

                const value = e.target.value;
                setSearchTerm(value);

                // Deteksi input cepat (khas scanner barcode)
                const isLikelyScannerInput = timeDiff < 30 && value.length > 1;

                if (isLikelyScannerInput && value.length >= 3) {
                  const exactMatch = users.find(user =>
                    user.employeeNumber && user.employeeNumber.toLowerCase() === value.toLowerCase()
                  );

                  if (exactMatch) {
                    setTimeout(() => {
                      handleSelect(exactMatch);
                    }, 10);
                  }
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const exactMatch = users.find(user =>
                    user.employeeNumber && user.employeeNumber.toLowerCase() === searchTerm.toLowerCase()
                  );

                  if (exactMatch) {
                    handleSelect(exactMatch);
                  } else if (filteredUsers.length === 1) {
                    handleSelect(filteredUsers[0]);
                  }
                } else if (e.key.length === 1) {
                  setLastKeyTime(Date.now());
                }
              }}
              autoFocus
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Search className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
          </div>
        </div>

        {/* User List */}
        <div className="overflow-y-auto max-h-[60vh]">
          {filteredUsers.length > 0 ? (
            <ul>
              {filteredUsers.map((user) => (
                <li key={user.id}>
                  <button
                    onClick={() => handleSelect(user)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleSelect(user);
                      }
                    }}
                    className={`w-full text-left flex items-center p-4 transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    tabIndex={0}
                  >
                    <div className={`p-2 rounded-full mr-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <User className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>
                    <div>
                        <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user.name}</div>
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {user.employeeNumber ? `No. Pegawai: ${user.employeeNumber}` : `@${user.username}`} • {user.role}
                        </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-8 text-center text-gray-500">Pelayan tidak ditemukan.</p>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onSave={handleAddUser}
        darkMode={darkMode}
      />
    </div>
  );
}
