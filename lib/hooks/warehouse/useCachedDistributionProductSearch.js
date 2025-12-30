import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';

// Fetcher function for SWR
const fetcher = (...args) => fetch(...args).then(res => res.json());

export function useCachedDistributionProductSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [products, setProducts] = useState([]);

  // Cache products with SWR
  const { data: apiData, error, isLoading, mutate } = useSWR(
    `/api/warehouse/stock?page=${page}&limit=20&search=${searchTerm}`,
    fetcher,
    {
      // Cache configuration
      refreshInterval: 0, // Don't auto-refresh
      revalidateOnFocus: false, // Don't revalidate when window gains focus
      revalidateOnReconnect: true, // Revalidate when network reconnects
      dedupingInterval: 2000, // Deduplicate requests within 2 seconds
      // Cache for 5 minutes (300000 ms)
      focusThrottleInterval: 5000,
    }
  );

  // Handle API response
  useEffect(() => {
    if (apiData) {
      // If it's the first page, replace all products
      // Otherwise, append to existing products
      setProducts(prev => page === 1 ? apiData.warehouseProducts : [...prev, ...apiData.warehouseProducts]);
      setHasMore(apiData.pagination?.hasMore || false);
    }
  }, [apiData, page]);

  // Function to load more products
  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      setPage(prev => prev + 1);
    }
  }, [hasMore, isLoading]);

  // Function to refresh data
  const refresh = useCallback(() => {
    mutate();
  }, [mutate]);

  // Function to clear search and reset pagination
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setPage(1);
    setProducts([]);
    setHasMore(true);
  }, []);

  // Reset pagination when search term changes
  useEffect(() => {
    setPage(1);
    setProducts([]);
    setHasMore(true);
  }, [searchTerm]);

  return {
    products,
    loading: isLoading,
    error,
    searchTerm,
    setSearchTerm,
    loadMore,
    hasMore,
    refresh,
    clearSearch,
  };
}