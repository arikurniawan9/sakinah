// lib/hooks/useReceivableTable.js
'use client';

import { useState, useEffect, useCallback } from 'react';

export function useReceivableTable() {
  const [receivables, setReceivables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalReceivables, setTotalReceivables] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchReceivables = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // The API doesn't support pagination or search yet, so we'll do it client-side for now.
      // This should be updated later to use API-side filtering for performance.
      const response = await fetch('/api/laporan/piutang');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal mengambil data piutang');
      }
      const data = await response.json();
      
      // Client-side filtering
      const filtered = data.receivables.filter(item => 
        item.member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sale.id.toLowerCase().includes(searchTerm.toLowerCase())
      );

      setTotalReceivables(filtered.length);
      setTotalPages(Math.ceil(filtered.length / itemsPerPage));
      
      // Client-side pagination
      const paginated = filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      );

      setReceivables(paginated);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchReceivables();
  }, [fetchReceivables]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  return {
    receivables,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    totalReceivables,
    fetchReceivables,
    setError,
  };
}
