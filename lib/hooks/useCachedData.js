// lib/hooks/useCachedData.js
import { useState, useEffect } from 'react';
import useSWR from 'swr';

const fetcher = (...args) => fetch(...args).then(res => res.json());

export function useCachedCategories() {
  const { data, error, isLoading, mutate } = useSWR('/api/kategori?limit=100', fetcher);

  return {
    categories: data?.categories || [],
    loading: isLoading,
    error,
    mutate
  };
}

export function useCachedSuppliers() {
  const { data, error, isLoading, mutate } = useSWR('/api/supplier?limit=100', fetcher);

  return {
    suppliers: data?.suppliers || [],
    loading: isLoading,
    error,
    mutate
  };
}

export function useCachedProducts(params = {}) {
  // Membangun URL dengan parameter
  const queryParams = new URLSearchParams(params);
  const url = `/api/produk?${queryParams.toString()}`;
  
  const { data, error, isLoading, mutate } = useSWR(url, fetcher);

  return {
    products: data?.products || [],
    pagination: data?.pagination || {},
    loading: isLoading,
    error,
    mutate
  };
}