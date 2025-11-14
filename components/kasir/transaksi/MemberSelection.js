// components/kasir/transaksi/MemberSelection.js
'use client';

import { useState } from 'react';
import { Users, X, Plus } from 'lucide-react';

const MemberSelection = ({ selectedMember, defaultMember, onSelectMember, onRemoveMember, members, darkMode, isOpen, onToggle, onAddNewMember }) => {
  const [memberSearchTerm, setMemberSearchTerm] = useState('');

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
    member.phone.includes(memberSearchTerm)
  );

  const handleSelect = (member) => {
    onSelectMember(member);
    onToggle(false); // Close modal on selection
    setMemberSearchTerm('');
  };

  return (
    <>
      <div className={`rounded-lg shadow p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Member <span className="text-xs text-gray-500 ml-2 float-right">(ALT+M)</span>
</h2>
          {selectedMember && (
            <span className={`text-sm font-medium px-2 py-1 rounded-full ${darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'}`}>
              {selectedMember.name}
            </span>
          )}
        </div>

        {selectedMember ? (
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {selectedMember.name} ({selectedMember.membershipType})
              </div>
              <div className="text-xs mt-1">
                <span className={`px-2 py-0.5 rounded-full ${
                  selectedMember.discount === 15 ? 'bg-purple-100 text-purple-800' :
                  selectedMember.discount === 10 ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                } ${darkMode ? 'text-xs' : ''}`}>
                  {selectedMember.discount}% Discount
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={onRemoveMember}
                className={`p-1 rounded-full ${darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-100'}`}
                title="Hapus Member"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className={`text-sm italic ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {defaultMember ? defaultMember.name : 'Tidak ada member'}
            </span>
            <button
              onClick={() => onToggle(true)}
              className={`py-2 px-4 border rounded-md shadow-sm text-sm font-medium flex items-center justify-center ${
                darkMode
                  ? 'border-gray-600 text-gray-200 bg-gray-700 hover:bg-gray-600'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Pilih Member
            </button>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
          <div className={`relative w-full max-w-md max-h-[70vh] rounded-2xl shadow-2xl flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className="text-lg font-semibold">Pilih Member</h3>
              <input
                type="text"
                placeholder="Cari nama atau no. telp member..."
                value={memberSearchTerm}
                onChange={(e) => setMemberSearchTerm(e.target.value)}
                className={`w-full mt-2 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                }`}
                autoFocus
              />
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              {filteredMembers.map(member => (
                <div
                  key={member.id}
                  onClick={() => handleSelect(member)}
                  className={`p-3 rounded-lg cursor-pointer ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{member.phone}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      member.discount === 15 ? 'bg-purple-100 text-purple-800' : 
                      member.discount === 10 ? 'bg-blue-100 text-blue-800' : 
                      'bg-yellow-100 text-yellow-800'
                    } ${darkMode ? 'text-xs' : ''}`}>
                      {member.discount}% Discount
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex space-x-2">
                <button
                  onClick={() => onToggle(false)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
                    darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Batal
                </button>
                {onAddNewMember && (
                  <button
                    onClick={() => {
                      onToggle(false); // Close modal
                      onAddNewMember(); // Call function to open add member modal
                    }}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center ${
                      darkMode ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-green-600 hover:bg-green-500 text-white'
                    }`}
                  >
                    <Plus className="h-4 w-4 inline mr-2" />
                    Tambah Baru
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MemberSelection;
