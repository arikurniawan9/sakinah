// lib/hooks/useCategoryProducts.js
import { useState, useEffect } from 'react';

const useCategoryProducts = (categoryId) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!categoryId) {
      setProducts([]);
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/products?categoryId=${categoryId}`);
        if (!response.ok) {
          throw new Error('Gagal mengambil produk');
        }
        
        const data = await response.json();
        setProducts(data.products || []);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching category products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId]);

  return { products, loading, error };
};

export default useCategoryProducts;