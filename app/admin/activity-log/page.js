// app/admin/activity-log/page.js
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminActivityLogRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to manager activity log page
    router.push('/manager/activity-log');
  }, [router]);

  return null; // Render nothing since we're redirecting
}