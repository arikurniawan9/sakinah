'use client';

import React from 'react';
import { diff } from 'json-diff';
import { ArrowRight, Edit, Plus, Trash2 } from 'lucide-react';

const formatValue = (value) => {
  if (typeof value === 'boolean') {
    return value ? 'Ya' : 'Tidak';
  }
  if (value === null || value === undefined) {
    return <span className="text-gray-400 dark:text-gray-500 italic">Kosong</span>;
  }
  // Cek apakah string adalah format tanggal yang valid
  const date = new Date(value);
  if (!isNaN(date.getTime()) && typeof value === 'string' && value.includes('T')) {
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'full',
      timeStyle: 'long',
    }).format(date);
  }
  // Cek apakah nilai adalah format harga (string numerik atau angka)
  if (!isNaN(parseFloat(value)) && isFinite(value)) {
    const numberValue = parseFloat(value);
    if (numberValue > 1000) { // Asumsikan angka di atas 1000 kemungkinan adalah harga
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(numberValue);
    }
  }

  return String(value);
};

const renderDiff = (obj) => {
  if (!obj) return null;

  return Object.keys(obj).map((key) => {
    const value = obj[key];
    const isChanged = key.endsWith('__deleted') || key.endsWith('__added');
    const cleanKey = key.replace(/__deleted|__added/, '');
    
    // Mengubah camelCase atau snake_case menjadi kalimat yang bisa dibaca
    const formattedKey = cleanKey
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());

    if (key.endsWith('__deleted')) {
      return (
        <div key={key} className="flex items-start p-2 my-1 bg-red-50 dark:bg-red-900/20 rounded-md">
          <Trash2 className="h-4 w-4 text-red-500 mr-3 flex-shrink-0 mt-1" />
          <div className="flex-grow">
            <strong className="font-semibold text-gray-800 dark:text-gray-200">{formattedKey}:</strong>
            <div className="text-red-600 dark:text-red-400 line-through break-words">
              {formatValue(value)}
            </div>
          </div>
        </div>
      );
    }

    if (key.endsWith('__added')) {
      return (
        <div key={key} className="flex items-start p-2 my-1 bg-green-50 dark:bg-green-900/20 rounded-md">
          <Plus className="h-4 w-4 text-green-500 mr-3 flex-shrink-0 mt-1" />
          <div className="flex-grow">
            <strong className="font-semibold text-gray-800 dark:text-gray-200">{formattedKey}:</strong>
            <div className="text-green-600 dark:text-green-400 break-words">
              {formatValue(value)}
            </div>
          </div>
        </div>
      );
    }
    
    // Handle nested objects for changed values
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const oldValue = value.__old;
        const newValue = value.__new;

        if (oldValue !== undefined && newValue !== undefined) {
             return (
                <div key={key} className="flex items-start p-2 my-1 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                    <Edit className="h-4 w-4 text-yellow-500 mr-3 flex-shrink-0 mt-1" />
                    <div className="flex-grow">
                        <strong className="font-semibold text-gray-800 dark:text-gray-200">{formattedKey}:</strong>
                        <div className="flex items-center space-x-2 text-sm">
                            <span className="text-red-600 dark:text-red-400 line-through break-words">{formatValue(oldValue)}</span>
                            <ArrowRight className="h-4 w-4 text-gray-500" />
                            <span className="text-green-600 dark:text-green-400 break-words">{formatValue(newValue)}</span>
                        </div>
                    </div>
                </div>
            );
        }
    }


    return null; // Don't render unchanged fields
  });
};


const ActivityDiffViewer = ({ oldValue, newValue, entity }) => {
  let oldJson, newJson;
  try {
    oldJson = oldValue ? JSON.parse(oldValue) : {};
    newJson = newValue ? JSON.parse(newValue) : {};
  } catch (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
        <p className="font-bold">Gagal memproses data perubahan.</p>
        <p>Data JSON tidak valid.</p>
      </div>
    );
  }
  
  // Clean up data from Prisma's decimal representation
  const cleanDecimal = (data) => {
    if(data.harga) data.harga = parseFloat(data.harga.toString());
    if(data.purchasePrice) data.purchasePrice = parseFloat(data.purchasePrice.toString());
    if(data.total) data.total = parseFloat(data.total.toString());
    if(data.payment) data.payment = parseFloat(data.payment.toString());
    if(data.change) data.change = parseFloat(data.change.toString());
    if(data.subtotal) data.subtotal = parseFloat(data.subtotal.toString());
    if (data.saleDetails && Array.isArray(data.saleDetails)) {
        data.saleDetails.forEach(detail => {
            if(detail.price) detail.price = parseFloat(detail.price.toString());
            if(detail.subtotal) detail.subtotal = parseFloat(detail.subtotal.toString());
        });
    }
     if (data.items && Array.isArray(data.items)) {
        data.items.forEach(item => {
            if(item.price) item.price = parseFloat(item.price.toString());
            if(item.subtotal) item.subtotal = parseFloat(item.subtotal.toString());
        });
    }
    return data;
  }

  oldJson = cleanDecimal(oldJson);
  newJson = cleanDecimal(newJson);


  const difference = diff(oldJson, newJson, { full: true });

  if (!difference) {
    return (
      <div className="flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400 italic">Tidak ada perubahan data yang terdeteksi.</p>
      </div>
    );
  }

  return <div className="space-y-2">{renderDiff(difference)}</div>;
};

export default ActivityDiffViewer;