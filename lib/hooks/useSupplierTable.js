// lib/hooks/useSupplierTable.js
import { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { useSession } from 'next-auth/react';

export const useSupplierTable = ({ scope } = {}) => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSuppliers, setTotalSuppliers] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // New refresh trigger
  const { data: session } = useSession();

  const fetchSuppliers = useCallback(async () => { // Wrapped with useCallback
    setLoading(true);
    setError('');
    try {
      let endpoint;
      const cacheBuster = `_=${new Date().getTime()}`; // Cache-busting parameter

      if (scope === 'warehouse') {
        endpoint = `/api/warehouse/suppliers?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(searchTerm)}&${cacheBuster}`;
      } else {
        endpoint = `/api/supplier?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(searchTerm)}&${cacheBuster}`;
      }

      const response = await fetch(endpoint);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal mengambil data supplier');
      }

      const data = await response.json();
      setSuppliers(data.suppliers || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalSuppliers(data.pagination?.total || 0);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError('Terjadi kesalahan saat mengambil data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, session, scope, refreshTrigger]); // Added refreshTrigger to dependencies

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]); // Now depends on the memoized fetchSuppliers function

  // Reset pagination when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1); // New trigger function

  return {
    suppliers,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    totalSuppliers,
    fetchSuppliers,
    setError,
    triggerRefresh // Returned new function
  };
};
