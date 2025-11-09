// components/kasir/dashboard/ScrollingStockAlert.js
'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

const ScrollingStockAlert = ({ darkMode }) => {
  const [alertProducts, setAlertProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlertProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/produk/low-stock?threshold=20');
      if (!response.ok) {
        throw new Error('Failed to fetch alert stock products');
      }
      const data = await response.json();
      setAlertProducts(data.lowStockProducts);
    } catch (error) {
      console.error('Error fetching alert stock products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertProducts(); // Fetch immediately on mount

    const interval = setInterval(fetchAlertProducts, 30000); // Poll every 30 seconds

    return () => clearInterval(interval); // Clean up on unmount
  }, []);

  if (loading) {
    return (
      <div className={`p-4 rounded-xl shadow border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <p className="text-center text-gray-500">Memuat informasi stok...</p>
      </div>
    );
  }

  if (alertProducts.length === 0) {
    return null; // Don't show anything if no products are below threshold
  }

  const alertText = alertProducts
    .map(p => `${p.name} (Stok: ${p.stock})`)
    .join(' | ');

  // Calculate animation duration based on content length for consistent speed
  const animationDuration = alertText.length * 0.8; // Increased multiplier for slower speed

  return (
    <div className={`relative p-2 rounded-xl shadow border overflow-hidden ${darkMode ? 'bg-red-900/30 border-red-700' : 'bg-red-100 border-red-200'}`}>
      <div className="flex items-center text-red-500 font-semibold text-sm">
        <AlertTriangle className="h-4 w-4 mr-1 flex-shrink-0" />
        <div className="flex-1 whitespace-nowrap overflow-hidden">
          <div className="inline-block animate-marquee" style={{ animationDuration: `${animationDuration}s` }}>
            <span>{alertText}</span>
          </div>
        </div>
      </div>
      <style jsx>{`
        .animate-marquee {
          display: inline-block;
          white-space: nowrap;
          animation: marquee-animation linear infinite;
          animation-delay: 2s; /* Delay before animation starts for each iteration */
        }

        @keyframes marquee-animation {
          0% { transform: translateX(100%); } /* Start off-screen right */
          100% { transform: translateX(-100%); } /* End off-screen left */
        }
      `}</style>
    </div>
  );
};

export default ScrollingStockAlert;
