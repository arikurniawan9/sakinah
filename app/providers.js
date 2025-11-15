// app/providers.js
'use client';

import { SessionProvider } from 'next-auth/react';
import { DarkModeProvider } from '@/components/DarkModeContext'; // Import DarkModeProvider
import { ThemeProvider } from '@/components/ThemeContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import NotificationProvider from '@/components/NotificationProvider';

export function Providers({ children }) {
  return (
    <ErrorBoundary>
      <DarkModeProvider>
        <ThemeProvider>
          <NotificationProvider>
            <SessionProvider>{children}</SessionProvider>
          </NotificationProvider>
        </ThemeProvider>
      </DarkModeProvider>
    </ErrorBoundary>
  );
}