// lib/hooks/useWarehouseStockTable.js
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export const useWarehouseStockTable = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    startIndex: 1,
    endIndex: 0
  });

  // Fetch warehouse stocks
  const fetchStocks = async (page = currentPage, limit = itemsPerPage, search = searchTerm) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page,
        limit: limit,
      });

      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`/api/warehouse/stock?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch warehouse stocks');
      }

      setStocks(data.warehouseProducts || []);
      setPagination(data.pagination || {});
    } catch (err) {
      setError(err.message);
      toast.error(`Gagal memuat data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, [currentPage, itemsPerPage, searchTerm]);

  // Handle search and pagination changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  return {
    stocks,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    pagination,
    fetchStocks,
    setError
  };
};