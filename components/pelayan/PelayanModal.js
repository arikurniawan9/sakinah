import React from 'react';
import { Save, X } from 'lucide-react';

const PelayanModal = ({
  showModal,
  closeModal,
  handleSave,
  formData,
  handleInputChange,
  editingAttendant,
  error,
  setFormError,
  darkMode,
}) => {
  if (!showModal) return null;

  return (
    <div className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className={`${darkMode ? 'bg-gray-800 bg-opacity-75' : 'bg-gray-500 bg-opacity-75'}`}></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className={`inline-block align-bottom ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md lg:max-w-xl sm:w-full border ${darkMode ? 'border-gray-700' : 'border-theme-purple-200'}`}>
          <div className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-lg leading-6 font-medium ${darkMode ? 'text-theme-purple-400' : 'text-theme-purple-800'}`} id="modal-title">
              {editingAttendant ? 'Edit Pelayan' : 'Tambah Pelayan Baru'}
            </h3>
            <div className="mt-4 w-full">
              {error && <div className={`mb-4 p-3 text-sm rounded-md ${darkMode ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-red-50 border border-red-200 text-red-700'}`}>{error}</div>}
              <form>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Kode Karyawan</label>
                    <input type="text" name="employeeNumber" value={formData.employeeNumber || ''} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-md sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-theme-purple-300'}`} placeholder="KG001, dll" />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Nama Pelayan *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-md sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-theme-purple-300'}`} required />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Username *</label>
                    <input type="text" name="username" value={formData.username} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-md sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-theme-purple-300'}`} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Jenis Kelamin</label>
                      <select name="gender" value={formData.gender || ''} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-md sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-theme-purple-300'}`}>
                        <option value="">Pilih</option>
                        <option value="LAKI_LAKI">Laki-laki</option>
                        <option value="PEREMPUAN">Perempuan</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>No. Telepon</label>
                      <input type="text" name="phone" value={formData.phone || ''} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-md sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-theme-purple-300'}`} />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Alamat</label>
                    <textarea name="address" rows="2" value={formData.address || ''} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-md sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-theme-purple-300'}`}></textarea>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>{editingAttendant ? 'Password Baru (Opsional)' : 'Password *'}</label>
                    <input type="password" name="password" value={formData.password} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-md sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-theme-purple-300'}`} />
                  </div>
                </div>
              </form>
            </div>
          </div>
          <div className={`px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse sm:gap-3 ${darkMode ? 'bg-gray-700' : 'bg-theme-purple-50'}`}>
            <button type="button" onClick={handleSave} className="w-full inline-flex justify-center rounded-md px-4 py-2 text-white bg-theme-purple-600 hover:bg-theme-purple-700 sm:w-auto text-sm font-medium">Simpan</button>
            <button type="button" onClick={closeModal} className="mt-3 w-full inline-flex justify-center rounded-md px-4 py-2 bg-white text-gray-700 border border-gray-300 sm:mt-0 sm:w-auto text-sm font-medium">Batal</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PelayanModal;