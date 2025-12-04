'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/storage';
import StudentDashboard from '@/components/student/dashboard';

export default function StudentDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== 'student') {
      router.push('/login/student');
    }
  }, [router]);

  return <StudentDashboard />;
}
