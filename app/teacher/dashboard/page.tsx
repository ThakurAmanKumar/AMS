'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/storage';
import TeacherDashboard from '@/components/teacher/dashboard';

export default function TeacherDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== 'teacher') {
      router.push('/login/teacher');
    }
  }, [router]);

  return <TeacherDashboard />;
}
