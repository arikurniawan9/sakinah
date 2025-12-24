// lib/hooks/useWarehouseStockForm.js
import { useState } from 'react';
import { toast } from 'react-toastify';

export const useWarehouseStockForm = (fetchStocks) => {
  const [showModal, setShowModal] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 0,
    reserved: 0
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const openModalForEdit = (stock) => {
    setEditingStock(stock);
    setFormData({
      productId: stock.productId || '',
      quantity: stock.quantity || 0,
      reserved: stock.reserved || 0
    });
    setShowModal(true);
  };

  const openModalForCreate = () => {
    setEditingStock(null);
    setFormData({
      productId: '',
      quantity: 0,
      reserved: 0
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingStock(null);
    setFormData({
      productId: '',
      quantity: 0,
      reserved: 0
    });
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    try {
      if (!formData.quantity || formData.quantity <= 0) {
        setError('Jumlah stok harus lebih besar dari 0');
        return;
      }

      setLoading(true);

      const url = editingStock 
        ? `/api/warehouse/stock/${editingStock.id}` 
        : '/api/warehouse/stock';
      
      const method = editingStock ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ...(editingStock && { id: editingStock.id }) // Include ID for updates
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || (editingStock ? 'Gagal mengupdate stok' : 'Gagal menambahkan stok'));
      }

      toast.success(editingStock ? 'Stok berhasil diupdate' : 'Stok berhasil ditambahkan');
      fetchStocks(); // Refresh the list
      closeModal();
    } catch (err) {
      setError(err.message);
      toast.error(`Gagal: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return {
    showModal,
    editingStock,
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
};