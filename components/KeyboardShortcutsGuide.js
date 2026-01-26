// components/KeyboardShortcutsGuide.js
import React from 'react';

const KeyboardShortcutsGuide = ({ shortcuts, darkMode }) => {
  return (
    <div className={`mt-6 p-3 rounded-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border text-sm`}>
      <h3 className={`text-md font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Pintasan Keyboard:</h3>
      <div className="flex flex-wrap gap-3">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="flex items-center space-x-1">
            <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{shortcut.description.replace(/produk/gi, '').replace(/\s+/g, ' ').trim()}</span>
            <kbd className={`px-2 py-0.5 text-xs font-semibold rounded ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800'}`}>
              {shortcut.key}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KeyboardShortcutsGuide;
