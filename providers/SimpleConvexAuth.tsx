import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface SimpleConvexAuthContextType {
  user: any;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const SimpleConvexAuthContext = createContext<SimpleConvexAuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
});

export const useConvexAuth = () => {
  const context = useContext(SimpleConvexAuthContext);
  if (!context) {
    throw new Error('useConvexAuth must be used within SimpleConvexAuthProvider');
  }
  return context;
};

interface SimpleConvexAuthProviderProps {
  children: React.ReactNode;
}

export function SimpleConvexAuthProvider({ children }: SimpleConvexAuthProviderProps) {
  const { isSignedIn, isLoaded } = useAuth();
  
  // Read-only query to check if user exists
  const user = useQuery(
    api.users.getCurrentUser,
    isSignedIn && isLoaded ? {} : 'skip'
  );
  
  // Mutation to create user when needed
  const storeUser = useMutation(api.users.store);
  
  // Auto-create user if signed in but user doesn't exist
  useEffect(() => {
    if (isSignedIn && isLoaded && user === null) {
      // User is signed in but doesn't exist in Convex - create them
      storeUser().catch(error => {
        // If user was already created by another call, that's fine
        console.log('User creation handled by another call:', error);
      });
    }
  }, [isSignedIn, isLoaded, user, storeUser]);
  
  // Simple state derivation
  const isLoading = isLoaded && isSignedIn && user === undefined;
  const isAuthenticated = isSignedIn && user !== null && user !== undefined;
  
  return (
    <SimpleConvexAuthContext.Provider 
      value={{ 
        user,
        isLoading,
        isAuthenticated,
      }}
    >
      {children}
    </SimpleConvexAuthContext.Provider>
  );
}