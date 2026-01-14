// lib/hooks/useWarehouseProductTable.js
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';

export const useWarehouseProductTable = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    startIndex: 1,
    endIndex: 0
  });

  const { data: session } = useSession(); // Added session

  const fetchProducts = async (page = currentPage, limit = itemsPerPage, search = searchTerm) => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: page,
        limit: limit,
      });

      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`/api/warehouse/products?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal mengambil data produk gudang');
      }

      const data = await response.json();
      setProducts(data.products || []);
      setPagination(data.pagination || {});
    } catch (err) {
      console.error('Error fetching warehouse products:', err);
      setError('Terjadi kesalahan saat mengambil data: ' + err.message);
      toast.error('Gagal memuat data produk gudang: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [currentPage, itemsPerPage, searchTerm, session]); // Added session to dependency

  // Reset pagination when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return {
    products,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    pagination,
    fetchProducts,
    setError,
  };
};