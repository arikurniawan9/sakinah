// components/warehouse/distribution/DistributionTemplateManager.js
import { useState, useEffect } from 'react';
import { FileText, Save, Edit, Trash2, X, Plus, Clock } from 'lucide-react';
import { useDistributionTemplate } from '../../../lib/hooks/warehouse/useDistributionTemplate';

const formatNumber = (num) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num || 0);
};

const DistributionTemplateManager = ({ 
  items, 
  selectedStore, 
  notes, 
  darkMode,
  onLoadTemplate
}) => {
  const { 
    templates, 
    loading, 
    error, 
    fetchTemplates,
    saveTemplate,
    updateTemplate,
    deleteTemplate 
  } = useDistributionTemplate();
  
  const [showTemplates, setShowTemplates] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Fetch templates when selected store changes
  useEffect(() => {
    if (selectedStore) {
      fetchTemplates(selectedStore);
    }
  }, [selectedStore, fetchTemplates]);

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      alert('Nama template harus diisi');
      return;
    }
    
    if (!selectedStore || items.length === 0) {
      alert('Toko dan item distribusi harus dipilih untuk menyimpan template');
      return;
    }
    
    setSavingTemplate(true);
    try {
      await saveTemplate(templateName.trim(), selectedStore, items, notes);
      setTemplateName('');
      setShowSaveModal(false);
      alert('Template distribusi berhasil disimpan');
    } catch (err) {
      alert('Gagal menyimpan template: ' + err.message);
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleLoadTemplate = (template) => {
    onLoadTemplate(template);
    setShowTemplates(false);
  };

  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus template ini?')) {
      try {
        await deleteTemplate(templateId);
        alert('Template distribusi berhasil dihapus');
      } catch (err) {
        alert('Gagal menghapus template: ' + err.message);
      }
    }
  };

  const calculateTemplateTotal = (templateItems) => {
    return templateItems.reduce((total, item) => total + (item.quantity * item.purchasePrice), 0);
  };

  return (
    <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-sm font-semibold flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          <FileText className="h-4 w-4 mr-2" />
          Template Distribusi
        </h3>
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className={`p-1 rounded ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'}`}
        >
          {showTemplates ? <X className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
        </button>
      </div>

      <button
        onClick={() => setShowSaveModal(true)}
        disabled={!selectedStore || items.length === 0}
        className={`w-full flex items-center justify-center px-3 py-1.5 text-xs rounded ${
          !selectedStore || items.length === 0
            ? 'bg-gray-400 cursor-not-allowed'
            : darkMode
              ? 'bg-green-700 hover:bg-green-600 text-white'
              : 'bg-green-600 hover:bg-green-500 text-white'
        }`}
      >
        <Plus className="h-3 w-3 mr-1" />
        Simpan Sebagai Template
      </button>

      {showTemplates && (
        <div className={`mt-3 rounded border ${darkMode ? 'border-gray-600 bg-gray-700/50' : 'border-gray-300 bg-white'}`}>
          {loading ? (
            <div className="p-3 text-center text-sm">
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500 mr-2"></div>
                Memuat template...
              </div>
            </div>
          ) : error ? (
            <div className="p-3 text-sm text-red-500">
              Error: {error}
            </div>
          ) : templates.length === 0 ? (
            <div className="p-3 text-center text-sm text-gray-500">
              Tidak ada template distribusi tersimpan
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              {templates.map((template) => (
                <div 
                  key={template.id} 
                  className={`p-3 border-b ${darkMode ? 'border-gray-600 hover:bg-gray-600/50' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <span className={`text-sm font-medium truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                          {template.name}
                        </span>
                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                          {template.data.items.length} item
                        </span>
                      </div>
                      <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {new Date(template.createdAt).toLocaleDateString('id-ID')} •&nbsp;
                        {formatNumber(calculateTemplateTotal(template.data.items))}
                      </div>
                      {template.data.notes && (
                        <div className={`text-xs mt-1 italic ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                          Catatan: {template.data.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-1 ml-2">
                      <button
                        onClick={() => handleLoadTemplate(template)}
                        className={`p-1.5 rounded text-xs ${darkMode ? 'text-green-400 hover:bg-gray-600' : 'text-green-600 hover:bg-gray-200'}`}
                        title="Muat template"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className={`p-1.5 rounded text-xs ${darkMode ? 'text-red-400 hover:bg-gray-600' : 'text-red-600 hover:bg-gray-200'}`}
                        title="Hapus template"
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

      {/* Modal untuk menyimpan template */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl shadow-lg w-full max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Simpan Sebagai Template
              </h3>
              <button 
                onClick={() => setShowSaveModal(false)}
                className={`p-1 rounded-full ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Nama Template
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Contoh: Distribusi Mingguan Toko A"
                  className={`w-full px-3 py-2 border rounded-md ${
                    darkMode 
                      ? 'border-gray-600 bg-gray-700 text-white' 
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                  autoFocus
                />
              </div>
              <div className="mb-4">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Anda akan menyimpan {items.length} item untuk toko <strong>{selectedStore ? 'terpilih' : 'ini'}</strong>.
                </p>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end space-x-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className={`px-4 py-2 rounded-md ${
                  darkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Batal
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={savingTemplate || !templateName.trim()}
                className={`px-4 py-2 rounded-md flex items-center ${
                  savingTemplate || !templateName.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : darkMode
                      ? 'bg-blue-600 text-white hover:bg-blue-500'
                      : 'bg-blue-600 text-white hover:bg-blue-500'
                }`}
              >
                {savingTemplate ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Simpan Template
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DistributionTemplateManager;