// components/pelayan/PelayanView.js
'use client';

import PelayanTable from './PelayanTable';
import PelayanCard from './PelayanCard';

export default function PelayanView({
  attendants,
  loading,
  darkMode,
  selectedRows,
  handleSelectAll,
  handleSelectRow,
  handleEdit,
  handleDelete,
  view,
}) {
  if (loading) {
    return <div className="text-center py-10">Memuat data pelayan...</div>;
  }

  if (attendants.length === 0) {
    return <div className="text-center py-10">Tidak ada data pelayan ditemukan.</div>;
  }

  return (
    <>
      {view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {attendants.map(attendant => (
            <PelayanCard
              key={attendant.id}
              attendant={attendant}
              onEdit={handleEdit}
              onDelete={handleDelete}
              darkMode={darkMode}
            />
          ))}
        </div>
      ) : (
        <PelayanTable
          attendants={attendants}
          loading={loading}
          darkMode={darkMode}
          selectedRows={selectedRows}
          handleSelectAll={handleSelectAll}
          handleSelectRow={handleSelectRow}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
        />
      )}
    </>
  );
}
