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
  const { isSignedIn, isLoaded } = useAuth();
  const user = useQuery(api.users.getCurrentUser);
  const storeUser = useMutation(api.users.store);

  // Create user in Convex if signed in but user doesn't exist
  useEffect(() => {
    const createUserIfNeeded = async () => {
      console.log('[SimpleAuth] Auth state:', { 
        isSignedIn, 
        isLoaded,
        userStatus: user === undefined ? 'loading' : user === null ? 'not exists' : 'exists',
        userId: user?._id 
      });
      
      // Only try to create user if auth is loaded and user query has resolved
      if (isLoaded && isSignedIn && user === null) {
        try {
          console.log('[SimpleAuth] User signed in but not in Convex, creating user...');
          const userId = await storeUser();
          console.log('[SimpleAuth] User created successfully with ID:', userId);
        } catch (error) {
          console.error('[SimpleAuth] Error creating user:', error);
          // Log more details about the error
          if (error && error.toString().includes('authentication')) {
            console.error('[SimpleAuth] Authentication error - Clerk token may not be passed to Convex');
          }
        }
      }
    };

    createUserIfNeeded();
  }, [isSignedIn, isLoaded, user, storeUser]);

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