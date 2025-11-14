// lib/hooks/useCategoryTable.js
import { useState, useEffect } from 'react';

export const useCategoryTable = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCategories, setTotalCategories] = useState(0);

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const url = `/api/kategori?page=${currentPage}&limit=${itemsPerPage}&search=${searchTerm}`;
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal mengambil data');
      setCategories(data.categories || []);
      setTotalCategories(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when dependencies change
  useEffect(() => {
    fetchCategories();
  }, [currentPage, itemsPerPage, searchTerm]);

  // Handle search with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setCurrentPage(1); // Reset to page 1 when search term changes
      fetchCategories();
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  return {
    categories,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    totalCategories,
    fetchCategories,
    setError
  };
};