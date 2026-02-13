// components/pelayan/BottomNavigation.js
'use client';

import React from 'react';
import { Home, History, Bell, User, Scan } from 'lucide-react';
import { motion } from 'framer-motion';

const BottomNavigation = ({ 
  activeTab, 
  setActiveTab, 
  onScanClick, 
  darkMode,
  notificationCount = 0 
}) => {
  const tabs = [
    { id: 'home', label: 'Utama', icon: Home },
    { id: 'history', label: 'Riwayat', icon: History },
    { id: 'scan', label: 'Scan', icon: Scan, isSpecial: true },
    { id: 'notifications', label: 'Pesan', icon: Bell, badge: notificationCount },
    { id: 'profile', label: 'Profil', icon: User },
  ];

  return (
    <div className={`md:hidden fixed bottom-0 left-0 right-0 z-[100] px-4 pb-4 pt-2 ${
      darkMode ? 'bg-gray-900/80 backdrop-blur-lg border-t border-gray-800' : 'bg-white/80 backdrop-blur-lg border-t border-gray-200'
    }`}>
      <div className="flex items-center justify-between max-w-md mx-auto relative">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isSpecial) {
            return (
              <div key={tab.id} className="relative -top-8 flex flex-col items-center">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onScanClick}
                  className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl ${
                    darkMode 
                      ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white' 
                      : 'bg-gradient-to-tr from-purple-500 to-indigo-500 text-white'
                  } ring-4 ${darkMode ? 'ring-gray-900' : 'ring-white'}`}
                >
                  <Scan className="h-8 w-8" />
                </motion.button>
                <span className={`text-[10px] font-bold mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {tab.label}
                </span>
              </div>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center justify-center w-12 py-1 relative"
            >
              <div className={`transition-all duration-300 ${
                isActive 
                  ? 'text-purple-600 dark:text-purple-400 scale-110' 
                  : 'text-gray-400 dark:text-gray-500'
              }`}>
                <Icon className="h-6 w-6" />
                {tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] flex items-center justify-center border-2 border-white dark:border-gray-900">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 font-medium ${
                isActive 
                  ? 'text-purple-600 dark:text-purple-400' 
                  : 'text-gray-400 dark:text-gray-500'
              }`}>
                {tab.label}
              </span>
              
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-1 w-1 h-1 bg-purple-600 dark:bg-purple-400 rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
