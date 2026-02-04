'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ROLES } from '@/lib/constants';
import { useUserTheme } from '@/components/UserThemeContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import DataTable from '@/components/DataTable';
import Breadcrumb from '@/components/Breadcrumb';
import { Search, Users, Store, Phone, MapPin, UserPlus, Edit, Trash2, Eye, User, CreditCard, Calendar } from 'lucide-react';

export default function AllMembersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [stores, setStores] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Fetch all members and stores
  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
      router.push('/unauthorized');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        // Fetch stores
        const storesResponse = await fetch('/api/stores');
        if (!storesResponse.ok) {
          throw new Error('Gagal mengambil data toko');
        }
        const storesData = await storesResponse.json();
        setStores(storesData.stores || []);

        // Fetch members
        const params = new URLSearchParams({
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm,
          global: 'true' // This tells the API to fetch members from all stores
        });

        const membersResponse = await fetch(`/api/member?${params.toString()}`);

        if (!membersResponse.ok) {
          if (membersResponse.status === 401) {
            router.push('/login');
            return;
          } else if (membersResponse.status === 403) {
            router.push('/unauthorized');
            return;
          }
          throw new Error(`HTTP error! status: ${membersResponse.status}`);
        }

        const membersData = await membersResponse.json();
        // Gabungkan informasi nama toko ke data member
        const membersWithStoreNames = membersData.members.map(member => ({
          ...member,
          storeName: getStoreName(member.storeId)
        }));
        setMembers(membersWithStoreNames || []);
        setTotalItems(membersData.total || 0);
      } catch (err) {
        console.error('Error fetching members:', err);
        setError('Gagal mengambil data member: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [status, session, currentPage, itemsPerPage, searchTerm, router]);

  // Function to get store name by ID
  const getStoreName = (storeId) => {
    const store = stores.find(s => s.id === storeId);
    return store ? store.name : (storeId ? 'Toko Tidak Dikenal' : 'Belum Ditentukan');
  };

  // Columns configuration for the DataTable
  const columns = [
    {
      key: 'no',
      title: 'No.',
      render: (_, __, index) => (currentPage - 1) * itemsPerPage + index + 1,
    },
    {
      key: 'name',
      title: 'Nama Member',
      render: (value, row) => (
        <div className="flex items-center">
          <div className="ml-4">
            <div className="font-medium text-gray-900 dark:text-white">{value}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{row.code}</div>
          </div>
        </div>
      )
    },
    {
      key: 'phone',
      title: 'Telepon',
      render: (value) => (
        <div className="flex items-center">
          <Phone className="h-4 w-4 mr-2 text-gray-400" />
          {value}
        </div>
      )
    },
    {
      key: 'membershipType',
      title: 'Tipe Keanggotaan',
      render: (value) => {
        const typeColors = {
          'SILVER': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
          'GOLD': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
          'PLATINUM': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
        };
        
        const bgColor = typeColors[value] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor}`}>
            {value}
          </span>
        );
      }
    },
    {
      key: 'storeId',
      title: 'Toko',
      render: (value) => (
        <div className="flex items-center">
          <Store className="h-4 w-4 mr-2 text-gray-400" />
          {getStoreName(value)}
        </div>
      )
    },
    {
      key: 'address',
      title: 'Alamat',
      render: (value) => (
        <div className="flex items-center">
          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
          {value || 'Alamat tidak disediakan'}
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Aksi',
      render: (value, row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => {
              // Gunakan informasi toko yang sudah digabungkan ke data member
              setSelectedMember(row);
              setIsModalOpen(true);
            }}
            className={`p-1 rounded-full ${
              darkMode
                ? 'text-blue-400 hover:bg-blue-700/30'
                : 'text-blue-500 hover:bg-blue-100'
            }`}
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  // Hydration-safe loading and authentication checks
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
    router.push('/unauthorized');
    return null;
  }

  const paginationData = {
    currentPage,
    totalPages: Math.ceil(totalItems / itemsPerPage),
    totalItems,
    onPageChange: setCurrentPage,
  };

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
          { title: 'Dashboard', href: '/manager' },
          { title: 'Semua Member', href: '/manager/members' },
        ]}
        darkMode={darkMode}
      />

      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Semua Member
        </h1>
        <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Daftar semua member dari semua toko
        </p>
      </div>

      {error && (
        <div className={`mb-4 p-4 rounded-lg ${darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'}`}>
          {error}
        </div>
      )}

      <div className={`rounded-xl shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
        {/* Table Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Cari member..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500'
                    : 'border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  >
                    <div className={darkMode ? 'text-gray-300' : 'text-gray-500'}>
                      {column.title}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Tidak ada data member ditemukan
                  </td>
                </tr>
              ) : (
                members.map((row, index) => (
                  <tr key={row.id || index} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                    {columns.map((column) => (
                      <td
                        key={`${row.id || index}-${column.key}`}
                        className="px-6 py-4 whitespace-nowrap text-sm"
                      >
                        <div className={darkMode ? 'text-gray-300' : 'text-gray-900'}>
                          {column.render ? column.render(row[column.key], row, index) : row[column.key]}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Menampilkan{' '}
              <span className="font-medium">
                {members.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
              </span>{' '}
              sampai{' '}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, totalItems)}
              </span>{' '}
              dari <span className="font-medium">{totalItems}</span> hasil
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1); // Reset to first page when changing items per page
                }}
                className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500'
                    : 'border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                }`}
              >
                {[10, 20, 30, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size} per halaman
                  </option>
                ))}
              </select>

              <div className="flex items-center space-x-1">
                {(() => {
                  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
                  return (
                    <>
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className={`px-3 py-2 rounded-md text-sm font-medium ${
                          currentPage === 1
                            ? 'opacity-50 cursor-not-allowed'
                            : darkMode
                            ? 'bg-gray-700 text-white hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        }`}
                      >
                        Sebelumnya
                      </button>

                      <span className={`px-3 py-2 text-sm font-medium ${
                        darkMode ? 'text-white' : 'text-gray-800'
                      }`}>
                        Halaman {currentPage} dari {totalPages}
                      </span>

                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className={`px-3 py-2 rounded-md text-sm font-medium ${
                          currentPage === totalPages || totalPages === 0
                            ? 'opacity-50 cursor-not-allowed'
                            : darkMode
                            ? 'bg-gray-700 text-white hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        }`}
                      >
                        Berikutnya
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Detail Member */}
      {isModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsModalOpen(false)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className={`inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-center">
                      <h3 className={`text-lg leading-6 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`} id="modal-title">
                        Detail Member
                      </h3>
                      <button
                        type="button"
                        className={`text-gray-400 hover:text-gray-500 focus:outline-none`}
                        onClick={() => setIsModalOpen(false)}
                      >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="mt-4 space-y-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 border-2 border-dashed"></div>
                        <div className="ml-4">
                          <h4 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {selectedMember.name}
                          </h4>
                          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            {selectedMember.code}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-start">
                          <User className={`h-5 w-5 mr-3 mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                          <div>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Nama Lengkap</p>
                            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {selectedMember.name || '-'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <CreditCard className={`h-5 w-5 mr-3 mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                          <div>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Kode Member</p>
                            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {selectedMember.code || '-'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <Phone className={`h-5 w-5 mr-3 mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                          <div>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Nomor Telepon</p>
                            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {selectedMember.phone || '-'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <MapPin className={`h-5 w-5 mr-3 mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                          <div>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Alamat</p>
                            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {selectedMember.address || 'Alamat tidak disediakan'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <Store className={`h-5 w-5 mr-3 mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                          <div>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Toko</p>
                            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {selectedMember.storeName || 'Toko tidak ditemukan'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <User className={`h-5 w-5 mr-3 mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                          <div>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tipe Keanggotaan</p>
                            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {selectedMember.membershipType || '-'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <Calendar className={`h-5 w-5 mr-3 mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                          <div>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tanggal Dibuat</p>
                            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {selectedMember.createdAt ? new Date(selectedMember.createdAt).toLocaleDateString('id-ID', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <button
                  type="button"
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-base ${
                    darkMode ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                  }`}
                  onClick={() => {
                    setIsModalOpen(false);
                    router.push(`/admin/member/${selectedMember.id}/edit`);
                  }}
                >
                  Edit Member
                </button>
                <button
                  type="button"
                  className={`mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-base ${
                    darkMode ? 'bg-gray-600 text-white border-gray-600 hover:bg-gray-700 focus:ring-gray-500' : 'bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500'
                  }`}
                  onClick={() => setIsModalOpen(false)}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}