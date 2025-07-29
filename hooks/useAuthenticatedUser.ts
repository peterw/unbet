import { useAuthSync } from '@/providers/AuthSyncProvider';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

/**
 * Hook that ensures user is authenticated and synced
 * Redirects to onboarding if not authenticated
 * Returns the authenticated user once ready
 */
export function useAuthenticatedUser() {
  const { user, isReady, error } = useAuthSync();
  const router = useRouter();

  useEffect(() => {
    // If auth sync failed or user doesn't exist after sync, redirect to onboarding
    if (isReady && !user) {
      console.warn('[useAuthenticatedUser] No user found after auth sync, redirecting to onboarding');
      router.replace('/onboarding');
    }
  }, [isReady, user, router]);

  return {
    user,
    isReady,
    error,
    isAuthenticated: !!(isReady && user),
  };
}