import React, { useState, useEffect } from 'react';
import { Save, X, User, AtSign, Lock, Phone, Building } from 'lucide-react';
import { ROLES } from '@/lib/constants';

const WarehouseUserModal = ({
  showModal,
  closeModal,
  handleSave,
  formData,
  handleInputChange,
  editingUser,
  error,
  setFormError,
  darkMode,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  // Handle ESC key press to close modal
  useEffect(() => {
    if (!showModal) return;

    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showModal, closeModal]);

  if (!showModal) return null;

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSave();
  };

  return (
    <div className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className={`${darkMode ? 'bg-gray-800 bg-opacity-75' : 'bg-gray-500 bg-opacity-75'}`}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className={`inline-block align-bottom ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        } rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        } border`}>
          <div className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <div className="flex justify-between items-center">
                  <h3 className={`text-lg leading-6 font-medium ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`} id="modal-title">
                    {editingUser ? 'Edit User Gudang' : 'Tambah User Gudang'}
                  </h3>
                  <button
                    type="button"
                    onClick={closeModal}
                    className={`text-gray-400 hover:text-gray-500 focus:outline-none`}
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="mt-4 w-full">
                  {error && (
                    <div className={`mb-4 p-3 text-sm rounded-md ${
                      darkMode ? 'bg-red-900/30 border border-red-700 text-red-200' : 'bg-red-50 border border-red-200 text-red-700'
                    }`}>
                      {error}
                    </div>
                  )}
                  <form onSubmit={handleFormSubmit}>
                    <div className="mb-4">
                      <label htmlFor="name" className={`block text-sm font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      } mb-1`}>
                        Nama Lengkap *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 pl-10 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'border-gray-300 text-gray-900'
                          }`}
                          placeholder="Masukkan nama lengkap"
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label htmlFor="username" className={`block text-sm font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      } mb-1`}>
                        Username *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <AtSign className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="username"
                          id="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 pl-10 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'border-gray-300 text-gray-900'
                          }`}
                          placeholder="Masukkan username"
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label htmlFor="phone" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        No. Telepon
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          name="phone"
                          id="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          maxLength={13}
                          className={`w-full px-3 py-2 pl-10 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'}`}
                          placeholder="Masukkan nomor telepon"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label htmlFor="employeeNumber" className={`block text-sm font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      } mb-1`}>
                        Kode Karyawan
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="employeeNumber"
                          id="employeeNumber"
                          value={formData.employeeNumber}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 pl-10 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'border-gray-300 text-gray-900'
                          }`}
                          placeholder="Kode Karyawan (opsional)"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label htmlFor="role" className={`block text-sm font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      } mb-1`}>
                        Role *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                          name="role"
                          id="role"
                          value={formData.role}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 pl-10 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'border-gray-300 text-gray-900'
                          }`}
                          required
                        >
                          <option value="">Pilih role</option>
                          <option value={ROLES.CASHIER}>Kasir</option>
                          <option value={ROLES.ATTENDANT}>Pelayan</option>
                          <option value={ROLES.WAREHOUSE}>Gudang</option>
                        </select>
                      </div>
                    </div>

                    <div className={editingUser ? "" : "mb-4"}>
                      <label htmlFor="password" className={`block text-sm font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      } mb-1`}>
                        {editingUser ? 'Password Baru (kosongkan jika tidak ingin diubah)' : 'Password *'}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          id="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 pl-10 pr-10 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'border-gray-300 text-gray-900'
                          }`}
                          placeholder={editingUser ? "Kosongkan jika tidak ingin diubah" : "Masukkan password"}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
          <div className={`px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse ${
            darkMode ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <button
              type="button"
              onClick={handleFormSubmit}
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                darkMode
                  ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              }`}
            >
              <Save className="h-4 w-4 mr-1" />
              {editingUser ? 'Perbarui' : 'Simpan'}
            </button>
            <button
              type="button"
              onClick={closeModal}
              className={`mt-3 w-full inline-flex justify-center rounded-md border shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm ${
                darkMode
                  ? 'bg-gray-600 text-white hover:bg-gray-700 border-gray-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
              }`}
            >
              <X className="h-4 w-4 mr-1" />
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarehouseUserModal;