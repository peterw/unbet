import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface SimpleAuthContextType {
  user: any;
  isLoading: boolean;
}

const SimpleAuthContext = createContext<SimpleAuthContextType>({
  user: null,
  isLoading: true,
});

export const useSimpleAuth = () => {
  const context = useContext(SimpleAuthContext);
  if (!context) {
    throw new Error('useSimpleAuth must be used within SimpleAuthProvider');
  }
  return context;
};

interface SimpleAuthProviderProps {
  children: React.ReactNode;
}

export function SimpleAuthProvider({ children }: SimpleAuthProviderProps) {
  const { isSignedIn } = useAuth();
  const user = useQuery(api.users.getCurrentUser);
  const storeUser = useMutation(api.users.store);

  // Create user in Convex if signed in but user doesn't exist
  useEffect(() => {
    const createUserIfNeeded = async () => {
      if (isSignedIn && user === null) {
        try {
          console.log('[Auth] Creating user in Convex...');
          await storeUser();
        } catch (error) {
          console.error('[Auth] Error creating user:', error);
        }
      }
    };

    createUserIfNeeded();
  }, [isSignedIn, user, storeUser]);

  return (
    <SimpleAuthContext.Provider 
      value={{ 
        user,
        isLoading: user === undefined,
      }}
    >
      {children}
    </SimpleAuthContext.Provider>
  );
}