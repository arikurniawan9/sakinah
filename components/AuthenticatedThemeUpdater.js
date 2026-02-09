'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTheme } from './ThemeContext';

export default function AuthenticatedThemeUpdater() {
  const { data: session, status } = useSession();
  const { fetchSettings } = useTheme();

  useEffect(() => {
    // Hanya fetch settings jika pengguna sudah login
    if (status === 'authenticated') {
      fetchSettings();
    }
  }, [status, fetchSettings]);

  return null; // Component hanya untuk efek samping, tidak merender apa pun
}