// components/admin/ExpenseForm.js
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export default function ExpenseForm({ 
  expense = null, 
  onSave, 
  onCancel, 
  darkMode = false,
  expenseCategories = []
}) {
  const [formData, setFormData] = useState({
    expenseCategoryId: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (expense) {
      setFormData({
        expenseCategoryId: expense.expenseCategoryId || '',
        amount: expense.amount || '',
        description: expense.description || '',
        date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
    } else {
      // Reset form for new expense
      setFormData({
        expenseCategoryId: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
    }
  }, [expense]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.expenseCategoryId) {
      newErrors.expenseCategoryId = 'Kategori pengeluaran wajib dipilih';
    }

    if (!formData.amount) {
      newErrors.amount = 'Jumlah pengeluaran wajib diisi';
    } else if (isNaN(formData.amount) || formData.amount <= 0) {
      newErrors.amount = 'Jumlah pengeluaran harus lebih besar dari 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Harap perbaiki kesalahan dalam formulir');
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...expense,
        ...formData,
        amount: parseInt(formData.amount)
      };

      const result = await onSave(submitData);
      if (result) {
        toast.success(expense ? 'Pengeluaran berhasil diperbarui' : 'Pengeluaran berhasil ditambahkan');
        setFormData({
          expenseCategoryId: '',
          amount: '',
          description: '',
          date: new Date().toISOString().split('T')[0]
        });
        setErrors({});
      }
    } catch (err) {
      console.error('Error submitting expense:', err);
      toast.error(`Gagal ${expense ? 'memperbarui' : 'menyimpan'} pengeluaran`);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
    darkMode 
      ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500' 
      : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
  }`;

  const labelClass = `block text-sm font-medium mb-1 ${
    darkMode ? 'text-gray-300' : 'text-gray-700'
  }`;

  return (
    <form onSubmit={handleSubmit} className={`p-6 rounded-lg shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        {expense ? 'Edit Pengeluaran' : 'Tambah Pengeluaran Baru'}
      </h3>

      <div className="space-y-4">
        <div>
          <label className={labelClass}>Kategori *</label>
          <select
            name="expenseCategoryId"
            value={formData.expenseCategoryId}
            onChange={handleChange}
            className={`${inputClass} ${errors.expenseCategoryId ? 'border-red-500' : ''}`}
          >
            <option value="">Pilih Kategori</option>
            {expenseCategories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.expenseCategoryId && (
            <p className="mt-1 text-sm text-red-500">{errors.expenseCategoryId}</p>
          )}
        </div>

        <div>
          <label className={labelClass}>Jumlah (Rp) *</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            className={`${inputClass} ${errors.amount ? 'border-red-500' : ''}`}
            placeholder="0"
            min="1"
          />
          {errors.amount && (
            <p className="mt-1 text-sm text-red-500">{errors.amount}</p>
          )}
        </div>

        <div>
          <label className={labelClass}>Tanggal</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Deskripsi</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={inputClass}
            rows="3"
            placeholder="Deskripsi pengeluaran (opsional)"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            darkMode 
              ? 'bg-gray-600 text-white hover:bg-gray-500' 
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={loading}
          className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
            loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Menyimpan...' : expense ? 'Perbarui' : 'Simpan'}
        </button>
      </div>
    </form>
  );
}