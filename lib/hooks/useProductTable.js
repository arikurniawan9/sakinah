// lib/hooks/useProductTable.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import useSWR from 'swr';

const fetcher = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Gagal mengambil data produk');
  }
  return response.json();
};

export function useProductTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [currentPage, setCurrentPage] = useState(1);

  // State untuk filter tambahan
  const [categoryFilter, setCategoryFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [minStock, setMinStock] = useState('');
  const [maxStock, setMaxStock] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Membangun query parameter untuk SWR key
  const queryParams = useMemo(() => {
    const params = new URLSearchParams({
      page: currentPage,
      limit: itemsPerPage,
      search: searchTerm
    });

    if (categoryFilter) params.append('category', categoryFilter);
    if (supplierFilter) params.append('supplier', supplierFilter);
    if (minStock) params.append('minStock', minStock);
    if (maxStock) params.append('maxStock', maxStock);
    if (minPrice) params.append('minPrice', minPrice);
    if (maxPrice) params.append('maxPrice', maxPrice);

    return params.toString();
  }, [currentPage, itemsPerPage, searchTerm, categoryFilter, supplierFilter, minStock, maxStock, minPrice, maxPrice]);

  const apiUrl = `/api/produk?${queryParams}`;

  const { data, error, isLoading, isValidating, mutate } = useSWR(apiUrl, fetcher, {
    keepPreviousData: true, // Very important for performance during pagination/filtering
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });

  const products = data?.products || [];
  const totalPages = data?.pagination?.totalPages || 1;
  const totalProducts = data?.pagination?.totalItems || 0;

  const fetchProducts = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        // Create a temporary URL with refresh=true to bypass server cache
        const refreshUrl = `/api/produk?${queryParams}&refresh=true`;
        const response = await fetch(refreshUrl);
        if (response.ok) {
          const newData = await response.json();
          // Update SWR cache with fresh data and revalidate
          await mutate(newData, false);
          // Trigger revalidation to ensure cache consistency
          await mutate();
        } else {
          // Fallback to normal revalidation
          await mutate();
        }
      } else {
        // Trigger revalidation normally
        await mutate();
      }
    } catch (err) {
      console.error('Error during manual refresh:', err);
      // Even if fetch fails, mutate can try to revalidate via SWR's mechanism
      await mutate();
    }
  }, [mutate, queryParams]);

  // Reset pagination when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, supplierFilter, minStock, maxStock, minPrice, maxPrice]);

  // Optimistic updates are easier with SWR's mutate
  const removeProductsOptimistic = useCallback(async (idsToRemove) => {
    await mutate(
      (currentData) => {
        if (!currentData) return currentData;
        return {
          ...currentData,
          products: currentData.products.filter(p => !idsToRemove.includes(p.id)),
          pagination: {
            ...currentData.pagination,
            totalItems: Math.max(0, currentData.pagination.totalItems - idsToRemove.length)
          }
        };
      },
      false // Revalidate = false because we just want to update local state
    );
  }, [mutate]);

  const addProductOptimistic = useCallback(async (newProduct) => {
    await mutate(); // For simplicity, just refetch, or do a complex merge if needed
  }, [mutate]);

  const updateProductOptimistic = useCallback(async (updatedProduct) => {
    await mutate(
      (currentData) => {
        if (!currentData) return currentData;
        return {
          ...currentData,
          products: currentData.products.map(p => p.id === updatedProduct.id ? { ...p, ...updatedProduct } : p)
        };
      },
      false
    );
  }, [mutate]);

  // Fungsi untuk mengatur filter
  const handleCategoryFilter = useCallback((value) => setCategoryFilter(value), []);
  const handleSupplierFilter = useCallback((value) => setSupplierFilter(value), []);
  const handleMinStockFilter = useCallback((value) => setMinStock(value), []);
  const handleMaxStockFilter = useCallback((value) => setMaxStock(value), []);
  const handleMinPriceFilter = useCallback((value) => setMinPrice(value), []);
  const handleMaxPriceFilter = useCallback((value) => setMaxPrice(value), []);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setCategoryFilter('');
    setSupplierFilter('');
    setMinStock('');
    setMaxStock('');
    setMinPrice('');
    setMaxPrice('');
  }, []);

  const hasActiveFilters = searchTerm || categoryFilter || supplierFilter || minStock || maxStock || minPrice || maxPrice;

  return {
    products,
    loading: isLoading,
    validating: isValidating,
    error: error?.message || '',
    searchTerm,
    setSearchTerm,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    totalProducts,
    fetchProducts,
    mutate,
    removeProductsOptimistic,
    addProductOptimistic,
    updateProductOptimistic,
    categoryFilter,
    supplierFilter,
    minStock,
    maxStock,
    minPrice,
    maxPrice,
    handleCategoryFilter,
    handleSupplierFilter,
    handleMinStockFilter,
    handleMaxStockFilter,
    handleMinPriceFilter,
    handleMaxPriceFilter,
    clearFilters,
    hasActiveFilters
  };
}
