// components/Breadcrumbs.js
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home } from 'lucide-react';

const Breadcrumbs = ({ darkMode = false }) => {
  const pathname = usePathname();
  
  // Fungsi untuk mengonversi path menjadi label yang lebih ramah pengguna
  const formatPath = (path) => {
    if (!path) return '';
    
    // Ganti karakter khusus dengan spasi dan capitalize
    return path
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  // Hapus query params dan split path
  const pathSegments = pathname
    .split('?')[0]  // Hapus query string jika ada
    .split('/')
    .filter(segment => segment !== ''); // Hapus segmen kosong

  // Buat array breadcrumb items
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = '/' + pathSegments.slice(0, index + 1).join('/');
    const isLast = index === pathSegments.length - 1;
    
    return {
      href,
      label: formatPath(segment),
      isLast
    };
  });

  if (breadcrumbs.length === 0) {
    return null; // Jangan tampilkan breadcrumb di halaman utama
  }

  return (
    <nav className="flex mb-6" aria-label="Breadcrumb">
      <ol className={`inline-flex items-center space-x-1 md:space-x-3 ${
        darkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>
        {/* Home breadcrumb */}
        <li className="inline-flex items-center">
          <Link 
            href="/" 
            className={`inline-flex items-center text-sm font-medium ${
              darkMode 
                ? 'text-gray-400 hover:text-white' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Home className="w-4 h-4 mr-2" />
            Beranda
          </Link>
        </li>

        {/* Render breadcrumb lainnya */}
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.href} className="inline-flex items-center">
            <span className={`mx-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>/</span>
            {crumb.isLast ? (
              <span className={`text-sm font-medium ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className={`text-sm font-medium ${
                  darkMode 
                    ? 'text-gray-400 hover:text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;