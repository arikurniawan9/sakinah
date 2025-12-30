// components/warehouse/distribution/DraftDistributionManager.js
import { useState, useEffect } from 'react';
import { FileText, Save, Edit, Trash2, X, Check, Clock } from 'lucide-react';
import { useDraftDistribution } from '../../../lib/hooks/warehouse/useDraftDistribution';

const formatNumber = (num) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num || 0);
};

const DraftDistributionManager = ({ 
  items, 
  selectedStore, 
  notes, 
  darkMode,
  onSaveDraft,
  onLoadDraft,
  onDeleteDraft
}) => {
  const { 
    drafts, 
    loading, 
    error, 
    fetchDrafts,
    saveDraft,
    updateDraft,
    deleteDraft 
  } = useDraftDistribution();
  
  const [showDrafts, setShowDrafts] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftName, setDraftName] = useState('');

  // Fetch drafts when selected store changes
  useEffect(() => {
    if (selectedStore) {
      fetchDrafts(selectedStore);
    }
  }, [selectedStore, fetchDrafts]);

  const handleSaveDraft = async () => {
    if (!selectedStore || items.length === 0) {
      alert('Toko dan item distribusi harus dipilih untuk menyimpan draft');
      return;
    }
    
    setSavingDraft(true);
    try {
      await saveDraft(selectedStore, items, notes);
      setDraftName('');
      alert('Draft distribusi berhasil disimpan');
    } catch (err) {
      alert('Gagal menyimpan draft: ' + err.message);
    } finally {
      setSavingDraft(false);
    }
  };

  const handleLoadDraft = (draft) => {
    onLoadDraft(draft);
    setShowDrafts(false);
  };

  const handleDeleteDraft = async (draftId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus draft ini?')) {
      try {
        await deleteDraft(draftId);
        alert('Draft distribusi berhasil dihapus');
      } catch (err) {
        alert('Gagal menghapus draft: ' + err.message);
      }
    }
  };

  const calculateDraftTotal = (draftItems) => {
    return draftItems.reduce((total, item) => total + (item.quantity * item.purchasePrice), 0);
  };

  return (
    <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-sm font-semibold flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          <FileText className="h-4 w-4 mr-2" />
          Draft Distribusi
        </h3>
        <button
          onClick={() => setShowDrafts(!showDrafts)}
          className={`p-1 rounded ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'}`}
        >
          {showDrafts ? <X className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder="Nama draft (opsional)..."
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          className={`flex-1 text-sm px-2 py-1 border rounded ${
            darkMode 
              ? 'border-gray-600 bg-gray-700 text-white' 
              : 'border-gray-300 bg-white text-gray-900'
          }`}
        />
        <button
          onClick={handleSaveDraft}
          disabled={savingDraft || !selectedStore || items.length === 0}
          className={`flex items-center px-2 py-1 text-xs rounded ${
            savingDraft || !selectedStore || items.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : darkMode
                ? 'bg-blue-700 hover:bg-blue-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          {savingDraft ? (
            <span className="flex items-center">
              <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></span>
              Menyimpan...
            </span>
          ) : (
            <span className="flex items-center">
              <Save className="h-3 w-3 mr-1" />
              Simpan
            </span>
          )}
        </button>
      </div>

      {showDrafts && (
        <div className={`mt-3 rounded border ${darkMode ? 'border-gray-600 bg-gray-700/50' : 'border-gray-300 bg-white'}`}>
          {loading ? (
            <div className="p-3 text-center text-sm">
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500 mr-2"></div>
                Memuat draft...
              </div>
            </div>
          ) : error ? (
            <div className="p-3 text-sm text-red-500">
              Error: {error}
            </div>
          ) : drafts.length === 0 ? (
            <div className="p-3 text-center text-sm text-gray-500">
              Tidak ada draft distribusi tersimpan
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              {drafts.map((draft) => (
                <div 
                  key={draft.id} 
                  className={`p-3 border-b ${darkMode ? 'border-gray-600 hover:bg-gray-600/50' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <span className={`text-sm font-medium truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                          {draft.store?.name || 'Draft'}
                        </span>
                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">
                          {draft.items.length} item
                        </span>
                      </div>
                      <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {new Date(draft.createdAt).toLocaleDateString('id-ID')} •&nbsp;
                        {formatNumber(calculateDraftTotal(draft.items))}
                      </div>
                      {draft.notes && (
                        <div className={`text-xs mt-1 italic ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                          Catatan: {draft.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-1 ml-2">
                      <button
                        onClick={() => handleLoadDraft(draft)}
                        className={`p-1.5 rounded text-xs ${darkMode ? 'text-green-400 hover:bg-gray-600' : 'text-green-600 hover:bg-gray-200'}`}
                        title="Muat draft"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDraft(draft.id)}
                        className={`p-1.5 rounded text-xs ${darkMode ? 'text-red-400 hover:bg-gray-600' : 'text-red-600 hover:bg-gray-200'}`}
                        title="Hapus draft"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DraftDistributionManager;