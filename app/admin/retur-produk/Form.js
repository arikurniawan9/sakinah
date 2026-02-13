'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { useUserTheme } from '@/components/UserThemeContext';
import { PackageX, User, Package, Calendar, AlertCircle, CheckCircle } from 'lucide-react';

export default function ReturnProductForm({ onSubmit, onCancel, initialData = null, isEditing = false }) {
  const { userTheme } = useUserTheme();
  const [formData, setFormData] = useState({
    transactionId: initialData?.transactionId || '',
    productId: initialData?.productId || '',
    productName: initialData?.product?.name || initialData?.productName || '',
    customerName: initialData?.transaction?.member?.name || 'Umum',
    attendantId: initialData?.attendantId || '',
    attendantName: initialData?.attendant?.name || initialData?.attendantName || '',
    reason: initialData?.reason || '',
    category: initialData?.category || 'OTHERS',
    status: initialData?.status || 'PENDING'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Panggil API untuk menyimpan data retur
    try {
      let response;
      let result;
      
      if (isEditing && initialData?.id) {
        // Mode edit
        response = await fetch(`/api/return-products/${initialData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            id: initialData.id // Pastikan ID tidak berubah
          }),
        });
      } else {
        // Mode create
        response = await fetch('/api/return-products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
      }

      result = await response.json();

      if (result.success) {
        onSubmit(result.data); // Kirim data hasil ke parent component
      } else {
        console.error('Error submitting return:', result.message);
        alert(`Gagal menyimpan retur: ${result.message}`);
      }
    } catch (error) {
      console.error('Error submitting return:', error);
      alert('Terjadi kesalahan saat menyimpan retur');
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className={userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
      <CardHeader>
        <CardTitle className={userTheme.darkMode ? 'text-white' : 'text-gray-900'}>
          {isEditing ? 'Edit Retur Produk' : 'Formulir Retur Produk'}
        </CardTitle>
        <CardDescription>
          {isEditing 
            ? 'Edit informasi permintaan retur produk' 
            : 'Isi formulir berikut untuk membuat permintaan retur produk baru'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="transactionId">Nomor Transaksi</Label>
              <div className="relative">
                <Package className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <Input
                  id="transactionId"
                  value={formData.transactionId}
                  onChange={(e) => handleChange('transactionId', e.target.value)}
                  placeholder="Contoh: INV-001"
                  className={`pl-10 ${userTheme.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="productId">ID Produk</Label>
              <div className="relative">
                <Package className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <Input
                  id="productId"
                  value={formData.productId}
                  onChange={(e) => handleChange('productId', e.target.value)}
                  placeholder="Contoh: PROD-001"
                  className={`pl-10 ${userTheme.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="productName">Nama Produk</Label>
              <Input
                id="productName"
                value={formData.productName}
                onChange={(e) => handleChange('productName', e.target.value)}
                placeholder="Nama produk yang diretur"
                className={userTheme.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="customerName">Nama Pelanggan</Label>
              <div className="relative">
                <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => handleChange('customerName', e.target.value)}
                  placeholder="Nama pelanggan"
                  className={`pl-10 ${userTheme.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="attendantId">ID Pelayan</Label>
              <Input
                id="attendantId"
                value={formData.attendantId}
                onChange={(e) => handleChange('attendantId', e.target.value)}
                placeholder="ID pelayan yang melayani"
                className={userTheme.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="attendantName">Nama Pelayan</Label>
              <div className="relative">
                <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <Input
                  id="attendantName"
                  value={formData.attendantName}
                  onChange={(e) => handleChange('attendantName', e.target.value)}
                  placeholder="Nama pelayan yang melayani"
                  className={`pl-10 ${userTheme.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  required
                />
              </div>
            </div>
          </div>
          
          <div>
            <Label htmlFor="category">Kategori Retur</Label>
            <div className={`relative ${userTheme.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} border rounded-md px-3 py-2`}>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className={`w-full bg-transparent outline-none text-sm ${
                  userTheme.darkMode ? 'text-white' : 'text-gray-900'
                } appearance-none`}
              >
                <option value="ERROR_BY_ATTENDANT">Kesalahan Pelayan</option>
                <option value="PRODUCT_DEFECT">Produk Cacat</option>
                <option value="WRONG_SELECTION">Salah Pilih oleh Pelanggan</option>
                <option value="OTHERS">Lainnya</option>
              </select>
              <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none ${
                userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          <div>
            <Label htmlFor="reason">Alasan Retur</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => handleChange('reason', e.target.value)}
              placeholder="Jelaskan alasan produk diretur..."
              rows={3}
              className={userTheme.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
          <Button type="submit">
            {isEditing ? 'Perbarui Retur' : 'Simpan Retur'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}