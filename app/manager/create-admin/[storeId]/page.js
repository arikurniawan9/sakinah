// app/manager/create-admin/[storeId]/page.js
'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ROLES } from '@/lib/constants';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';


export default function CreateAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const storeId = params.storeId;

  const [storeName, setStoreName] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    employeeNumber: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
      router.push('/unauthorized');
      return;
    }
    if (storeId) {
      fetchStoreName();
    }
  }, [status, session, storeId, router]);

  const fetchStoreName = async () => {
    setPageLoading(true);
    try {
      const response = await fetch(`/api/stores/${storeId}`);
      if (!response.ok) {
        throw new Error('Gagal memuat detail toko.');
      }
      const data = await response.json();
      if(data.store.adminUser) {
        setError('Toko ini sudah memiliki admin. Tidak dapat menambah akun lagi.');
        toast.error('Toko ini sudah memiliki admin.');
        router.push(`/manager/edit-store/${storeId}`);
      }
      setStoreName(data.store.name);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setPageLoading(false);
    }
  };
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
        setError('Username dan password tidak boleh kosong.');
        return;
    }
    setSubmitLoading(true);
    setError('');

    try {
        const response = await fetch(`/api/stores/${storeId}/admins`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Gagal membuat akun admin.');
        }

        toast.success(`Admin ${result.user.username} berhasil dibuat untuk toko ${storeName}!`);
        router.push(`/manager/edit-store/${storeId}`);

    } catch (err) {
        setError(err.message);
        toast.error(err.message);
    } finally {
        setSubmitLoading(false);
    }
  };
  
  if (pageLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <button onClick={() => router.back()} className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-4">
            <ArrowLeft size={18} className="mr-2" />
            Kembali ke Edit Toko
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Buat Akun Admin Baru</h1>
        <p className="mt-1 text-lg text-gray-600 dark:text-gray-400">Untuk Toko: <span className='font-semibold'>{storeName}</span></p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
                <p className="text-sm text-red-700">{error}</p>
            </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Nama Lengkap</label>
            <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} placeholder="cth: Budi Setiawan" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600" />
          </div>
          
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Username <span className="text-red-500">*</span></label>
            <input id="username" name="username" type="text" value={formData.username} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600" />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Password <span className="text-red-500">*</span></label>
            <input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required placeholder="Minimal 6 karakter" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600" />
          </div>

          <div>
            <label htmlFor="employeeNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Kode Pegawai (Opsional)</label>
            <input id="employeeNumber" name="employeeNumber" type="text" value={formData.employeeNumber} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600" />
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" disabled={submitLoading} className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
              {submitLoading ? 'Menyimpan...' : 'Simpan Akun Admin'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}