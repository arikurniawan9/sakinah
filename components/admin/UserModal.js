import React, { useState, useEffect } from 'react';
import { Save, X, User, AtSign, Lock, Mail, Building, Shield, Phone, Home } from 'lucide-react';
import { ROLES } from '@/lib/constants';

const UserModal = ({
  showModal,
  closeModal,
  handleSave,
  formData,
  handleInputChange,
  editingUser,
  error,
  setFormError,
  darkMode,
  isAttendantForm = false,
  allowedRoles,
  stores = [],
  currentStoreName,
  isManagerContext = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!showModal) return;
    const handleEscKey = (event) => {
      if (event.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [showModal, closeModal]);

  if (!showModal) return null;

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSave();
  };
  
  const availableRoles = [
    { value: ROLES.MANAGER, label: 'Manager' },
    { value: ROLES.ADMIN, label: 'Admin' },
    { value: ROLES.CASHIER, label: 'Kasir' },
    { value: ROLES.ATTENDANT, label: 'Pelayan' },
  ];

  const rolesToDisplay = allowedRoles
    ? availableRoles.filter(r => allowedRoles.includes(r.value))
    : availableRoles;

  const isWarehouseOnly = allowedRoles && allowedRoles.length === 1 && allowedRoles[0] === ROLES.WAREHOUSE;
  const isWarehouseContext = allowedRoles && (allowedRoles.includes(ROLES.WAREHOUSE) || allowedRoles.includes(ROLES.CASHIER) || allowedRoles.includes(ROLES.ATTENDANT));
  const showRoleDropdown = !isAttendantForm && (!allowedRoles || (allowedRoles.length > 1 && !isWarehouseOnly));

  return (
    <div className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className={`${darkMode ? 'bg-gray-800 bg-opacity-75' : 'bg-gray-500 bg-opacity-75'}`}></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className={`inline-block align-bottom ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md lg:max-w-xl sm:w-full border ${darkMode ? 'border-gray-700' : 'border-theme-purple-200'}`}>
          <div className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-lg leading-6 font-medium ${darkMode ? 'text-theme-purple-400' : 'text-gray-900'}`}>
              {editingUser ? (isAttendantForm ? 'Edit Pelayan' : 'Edit User') : 'Tambah User Baru'}
            </h3>
            <div className="mt-4 w-full">
              {error && <div className={`mb-4 p-3 text-sm rounded-md ${darkMode ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-red-50 border border-red-200 text-red-700'}`}>{error}</div>}
              <form onSubmit={handleFormSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Nama Lengkap *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-5 w-5 text-theme-purple-400" /></div>
                      <input type="text" name="name" value={formData.name} onChange={handleInputChange} className={`w-full px-3 py-2 pl-10 border rounded-md sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-theme-purple-300'}`} required />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Username *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><AtSign className="h-5 w-5 text-theme-purple-400" /></div>
                      <input type="text" name="username" value={formData.username} onChange={handleInputChange} className={`w-full px-3 py-2 pl-10 border rounded-md sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-theme-purple-300'}`} required />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Kode Karyawan / Employee ID</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Shield className="h-5 w-5 text-theme-purple-400" /></div>
                      <input type="text" name="employeeNumber" value={formData.employeeNumber} onChange={handleInputChange} className={`w-full px-3 py-2 pl-10 border rounded-md sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-theme-purple-300'}`} placeholder="KG001, KSR001, dll" />
                    </div>
                  </div>
                  {showRoleDropdown && (
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Role *</label>
                      <select name="role" value={formData.role} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-md sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-theme-purple-300'}`} required>
                        <option value="">Pilih role</option>
                        {rolesToDisplay.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>{editingUser ? 'Password Baru (Opsional)' : 'Password *'}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-theme-purple-400" /></div>
                      <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleInputChange} className={`w-full px-3 py-2 pl-10 border rounded-md sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-theme-purple-300'}`} />
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
          <div className={`px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse sm:gap-3 ${darkMode ? 'bg-gray-700' : 'bg-theme-purple-50'}`}>
            <button onClick={handleFormSubmit} className="w-full inline-flex justify-center rounded-md px-4 py-2 text-white bg-theme-purple-600 hover:bg-theme-purple-700 sm:w-auto text-sm font-medium">Simpan</button>
            <button onClick={closeModal} className="mt-3 w-full inline-flex justify-center rounded-md px-4 py-2 bg-white text-gray-700 border border-gray-300 sm:mt-0 sm:w-auto text-sm font-medium">Batal</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserModal;