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
    const delayDebounceFn = setTimeout(() => {
      setProducts([]); // Clear products on new search
      setPage(1);
      setHasMore(true);
      fetchProducts(true);
    }, 500); // Debounce search input

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
