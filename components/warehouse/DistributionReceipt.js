'use client';

import React, { forwardRef } from 'react';
import { useUserTheme } from '../UserThemeContext';

const DistributionReceipt = forwardRef(({ distributionData }, ref) => {
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;

  if (!distributionData) {
    return (
      <div
        ref={ref}
        className={`max-w-[76mm] mx-auto p-2 ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'} print:bg-white print:text-black print-content`}
        style={{
          fontFamily: '"Courier New", Courier, monospace',
          width: '76mm',
          maxWidth: '76mm',
          margin: '0 auto',
          padding: '4px',
          boxSizing: 'border-box',
          fontSize: '10px',
          lineHeight: '1.2',
          printColorAdjust: 'exact',
          WebkitPrintColorAdjust: 'exact'
        }}
      >
        <div className="text-center">
          <p>Data distribusi tidak tersedia</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  let allItems = [];

  if (distributionData.items && Array.isArray(distributionData.items) && distributionData.items.length > 0) {
    allItems = distributionData.items;
  } else if (distributionData.items && Array.isArray(distributionData.items) && distributionData.items.length === 0) {
    allItems = [];
  } else {
    allItems = [distributionData];
  }

  return (
    <div
      ref={ref}
      className={`max-w-[76mm] mx-auto p-2 ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'} print:bg-white print:text-black print-content`}
      style={{
        fontFamily: '"Courier New", Courier, monospace',
        width: '76mm',
        maxWidth: '76mm',
        margin: '0 auto',
        padding: '4px',
        boxSizing: 'border-box',
        fontSize: '10px',
        lineHeight: '1.2',
        printColorAdjust: 'exact',
        WebkitPrintColorAdjust: 'exact'
      }}
    >
      <div className="text-center mb-2">
        <h1 className="text-sm font-bold mb-1">STRUK DISTRIBUSI PRODUK</h1>
        <p className="text-xs">SAKINAH</p>
        <p className="text-xs">Jl. Raya No. 123, Kota Anda</p>
        <p className="text-xs">Telp: 0812-3456-7890</p>
      </div>

      <div className="my-2 border-t border-b border-gray-300 py-1">
        <div className="flex justify-between text-xs">
          <span>No. Faktur</span>
          <span>{distributionData?.invoiceNumber || distributionData?.id || 'N/A'}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>Tanggal</span>
          <span>{distributionData.distributedAt || distributionData.createdAt ? formatDate(distributionData.distributedAt || distributionData.createdAt) : 'N/A'}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>Gudang</span>
          <span>{distributionData?.warehouse?.name || 'Gudang Pusat'}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>Toko Tujuan</span>
          <span>{distributionData?.store?.name || distributionData?.storeName || 'N/A'}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>Pelayan Gudang</span>
          <span>
            {distributionData?.distributedByUser?.name || distributionData?.distributedByName || 'N/A'}
            {distributionData?.distributedByUser?.employeeNumber && ` (${distributionData.distributedByUser.employeeNumber})`}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span>Status</span>
          <span>
            {distributionData?.status === 'PENDING_ACCEPTANCE' ? 'Menunggu Konfirmasi' :
             distributionData?.status === 'ACCEPTED' ? 'Diterima' :
             distributionData?.status === 'REJECTED' ? 'Ditolak' : distributionData?.status || 'N/A'}
          </span>
        </div>
      </div>

      <div className="my-2">
        <h2 className="font-bold text-xs mb-1">DAFTAR PRODUK</h2>
        <div className="space-y-0.5">
          {allItems && allItems.length > 0 ? allItems.map((item, index) => {
            const itemTotal = (item?.quantity || 0) * (item?.unitPrice || 0);
            return (
              <div key={index} className="flex justify-between text-xs">
                <div className="flex-1 min-w-0">
                  <div className="truncate">{item?.product?.name || item?.productName || item?.name || 'Produk Tidak Dikenal'}</div>
                  <div className="text-gray-500 dark:text-gray-400 text-[8px]">
                    {item?.product?.productCode || item?.productCode || 'N/A'}
                  </div>
                </div>
                <div className="text-right ml-1">
                  <div>{item?.quantity?.toLocaleString('id-ID')} x Rp {(item?.unitPrice || 0).toLocaleString('id-ID')}</div>
                  <div className="font-bold">Rp {itemTotal.toLocaleString('id-ID')}</div>
                </div>
              </div>
            );
          }) : (
            <div className="text-center text-xs text-gray-500">Tidak ada item dalam distribusi ini</div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-300 pt-1">
        <div className="flex justify-between font-bold text-xs">
          <span>Total Barang:</span>
          <span>
            {allItems && allItems.length > 0 ? allItems.reduce((sum, item) => sum + (item?.quantity || 0), 0).toLocaleString('id-ID') : '0'}
          </span>
        </div>
        <div className="flex justify-between font-bold text-sm">
          <span>Total Harga:</span>
          <span>
            Rp {allItems && allItems.length > 0 ? allItems.reduce((sum, item) => sum + ((item?.quantity || 0) * (item?.unitPrice || 0)), 0).toLocaleString('id-ID') : '0'}
          </span>
        </div>
      </div>

      {distributionData?.notes && (
        <div className="mt-2 pt-1 border-t border-gray-300">
          <div className="text-xs">
            <strong>Catatan:</strong> {distributionData.notes}
          </div>
        </div>
      )}

      <div className="mt-3 text-center text-xs">
        <p>Terima kasih atas kepercayaan Anda</p>
        <p className="mt-1">Dicetak: {formatDate(new Date().toISOString())}</p>
      </div>
    </div>
  );
});

DistributionReceipt.displayName = 'DistributionReceipt';

export default DistributionReceipt;
