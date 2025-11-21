'use client';

import { UserThemeProvider } from '../../components/UserThemeContext';
import { SidebarProvider } from '../../components/SidebarContext';

export default function KasirLayout({ children }) {
  return (
    <UserThemeProvider>
      <SidebarProvider>
        {children}
      </SidebarProvider>
    </UserThemeProvider>
  );
}
