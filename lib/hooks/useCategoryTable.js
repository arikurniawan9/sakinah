// lib/hooks/useCategoryTable.js
import { useState, useEffect, useCallback } from 'react'; // Added useCallback

export const useCategoryTable = (options = {}) => {
  const { scope } = options;
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCategories, setTotalCategories] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // New refresh trigger

  const fetchCategories = useCallback(async () => { // Wrapped with useCallback
    setLoading(true);
    setError('');
    try {
      const basePath = scope === 'warehouse' ? '/api/warehouse' : '/api';
      const cacheBuster = `_=${new Date().getTime()}`; // Cache-busting parameter
      // Use 'kategori' for main API and 'categories' for warehouse API
      const endpoint = scope === 'warehouse' ? 'categories' : 'kategori';
      const url = `${basePath}/${endpoint}?page=${currentPage}&limit=${itemsPerPage}&search=${searchTerm}&${cacheBuster}`;
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
  }, [currentPage, itemsPerPage, searchTerm, scope, refreshTrigger]); // Added refreshTrigger to dependencies

  // Separate effect for search with debounce
  useEffect(() => {
    if (searchTerm === '') {
      // If search term is empty, fetch immediately without debounce and reset to first page
      setCurrentPage(1);
      fetchCategories();
    } else {
      // Otherwise, use debounce for search term changes
      const handler = setTimeout(() => {
        setCurrentPage(1); // Reset to page 1 when search term changes
        fetchCategories();
      }, 500);

      // Cleanup function
      return () => clearTimeout(handler);
    }
  }, [searchTerm, fetchCategories]); // Added fetchCategories to dependency

  // Separate effect for pagination and itemsPerPage changes (not for search)
  useEffect(() => {
    fetchCategories();
  }, [currentPage, itemsPerPage, fetchCategories]); // Added fetchCategories to dependency

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1); // New trigger function

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
    setError,
    triggerRefresh // Returned new function
  };
};