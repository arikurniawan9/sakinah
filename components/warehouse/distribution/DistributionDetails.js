// components/warehouse/distribution/DistributionDetails.js
// Component for distribution details including store selection, attendant selection, and notes
// Attendant selection shows code if available, and search works on name and code
'use client';

import { Users, FileText, Send } from 'lucide-react';
import { memo } from 'react';

const DistributionDetails = ({
  stores,
  warehouseUsers,
  selectedStore,
  setSelectedStore,
  selectedWarehouseUser,
  setSelectedWarehouseUser,
  notes,
  setNotes,
  onSubmit,
  isSubmitting,
  darkMode,
  setIsUserModalOpen,
}) => {
  return (
    <div className={`p-4 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="space-y-4">
        {/* Store Selector */}
        <div>
          <label className={`flex items-center text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <Users className="h-4 w-4 mr-2" />
            Toko Tujuan
          </label>
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
            }`}
          >
            <option value="">Pilih Toko</option>
            {stores.map(store => (
              <option key={store.id} value={store.id}>{store.name}</option>
            ))}
          </select>
        </div>

        {/* User Selector Button - Only ATTENDANT users will be shown for distribution */}
        <div>
          <label className={`flex items-center text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <Users className="h-4 w-4 mr-2" />
            Pelayan Gudang
          </label>
          <button
            type="button"
            onClick={() => setIsUserModalOpen(true)}
            className={`w-full p-2 border rounded-md text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
            }`}
          >
            <span>{selectedWarehouseUser ? selectedWarehouseUser.code ? `${selectedWarehouseUser.name} (${selectedWarehouseUser.code})` : selectedWarehouseUser.name : 'Pilih Pelayan'}</span>
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Notes Textarea */}
        <div>
          <label className={`flex items-center text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <FileText className="h-4 w-4 mr-2" />
            Catatan
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
            }`}
            placeholder="Catatan tambahan untuk distribusi ke toko..."
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className={`w-full flex items-center justify-center px-4 py-3 rounded-lg text-sm font-medium text-white transition-colors duration-200 ${
              isSubmitting
                ? 'bg-gray-500 cursor-not-allowed'
                : darkMode
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
            } shadow-md hover:shadow-lg`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Memproses...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Simpan Distribusi ke Toko
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(DistributionDetails);
