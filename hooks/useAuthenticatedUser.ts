import { useAuth } from '@/providers/FirebaseAuthProvider';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

/**
 * Hook that ensures user is authenticated and synced
 * Redirects to onboarding if not authenticated
 * Returns the authenticated user once ready
 */
export function useAuthenticatedUser() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If auth is loaded and user doesn't exist, redirect to onboarding
    if (!loading && !user) {
      console.warn('[useAuthenticatedUser] No user found after auth check, redirecting to onboarding');
      router.replace('/onboarding');
    }
  }, [loading, user, router]);

  return {
    user: userData,
    firebaseUser: user,
    isReady: !loading,
    error: null,
    isAuthenticated: !!(user && userData),
  };
}