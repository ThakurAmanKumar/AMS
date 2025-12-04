'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, initializeStorage } from '@/lib/storage';

interface SessionProviderProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'teacher' | 'student';
}

/**
 * SessionProvider: Protects routes and ensures user session is valid
 * - Validates session only on initial mount
 * - Session persists across page reloads and navigation
 * - Only logs out when user explicitly clicks logout
 */
export default function SessionProvider({
  children,
  requiredRole,
}: SessionProviderProps) {
  const router = useRouter();
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasValidated, setHasValidated] = useState(false);

  useEffect(() => {
    // Initialize storage on mount to ensure data is loaded
    if (typeof window !== 'undefined') {
      initializeStorage();
    }
  }, []);

  useEffect(() => {
    // Only validate session once on mount (not on every route change)
    if (hasValidated) return;

    const validateSession = () => {
      try {
        const user = getCurrentUser();
        
        // No user logged in
        if (!user) {
          setIsValid(false);
          setIsLoading(false);
          setHasValidated(true);
          router.replace('/login');
          return;
        }

        // Check if user role matches required role
        if (requiredRole && user.role !== requiredRole) {
          setIsValid(false);
          setIsLoading(false);
          setHasValidated(true);
          router.replace('/login');
          return;
        }

        // Session is valid - keep user logged in
        setIsValid(true);
        setIsLoading(false);
        setHasValidated(true);
      } catch (error) {
        console.error('Session validation error:', error);
        setIsValid(false);
        setIsLoading(false);
        setHasValidated(true);
        router.replace('/login');
      }
    };

    validateSession();
  }, [hasValidated, router, requiredRole]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-white text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-lg font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isValid) {
    return null;
  }

  return <>{children}</>;
}
