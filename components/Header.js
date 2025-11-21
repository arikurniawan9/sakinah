'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Menu, X, User, LogOut, Settings } from 'lucide-react';
import { useUserTheme } from '@/components/UserThemeContext';
import ThemeControl from '@/components/ThemeControl';

const Header = ({ onLogout }) => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { userTheme } = useUserTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Close menus when pathname changes
  useEffect(() => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [pathname]);

  // Determine role name for display
  const getRoleName = () => {
    if (!session?.user) return '';
    if (session.user.isGlobalRole) {
      return session.user.role;
    }
    return session.user.storeRole || session.user.role;
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>

            {/* Logo */}
            <div className="flex-shrink-0 flex items-center ml-2 md:ml-0">
              <Link href={session?.user?.storeRole === 'CASHIER' ? '/kasir' : '/'}>
                <span className="text-xl font-bold" style={{ color: userTheme.themeColor }}>
                  {session?.user?.storeAccess?.name || 'Toko Sakinah'}
                </span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {session?.user?.storeRole !== 'CASHIER' && (
                <>
                  <Link
                    href="/"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      pathname === '/'
                        ? 'border-current text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                    style={{ color: pathname === '/' ? userTheme.themeColor : undefined }}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/products"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      pathname === '/products'
                        ? 'border-current text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                    style={{ color: pathname === '/products' ? userTheme.themeColor : undefined }}
                  >
                    Produk
                  </Link>
                  <Link
                    href="/transactions"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      pathname === '/transactions'
                        ? 'border-current text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                    style={{ color: pathname === '/transactions' ? userTheme.themeColor : undefined }}
                  >
                    Transaksi
                  </Link>
                </>
              )}
              {session?.user?.storeRole === 'CASHIER' && (
                <Link
                  href="/kasir"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    pathname === '/kasir'
                      ? 'border-current text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                  style={{ color: pathname === '/kasir' ? userTheme.themeColor : undefined }}
                >
                  Kasir
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Theme Control for desktop */}
            <div className="hidden md:block">
              <ThemeControl showLabel={false} />
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                type="button"
                className="flex items-center text-sm rounded-full focus:outline-none"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </div>
              </button>

              {isUserMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {session?.user?.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {getRoleName()}
                      </p>
                    </div>
                    
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Profil
                      </div>
                    </Link>
                    
                    <Link
                      href="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-center">
                        <Settings className="h-4 w-4 mr-2" />
                        Pengaturan
                      </div>
                    </Link>
                    
                    <button
                      onClick={onLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-center">
                        <LogOut className="h-4 w-4 mr-2" />
                        Keluar
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Close menu when clicking outside */}
              {isUserMenuOpen && (
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsUserMenuOpen(false)}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {session?.user?.storeRole !== 'CASHIER' && (
              <>
                <Link
                  href="/"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    pathname === '/'
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-current text-blue-700 dark:text-blue-300'
                      : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  style={{ color: pathname === '/' ? userTheme.themeColor : undefined }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/products"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    pathname === '/products'
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-current text-blue-700 dark:text-blue-300'
                      : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  style={{ color: pathname === '/products' ? userTheme.themeColor : undefined }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Produk
                </Link>
                <Link
                  href="/transactions"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    pathname === '/transactions'
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-current text-blue-700 dark:text-blue-300'
                      : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  style={{ color: pathname === '/transactions' ? userTheme.themeColor : undefined }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Transaksi
                </Link>
              </>
            )}
            {session?.user?.storeRole === 'CASHIER' && (
              <Link
                href="/kasir"
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  pathname === '/kasir'
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-current text-blue-700 dark:text-blue-300'
                    : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                style={{ color: pathname === '/kasir' ? userTheme.themeColor : undefined }}
                onClick={() => setIsMenuOpen(false)}
              >
                Kasir
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;