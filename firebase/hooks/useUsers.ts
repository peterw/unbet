import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/FirebaseAuthProvider';
import { 
  getCurrentUser, 
  updateCurrentUser as updateUser, 
  resetOnboarding as resetUserOnboarding,
  storeUser 
} from '../services/users';
import { User } from '../types';

// Hook to get current user data
export const useCurrentUser = () => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [authUser]);

  return { user, loading, error };
};

// Hook to store/create user
export const useStoreUser = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const store = async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = await storeUser();
      return userId;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { store, loading, error };
};

// Hook to update current user
export const useUpdateCurrentUser = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateCurrentUser = async (updates: {
    lastRelapseDate?: string;
    recoveryStartDate?: string;
    accountabilityPartner?: string;
    blockedSites?: string[];
  }) => {
    try {
      setLoading(true);
      setError(null);
      const userId = await updateUser(updates);
      return userId;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { updateCurrentUser, loading, error };
};

// Hook to reset onboarding
export const useResetOnboarding = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const resetOnboarding = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await resetUserOnboarding();
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { resetOnboarding, loading, error };
};