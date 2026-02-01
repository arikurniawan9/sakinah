'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import Breadcrumb from '@/components/Breadcrumb';
import { useState, useEffect } from 'react';
import { useUserTheme } from '@/components/UserThemeContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import { PackageX, Settings, Save, AlertTriangle, Calendar, Clock } from 'lucide-react';

export default function ReturnPolicySettingsPage() {
  const { userTheme } = useUserTheme();
  const [settings, setSettings] = useState({
    allowReturns: true,
    returnPeriodDays: 7,
    requireReason: true,
    requirePhotoEvidence: false,
    autoApprovalThreshold: 50000,
    notifyStaffOnReturn: true,
    notifyManagerOnHighValue: true,
    highValueThreshold: 200000,
    restockFeePercentage: 5,
    policyDescription: 'Kebijakan retur produk berlaku maksimal 7 hari setelah pembelian. Produk harus dalam kondisi asli dan belum digunakan.'
  });

  const breadcrumbItems = [
    { title: 'Admin', href: '/admin' },
    { title: 'Pengaturan', href: '/admin/pengaturan' },
    { title: 'Kebijakan Retur', href: '/admin/pengaturan/retur' }
  ];

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // In a real application, this would save to a database
    console.log('Saving return policy settings:', settings);
    alert('Kebijakan retur produk berhasil disimpan!');
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${userTheme.darkMode ? 'dark' : ''}`}>
        <Breadcrumb items={breadcrumbItems} darkMode={userTheme.darkMode} />
        
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full ${userTheme.darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <Settings className={`h-8 w-8 ${userTheme.darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                Pengaturan Kebijakan Retur Produk
              </h1>
              <p className={`mt-2 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Atur kebijakan dan parameter untuk proses retur produk
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* General Settings */}
            <Card className={userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
              <CardHeader>
                <CardTitle className={userTheme.darkMode ? 'text-white' : 'text-gray-900'}>
                  Pengaturan Umum
                </CardTitle>
                <CardDescription>
                  Konfigurasi dasar untuk proses retur produk
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allowReturns" className="text-base font-medium">
                      Izinkan Retur Produk
                    </Label>
                    <p className={`text-sm ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Aktifkan atau nonaktifkan fitur retur produk
                    </p>
                  </div>
                  <Switch
                    id="allowReturns"
                    checked={settings.allowReturns}
                    onCheckedChange={(checked) => handleChange('allowReturns', checked)}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="returnPeriodDays">
                      Periode Retur (Hari)
                    </Label>
                    <div className="relative mt-1">
                      <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <Input
                        id="returnPeriodDays"
                        type="number"
                        value={settings.returnPeriodDays}
                        onChange={(e) => handleChange('returnPeriodDays', parseInt(e.target.value))}
                        className={`pl-10 ${userTheme.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        min="1"
                        max="365"
                      />
                    </div>
                    <p className={`mt-2 text-sm ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Jumlah hari maksimal pelanggan dapat melakukan retur setelah pembelian
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="restockFeePercentage">
                      Biaya Restok (%)
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="restockFeePercentage"
                        type="number"
                        value={settings.restockFeePercentage}
                        onChange={(e) => handleChange('restockFeePercentage', parseInt(e.target.value))}
                        className={userTheme.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}
                        min="0"
                        max="100"
                      />
                      <span className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        %
                      </span>
                    </div>
                    <p className={`mt-2 text-sm ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Persentase biaya yang dikenakan untuk proses restok produk retur
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requireReason" className="text-base font-medium">
                      Wajibkan Alasan Retur
                    </Label>
                    <p className={`text-sm ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Wajibkan pelanggan memberikan alasan saat melakukan retur
                    </p>
                  </div>
                  <Switch
                    id="requireReason"
                    checked={settings.requireReason}
                    onCheckedChange={(checked) => handleChange('requireReason', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requirePhotoEvidence" className="text-base font-medium">
                      Wajibkan Bukti Foto
                    </Label>
                    <p className={`text-sm ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Wajibkan pelanggan mengunggah foto produk saat retur
                    </p>
                  </div>
                  <Switch
                    id="requirePhotoEvidence"
                    checked={settings.requirePhotoEvidence}
                    onCheckedChange={(checked) => handleChange('requirePhotoEvidence', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className={userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
              <CardHeader>
                <CardTitle className={userTheme.darkMode ? 'text-white' : 'text-gray-900'}>
                  Pengaturan Notifikasi
                </CardTitle>
                <CardDescription>
                  Atur notifikasi untuk berbagai peristiwa retur
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notifyStaffOnReturn" className="text-base font-medium">
                      Notifikasi ke Pelayan
                    </Label>
                    <p className={`text-sm ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Kirim notifikasi ke pelayan ketika retur diajukan
                    </p>
                  </div>
                  <Switch
                    id="notifyStaffOnReturn"
                    checked={settings.notifyStaffOnReturn}
                    onCheckedChange={(checked) => handleChange('notifyStaffOnReturn', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notifyManagerOnHighValue" className="text-base font-medium">
                      Notifikasi Nilai Tinggi
                    </Label>
                    <p className={`text-sm ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Kirim notifikasi khusus untuk retur nilai tinggi
                    </p>
                  </div>
                  <Switch
                    id="notifyManagerOnHighValue"
                    checked={settings.notifyManagerOnHighValue}
                    onCheckedChange={(checked) => handleChange('notifyManagerOnHighValue', checked)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="highValueThreshold">
                    Ambang Batas Nilai Tinggi
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="highValueThreshold"
                      type="number"
                      value={settings.highValueThreshold}
                      onChange={(e) => handleChange('highValueThreshold', parseInt(e.target.value))}
                      className={userTheme.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}
                      min="0"
                    />
                    <span className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      IDR
                    </span>
                  </div>
                  <p className={`mt-2 text-sm ${userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Ambang batas nilai transaksi untuk notifikasi khusus
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Policy Description and Save */}
          <div className="space-y-6">
            <Card className={userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
              <CardHeader>
                <CardTitle className={userTheme.darkMode ? 'text-white' : 'text-gray-900'}>
                  Deskripsi Kebijakan
                </CardTitle>
                <CardDescription>
                  Teks kebijakan yang akan ditampilkan ke pelanggan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={settings.policyDescription}
                  onChange={(e) => handleChange('policyDescription', e.target.value)}
                  placeholder="Deskripsikan kebijakan retur produk..."
                  rows={8}
                  className={userTheme.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}
                />
                <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-blue-500 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-blue-800 dark:text-blue-200">Catatan Penting</h4>
                      <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                        Pastikan kebijakan retur produk sesuai dengan regulasi perlindungan konsumen yang berlaku.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className={userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
              <CardHeader>
                <CardTitle className={userTheme.darkMode ? 'text-white' : 'text-gray-900'}>
                  Simpan Pengaturan
                </CardTitle>
                <CardDescription>
                  Terapkan perubahan kebijakan retur produk
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleSave}
                  className="w-full flex items-center justify-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Simpan Kebijakan</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}