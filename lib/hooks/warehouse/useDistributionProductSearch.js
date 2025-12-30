import { useState, useEffect, useCallback } from 'react';

export function useDistributionProductSearch() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchProducts = useCallback(async (isNewSearch) => {
    if (loading) return;
    setLoading(true);
    setError(null);

    const currentPage = isNewSearch ? 1 : page;

    try {
      const response = await fetch(`/api/warehouse/stock?page=${currentPage}&limit=20&search=${searchTerm}`);
      if (!response.ok) {
        throw new Error('Gagal mengambil data produk');
      }
      const data = await response.json();

      setProducts(prev => isNewSearch ? data.warehouseProducts : [...prev, ...data.warehouseProducts]);
      setHasMore(data.pagination.hasMore);
      if (!data.pagination.hasMore) {
        setPage(data.pagination.totalPages);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, page, loading]);

  useEffect(() => {
    // Calculate debounce delay based on search term length and type
    let delay = 500; // Default delay

    // If search term is short (1-2 chars), use longer delay to avoid too many requests
    if (searchTerm.length <= 2) {
      delay = 800;
    }
    // If search term is longer, use shorter delay for more responsive search
    else if (searchTerm.length >= 5) {
      delay = 300;
    }

    // If search term is empty, use minimal delay
    if (!searchTerm || searchTerm.length === 0) {
      delay = 100;
    }

    const delayDebounceFn = setTimeout(() => {
      setProducts([]); // Clear products on new search
      setPage(1);
      setHasMore(true);
      fetchProducts(true);
    }, delay); // Smart debounce based on search term

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage(prevPage => prevPage + 1);
    }
  };

  useEffect(() => {
    if (page > 1) {
      fetchProducts(false);
    }
  }, [page]);


  return {
    products,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    loadMore,
    hasMore,
  };
}
