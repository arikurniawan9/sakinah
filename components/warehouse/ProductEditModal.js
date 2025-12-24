import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';

const ProductEditModal = ({ 
  isOpen, 
  onClose, 
  product, 
  onSave,
  darkMode = false,
  categories = [],
  suppliers = []
}) => {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    name: '',
    productCode: '',
    categoryId: '',
    supplierId: '',
    stock: '',
    purchasePrice: '',
    retailPrice: '',
    silverPrice: '',
    goldPrice: '',
    platinumPrice: '',
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        productCode: product.productCode || '',
        categoryId: product.categoryId || '',
        supplierId: product.supplierId || '',
        stock: product.stock || 0,
        purchasePrice: product.purchasePrice || 0,
        retailPrice: product.retailPrice || 0,
        silverPrice: product.silverPrice || 0,
        goldPrice: product.goldPrice || 0,
        platinumPrice: product.platinumPrice || 0,
        description: product.description || ''
      });
    } else {
      setFormData({
        name: '',
        productCode: '',
        categoryId: '',
        supplierId: '',
        stock: '',
        purchasePrice: '',
        retailPrice: '',
        silverPrice: '',
        goldPrice: '',
        platinumPrice: '',
        description: ''
      });
    }
    setErrors({});
  }, [product]);

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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nama produk wajib diisi';
    }

    if (!formData.productCode.trim()) {
      newErrors.productCode = 'Kode produk wajib diisi';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Kategori wajib dipilih';
    }

    if (!formData.supplierId) {
      newErrors.supplierId = 'Supplier wajib dipilih';
    }

    if (isNaN(Number(formData.purchasePrice)) || Number(formData.purchasePrice) < 0) {
      newErrors.purchasePrice = 'Harga beli harus berupa angka positif';
    }

    if (isNaN(Number(formData.retailPrice)) || Number(formData.retailPrice) < 0) {
      newErrors.retailPrice = 'Harga eceran harus berupa angka positif';
    }

    if (isNaN(Number(formData.silverPrice)) || Number(formData.silverPrice) < 0) {
      newErrors.silverPrice = 'Harga silver harus berupa angka positif';
    }

    if (isNaN(Number(formData.goldPrice)) || Number(formData.goldPrice) < 0) {
      newErrors.goldPrice = 'Harga gold harus berupa angka positif';
    }

    if (isNaN(Number(formData.platinumPrice)) || Number(formData.platinumPrice) < 0) {
      newErrors.platinumPrice = 'Harga platinum harus berupa angka positif';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSave({
        ...formData,
        id: product?.id,
        stock: Number(formData.stock),
        purchasePrice: Number(formData.purchasePrice),
        retailPrice: Number(formData.retailPrice),
        silverPrice: Number(formData.silverPrice),
        goldPrice: Number(formData.goldPrice),
        platinumPrice: Number(formData.platinumPrice)
      });
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`p-6 rounded-t-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex justify-between items-center">
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {product ? 'Edit Produk' : 'Tambah Produk Baru'}
            </h2>
            <button
              onClick={onClose}
              className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nama Produk */}
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Nama Produk *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.name 
                    ? 'border-red-500' 
                    : darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Masukkan nama produk"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Kode Produk */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Kode Produk *
              </label>
              <input
                type="text"
                name="productCode"
                value={formData.productCode}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.productCode 
                    ? 'border-red-500' 
                    : darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Kode produk"
                disabled={!!product?.id} // Disable if editing existing product
              />
              {errors.productCode && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.productCode}
                </p>
              )}
            </div>

            {/* Kategori */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Kategori *
              </label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.categoryId 
                    ? 'border-red-500' 
                    : darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">Pilih Kategori</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.categoryId}
                </p>
              )}
            </div>

            {/* Supplier */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Supplier *
              </label>
              <select
                name="supplierId"
                value={formData.supplierId}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.supplierId 
                    ? 'border-red-500' 
                    : darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">Pilih Supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              {errors.supplierId && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.supplierId}
                </p>
              )}
            </div>

            {/* Stok */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Stok
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="0"
              />
            </div>

            {/* Harga Beli */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Harga Beli *
              </label>
              <input
                type="number"
                name="purchasePrice"
                value={formData.purchasePrice}
                onChange={handleChange}
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.purchasePrice 
                    ? 'border-red-500' 
                    : darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="0"
              />
              {errors.purchasePrice && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.purchasePrice}
                </p>
              )}
            </div>

            {/* Harga Eceran */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Harga Eceran
              </label>
              <input
                type="number"
                name="retailPrice"
                value={formData.retailPrice}
                onChange={handleChange}
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.retailPrice 
                    ? 'border-red-500' 
                    : darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="0"
              />
              {errors.retailPrice && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.retailPrice}
                </p>
              )}
            </div>

            {/* Harga Silver */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Harga Silver
              </label>
              <input
                type="number"
                name="silverPrice"
                value={formData.silverPrice}
                onChange={handleChange}
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.silverPrice 
                    ? 'border-red-500' 
                    : darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="0"
              />
              {errors.silverPrice && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.silverPrice}
                </p>
              )}
            </div>

            {/* Harga Gold */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Harga Gold
              </label>
              <input
                type="number"
                name="goldPrice"
                value={formData.goldPrice}
                onChange={handleChange}
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.goldPrice 
                    ? 'border-red-500' 
                    : darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="0"
              />
              {errors.goldPrice && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.goldPrice}
                </p>
              )}
            </div>

            {/* Harga Platinum */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Harga Platinum
              </label>
              <input
                type="number"
                name="platinumPrice"
                value={formData.platinumPrice}
                onChange={handleChange}
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.platinumPrice 
                    ? 'border-red-500' 
                    : darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="0"
              />
              {errors.platinumPrice && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.platinumPrice}
                </p>
              )}
            </div>

            {/* Deskripsi */}
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Deskripsi
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Deskripsi produk (opsional)"
              />
            </div>
          </div>

          <div className={`mt-6 flex justify-end space-x-3 rounded-b-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} p-4`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg ${
                darkMode 
                  ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded-lg flex items-center ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductEditModal;