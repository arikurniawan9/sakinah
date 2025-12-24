// components/TransferUserModal.js
import React, { useState, useEffect } from 'react';
import { X, Store, User, AlertCircle } from 'lucide-react';

export default function TransferUserModal({ 
  isOpen, 
  onClose, 
  user, 
  stores, 
  onTransfer, 
  loading = false 
}) {
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedRole, setSelectedRole] = useState('CASHIER');
  const [userStoreStatus, setUserStoreStatus] = useState('ACTIVE');
  const [error, setError] = useState('');

  // Reset form ketika modal dibuka
  useEffect(() => {
    if (isOpen) {
      setSelectedStore('');
      setSelectedRole('CASHIER');
      setUserStoreStatus('ACTIVE');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedStore) {
      setError('Silakan pilih toko tujuan');
      return;
    }

    onTransfer({
      userId: user.id,
      storeId: selectedStore,
      role: selectedRole,
      status: userStoreStatus
    });
  };

  if (!isOpen) return null;

  // Filter toko yang belum terdaftar untuk pengguna ini
  const availableStores = user.role === 'MANAGER'
    ? [] // Tidak ada toko tersedia untuk MANAGER
    : (Array.isArray(stores) ? stores : []).filter(store =>
        store && store.id && !(user.stores || []).some(userStore => userStore && userStore.id === store.id)
      );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Pindahkan Akun ke Toko Lain
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Pengguna
            </label>
            <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <User className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
              <span className="text-gray-900 dark:text-white">{user.name}</span>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Toko Saat Ini
            </label>
            <div className="space-y-2">
              {user.stores && Array.isArray(user.stores) && user.stores.length > 0 ? (
                (Array.isArray(user.stores) ? user.stores : [])
                  .filter(store => store && store.id) // Filter out undefined/null stores
                  .map((store, index) => (
                    <div key={index} className="flex items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <Store className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-900 dark:text-white">{store.name}</span>
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs rounded">
                        {store.roleInStore}
                      </span>
                    </div>
                  ))
              ) : (
                <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400 italic">
                  Tidak ada toko terkait
                </div>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="store" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Pilih Toko Tujuan *
            </label>
            {user.role === 'MANAGER' ? (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  Pengguna dengan role MANAGER tidak dapat dipindahkan ke toko lain karena merupakan role global.
                </p>
              </div>
            ) : (
              <>
                <select
                  id="store"
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  disabled={user.role === 'MANAGER'}
                >
                  <option value="">Pilih toko...</option>
                  {availableStores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
                {availableStores.length === 0 && user.role !== 'MANAGER' && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    Tidak ada toko lain tersedia untuk pengguna ini
                  </p>
                )}
              </>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Peran di Toko Baru
            </label>
            <select
              id="role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="CASHIER">Kasir</option>
              <option value="ATTENDANT">Pelayan</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div className="mb-6">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status di Toko Baru
            </label>
            <select
              id="status"
              value={userStoreStatus}
              onChange={(e) => setUserStoreStatus(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="ACTIVE">Aktif</option>
              <option value="AKTIF">Aktif (Indonesia)</option>
              <option value="INACTIVE">Tidak Aktif</option>
              <option value="TIDAK_AKTIF">Tidak Aktif (Indonesia)</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !selectedStore || availableStores.length === 0 || user.role === 'MANAGER'}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Memindahkan...' : user.role === 'MANAGER' ? 'Tidak Tersedia' : 'Pindahkan Akun'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}