// lib/hooks/useProductForm.js
import { useState } from 'react';

const initialFormData = {
  name: '',
  productCode: '',
  stock: '',
  categoryId: '',
  supplierId: '',
  description: '',
  purchasePrice: '',
  retailPrice: '',
  silverPrice: '',
  goldPrice: '',
  platinumPrice: '',
};

export function useProductForm(fetchProductsCallback, optimisticUpdateFunctions = {}) {
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (success) setSuccess('');
  };


  const openModalForEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      productCode: product.productCode,
      stock: product.stock,
      categoryId: product.categoryId,
      supplierId: product.supplierId,
      description: product.description || '',
      purchasePrice: product.purchasePrice,
      retailPrice: product.retailPrice,
      silverPrice: product.silverPrice,
      goldPrice: product.goldPrice,
      platinumPrice: product.platinumPrice,
    });
    setShowModal(true);
  };

  const openModalForCreate = () => {
    setEditingProduct(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData(initialFormData);
    setError('');
    setSuccess('');
  };

  const handleSave = async (onSuccessCallback = null) => {
    if (!formData.name.trim() || !formData.productCode.trim()) {
      setError('Nama dan kode produk harus diisi');
      return;
    }
    if (!formData.categoryId) {
      setError('Kategori harus dipilih');
      return;
    }
    if (!formData.retailPrice) {
      setError('Harga eceran harus diisi');
      return;
    }

    try {
      const method = editingProduct ? 'PUT' : 'POST';
      const endpoint = '/api/produk';

      // Konversi nilai numerik lainnya
      const processedProductData = {
        name: formData.name,
        productCode: formData.productCode,
        stock: parseInt(formData.stock) || 0,
        categoryId: formData.categoryId,
        supplierId: formData.supplierId,
        description: formData.description || '',
        purchasePrice: parseInt(formData.purchasePrice) || 0,
        retailPrice: parseInt(formData.retailPrice) || 0,
        silverPrice: parseInt(formData.silverPrice) || 0,
        goldPrice: parseInt(formData.goldPrice) || 0,
        platinumPrice: parseInt(formData.platinumPrice) || 0,
      };

      const body = editingProduct
        ? { id: editingProduct.id, ...processedProductData }
        : processedProductData;

      // Optimistically update the UI for better UX
      if (!editingProduct) {
        // For new products, we'll add a temporary product to the list
        // This will be replaced by the actual product after successful creation
      }

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || (editingProduct ? 'Gagal mengupdate produk' : 'Gagal menambahkan produk'));
      }

      const resultProduct = await response.json(); // Get the created/updated product

      closeModal();
      if (onSuccessCallback) {
        onSuccessCallback(resultProduct); // Pass the new product to the callback
      } else {
        // Always fetch fresh data after save to ensure consistency
        await fetchProductsCallback();
      }
      setSuccess(editingProduct ? 'Produk berhasil diperbarui' : 'Produk berhasil ditambahkan');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Terjadi kesalahan: ' + err.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  return {
    showModal,
    editingProduct,
    formData,
    error,
    success,
    handleInputChange,
    openModalForEdit,
    openModalForCreate,
    closeModal,
    handleSave,
    setError,
    setSuccess
  };
}
