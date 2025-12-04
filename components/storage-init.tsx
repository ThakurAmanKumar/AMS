'use client';

import { useEffect } from 'react';
import { initializeStorage } from '@/lib/storage';

export default function StorageInit() {
  useEffect(() => {
    initializeStorage();
  }, []);

  return null;
}
