// components/DashboardCustomizationContext.js
'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const DashboardCustomizationContext = createContext();

export const useDashboardCustomization = () => {
  const context = useContext(DashboardCustomizationContext);
  if (!context) {
    throw new Error('useDashboardCustomization must be used within a DashboardCustomizationProvider');
  }
  return context;
};

export const DashboardCustomizationProvider = ({ children }) => {
  const [dashboardLayout, setDashboardLayout] = useState([
    { id: 'sales-chart', type: 'chart', title: 'Grafik Penjualan', visible: true, position: 0 },
    { id: 'stats', type: 'stats', title: 'Statistik Utama', visible: true, position: 1 },
    { id: 'recent-activity', type: 'activity', title: 'Aktivitas Terbaru', visible: true, position: 2 },
    { id: 'recent-stores', type: 'stores', title: 'Toko Terbaru', visible: true, position: 3 },
  ]);

  // Load layout dari localStorage saat komponen dimuat
  useEffect(() => {
    const savedLayout = localStorage.getItem('dashboardLayout');
    if (savedLayout) {
      try {
        setDashboardLayout(JSON.parse(savedLayout));
      } catch (e) {
        console.error('Error parsing dashboard layout from localStorage:', e);
      }
    }
  }, []);

  // Simpan layout ke localStorage saat terjadi perubahan
  useEffect(() => {
    localStorage.setItem('dashboardLayout', JSON.stringify(dashboardLayout));
  }, [dashboardLayout]);

  const updateWidgetVisibility = (widgetId, visible) => {
    setDashboardLayout(prev => 
      prev.map(widget => 
        widget.id === widgetId ? { ...widget, visible } : widget
      )
    );
  };

  const reorderWidgets = (dragIndex, hoverIndex) => {
    setDashboardLayout(prev => {
      const newLayout = [...prev];
      const draggedWidget = newLayout[dragIndex];
      
      // Pindahkan widget
      newLayout.splice(dragIndex, 1);
      newLayout.splice(hoverIndex, 0, draggedWidget);
      
      // Update posisi
      return newLayout.map((widget, index) => ({
        ...widget,
        position: index
      }));
    });
  };

  const resetLayout = () => {
    setDashboardLayout([
      { id: 'sales-chart', type: 'chart', title: 'Grafik Penjualan', visible: true, position: 0 },
      { id: 'stats', type: 'stats', title: 'Statistik Utama', visible: true, position: 1 },
      { id: 'recent-activity', type: 'activity', title: 'Aktivitas Terbaru', visible: true, position: 2 },
      { id: 'recent-stores', type: 'stores', title: 'Toko Terbaru', visible: true, position: 3 },
    ]);
  };

  return (
    <DashboardCustomizationContext.Provider
      value={{
        dashboardLayout,
        updateWidgetVisibility,
        reorderWidgets,
        resetLayout,
      }}
    >
      {children}
    </DashboardCustomizationContext.Provider>
  );
};