'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function SupplierModal({ 
  showModal, 
  closeModal, 
  handleSave, 
  formData, 
  editingSupplier,
  error,
  setFormError,
  darkMode = false 
}) {
  const [localFormData, setLocalFormData] = useState({
    name: '',
    contactPerson: '',
    position: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });

  useEffect(() => {
    if (editingSupplier) {
      setLocalFormData({
        name: editingSupplier.name || '',
        contactPerson: editingSupplier.contactPerson || '',
        position: editingSupplier.position || '',
        phone: editingSupplier.phone || '',
        email: editingSupplier.email || '',
        address: editingSupplier.address || '',
        notes: editingSupplier.notes || ''
      });
    } else {
      setLocalFormData({
        name: '',
        contactPerson: '',
        position: '',
        phone: '',
        email: '',
        address: '',
        notes: ''
      });
    }
  }, [editingSupplier, showModal]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLocalFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await handleSave(localFormData);
      setFormError('');
    } catch (err) {
      // Error sudah ditangani di handleSave
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className={`${darkMode ? 'bg-gray-900 bg-opacity-75' : 'bg-gray-500 bg-opacity-75'}`}></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className={`inline-block align-bottom ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${darkMode ? 'border-gray-700' : 'border-gray-200'} border`}>
          <div className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${darkMode ? 'bg-gray-800' : ''}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg leading-6 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {editingSupplier ? 'Edit Supplier' : 'Tambah Supplier Baru'}
              </h3>
              <button
                onClick={closeModal}
                className={`p-1 rounded-full ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {error && (
              <div className={`mb-4 p-3 rounded-md ${darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'}`}>
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="name" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Nama Supplier *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={localFormData.name}
                    onChange={handleInputChange}
                    required
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contactPerson" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Kontak Person</label>
                    <input
                      type="text"
                      id="contactPerson"
                      name="contactPerson"
                      value={localFormData.contactPerson}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="position" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Jabatan</label>
                    <input
                      type="text"
                      id="position"
                      name="position"
                      value={localFormData.position}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Telepon</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={localFormData.phone}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={localFormData.email}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="address" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Alamat</label>
                  <textarea
                    id="address"
                    name="address"
                    value={localFormData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
                  />
                </div>
                
                <div>
                  <label htmlFor="notes" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Catatan</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={localFormData.notes}
                    onChange={handleInputChange}
                    rows={2}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
                  />
                </div>
              </div>
              
              <div className={`mt-6 flex justify-end space-x-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} px-4 py-3 sm:px-6 rounded-md`}>
                <button
                  type="button"
                  onClick={closeModal}
                  className={`px-4 py-2 border ${darkMode ? 'border-gray-600 bg-gray-600 text-white hover:bg-gray-500' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'} rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  {editingSupplier ? 'Perbarui' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}