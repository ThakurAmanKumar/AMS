'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/storage';
import AdminDashboard from '@/components/admin/dashboard';

export default function AdminDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
      router.push('/login/admin');
    }
  }, [router]);

  return <AdminDashboard />;
}
