// components/pelayan/PelayanCard.js
'use client';

import Link from 'next/link';
import { Edit, Trash2, Info, User, AtSign, Shield } from 'lucide-react';

export default function PelayanCard({ attendant, onEdit, onDelete, darkMode }) {
  const avatarLetter = attendant.name ? attendant.name.charAt(0).toUpperCase() : 'P';

  return (
    <div className={`relative rounded-xl shadow-md transition-all duration-300 ${darkMode ? 'bg-gray-800 hover:shadow-purple-500/20 hover:shadow-lg' : 'bg-white hover:shadow-xl'}`}>
      <div className="p-6 pb-14">
        <div className="flex items-start justify-between">
          <div className={`w-12 h-12 flex items-center justify-center rounded-full text-xl font-bold ${darkMode ? 'bg-gray-700 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
            {avatarLetter}
          </div>
          <div className={`text-sm font-medium px-2 py-1 rounded-full ${
            attendant.role === 'ADMIN' 
              ? (darkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-800')
              : (darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800')
          }`}>
            {attendant.role}
          </div>
        </div>
        <div className="mt-4">
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {attendant.name}
          </h3>
          <div className="mt-2 space-y-1 text-sm">
            <p className={`flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <AtSign className="h-4 w-4 mr-2 text-gray-400" /> {attendant.username}
            </p>
            {attendant.code && (
              <p className={`flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <User className="h-4 w-4 mr-2 text-gray-400" /> {attendant.code}
              </p>
            )}
            {attendant.employeeNumber && (
              <p className={`flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <Shield className="h-4 w-4 mr-2 text-gray-400" /> {attendant.employeeNumber}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="absolute bottom-3 right-3 flex items-center space-x-2">
        <button
          onClick={() => onEdit(attendant)}
          className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
          aria-label="Edit pelayan"
        >
          <Edit className="h-4 w-4" />
        </button>
        <Link href={`/admin/pelayan/${attendant.id}`}>
          <button
            className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-blue-400 hover:bg-gray-600' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
            aria-label="Lihat detail"
          >
            <Info className="h-4 w-4" />
          </button>
        </Link>
        <button
          onClick={() => onDelete(attendant.id)}
          className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-red-400 hover:bg-gray-600' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
          aria-label="Hapus pelayan"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
