'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { initializeStorage, getCurrentUser } from '@/lib/storage';
import LandingPage from '@/components/landing-page';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    initializeStorage();
    const user = getCurrentUser();
    if (user) {
      router.push(`/${user.role}/dashboard`);
    }
  }, [router]);

  return <LandingPage />;
}
