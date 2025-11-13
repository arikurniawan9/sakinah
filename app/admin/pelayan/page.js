// app/admin/pelayan/page.js
'use client';

import { useState } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useDarkMode } from '../../../components/DarkModeContext';

import { usePelayanTable } from '../../../lib/hooks/usePelayanTable';
import { usePelayanForm } from '../../../lib/hooks/usePelayanForm';
import { useTableSelection } from '../../../lib/hooks/useTableSelection';

import PelayanView from '../../../components/pelayan/PelayanView';
import PelayanModal from '../../../components/pelayan/PelayanModal';
import PelayanToolbar from '../../../components/pelayan/PelayanToolbar';
import Pagination from '../../../components/produk/Pagination';
import ConfirmationModal from '../../../components/ConfirmationModal';
import FloatingAddButton from '../../../components/FloatingAddButton';

export default function AttendantManagement() {
  const { darkMode } = useDarkMode();

  const {
    attendants,
    loading,
    error: tableError,
    searchTerm,
    setSearchTerm,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    totalAttendants,
    fetchAttendants,
    setError: setTableError,
  } = usePelayanTable();

  const {
    showModal,
    editingAttendant,
    formData,
    error: formError,
    success: formSuccess,
    handleInputChange,
    openModalForEdit,
    openModalForCreate,
    closeModal,
    handleSave,
    setError: setFormError,
    setSuccess: setFormSuccess,
  } = usePelayanForm(fetchAttendants);

  const { selectedRows, handleSelectAll, handleSelectRow, clearSelection, setSelectedRows } = useTableSelection(attendants);

  const [importLoading, setImportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [view, setView] = useState('table'); // 'grid' or 'table'

  // State for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = (id) => {
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDeleteMultiple = () => {
    if (selectedRows.length === 0) return;
    setItemToDelete(selectedRows);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);

    const isMultiple = Array.isArray(itemToDelete);
    let url = '/api/pelayan';
    let options = {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    };

    if (isMultiple) {
      options.body = JSON.stringify({ ids: itemToDelete });
    } else {
      url += `?id=${itemToDelete}`;
    }

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menghapus pelayan');
      }
      
      fetchAttendants();
      if (isMultiple) {
        clearSelection();
        setFormSuccess(`Berhasil menghapus ${itemToDelete.length} pelayan`);
      } else {
        setSelectedRows(prev => prev.filter(rowId => rowId !== itemToDelete));
        setFormSuccess('Pelayan berhasil dihapus');
      }
      
      setTimeout(() => setFormSuccess(''), 3000);
    } catch (err) {
      setTableError('Terjadi kesalahan saat menghapus: ' + err.message);
      setTimeout(() => setTableError(''), 5000);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const response = await fetch('/api/pelayan');
      if (!response.ok) throw new Error('Gagal mengambil data untuk export');
      const data = await response.json();

      let csvContent = 'Nama,Username,Role,Tanggal Dibuat,Tanggal Diubah\n';
      data.users.forEach(user => {
        const name = `"${user.name.split('"').join('""')}"`;
        const username = `"${user.username.split('"').join('""')}"`;
        const role = `"${user.role}"`;
        const createdAt = `"${new Date(user.createdAt).toLocaleString()}"`;
        const updatedAt = `"${new Date(user.updatedAt).toLocaleString()}"`;
        csvContent += `${name},${username},${role},${createdAt},${updatedAt}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'pelayan.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.style.visibility = 'hidden';
        link.click();
        document.body.removeChild(link);
      }
      setFormSuccess('Data pelayan berhasil diekspor');
      setTimeout(() => setFormSuccess(''), 3000);
    } catch (err) {
      setTableError('Terjadi kesalahan saat mengekspor pelayan: ' + err.message);
      setTimeout(() => setTableError(''), 5000);
    } finally {
      setExportLoading(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls') && !file.name.toLowerCase().endsWith('.csv')) {
      setTableError('Silakan pilih file Excel (.xlsx, .xls) atau CSV (.csv)');
      setTimeout(() => setTableError(''), 5000);
      e.target.value = '';
      return;
    }

    setImportLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setFormSuccess(`Memproses file ${file.name}...`);
      
      const response = await fetch('/api/pelayan/import', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Gagal mengimport pelayan');
      }
      
      fetchAttendants();
      
      setFormSuccess(result.message || `Berhasil mengimport ${result.importedCount || 0} pelayan`);
      e.target.value = '';
      setTimeout(() => setFormSuccess(''), 5000);
    } catch (err) {
      setTableError('Terjadi kesalahan saat import: ' + err.message);
      e.target.value = '';
      setTimeout(() => setTableError(''), 7000);
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Manajemen Pelayan
        </h1>

        <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
          <div className="p-4 sm:p-6">
            <PelayanToolbar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              itemsPerPage={itemsPerPage}
              setItemsPerPage={setItemsPerPage}
              onDeleteMultiple={handleDeleteMultiple}
              selectedRowsCount={selectedRows.length}
              onExport={handleExport}
              onImport={handleImport}
              importLoading={importLoading}
              exportLoading={exportLoading}
              darkMode={darkMode}
              view={view}
              setView={setView}
            />

            {tableError && (
              <div className={`my-4 p-4 ${darkMode ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-red-50 border border-red-200 text-red-700'} rounded-md`}>
                {tableError}
              </div>
            )}
            {formError && (
              <div className={`my-4 p-4 ${darkMode ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-red-50 border border-red-200 text-red-700'} rounded-md`}>
                {formError}
              </div>
            )}
            {formSuccess && formSuccess.trim() !== '' && (
              <div className={`my-4 p-4 ${darkMode ? 'bg-green-900/30 border-green-700 text-green-200' : 'bg-green-50 border-green-200 text-green-700'} rounded-md`}>
                {formSuccess}
              </div>
            )}

            <PelayanView
              attendants={attendants}
              loading={loading}
              darkMode={darkMode}
              selectedRows={selectedRows}
              handleSelectAll={handleSelectAll}
              handleSelectRow={handleSelectRow}
              handleEdit={openModalForEdit}
              handleDelete={handleDelete}
              view={view}
            />
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalProducts={totalAttendants}
            darkMode={darkMode}
          />
        </div>

        <PelayanModal
          showModal={showModal}
          closeModal={closeModal}
          handleSave={handleSave}
          formData={formData}
          handleInputChange={handleInputChange}
          editingAttendant={editingAttendant}
          error={formError}
          setFormError={setFormError}
          darkMode={darkMode}
        />

        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          title="Konfirmasi Hapus"
          message={`Apakah Anda yakin ingin menghapus ${ 
            Array.isArray(itemToDelete) ? itemToDelete.length + ' pelayan' : 'pelayan ini'
          }?`}
          darkMode={darkMode}
          isLoading={isDeleting}
        />
        
        <FloatingAddButton onClick={openModalForCreate} darkMode={darkMode} />
      </main>
    </ProtectedRoute>
  );
}
