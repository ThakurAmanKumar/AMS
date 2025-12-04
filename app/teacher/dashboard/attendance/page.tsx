'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/storage';
import MarkAttendance from '@/components/teacher/sections/mark-attendance';

export default function TeacherAttendancePage() {
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== 'teacher') {
      router.push('/login/teacher');
    }
  }, [router]);

  return <MarkAttendance />;
}
