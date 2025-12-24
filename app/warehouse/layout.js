'use client';

import { UserThemeProvider } from '../../components/UserThemeContext';
import { SidebarProvider } from '../../components/SidebarContext';
import { ThemeProvider } from '../../components/ThemeContext';
import Sidebar from '../../components/Sidebar';

export default function WarehouseLayout({ children }) {
  return (
    <UserThemeProvider>
      <ThemeProvider>
        <SidebarProvider>
          <Sidebar>
            {children}
          </Sidebar>
        </SidebarProvider>
      </ThemeProvider>
    </UserThemeProvider>
  );
}