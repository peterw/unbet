import React, { createContext, useContext } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useQuery } from 'convex/react';
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
  
  // Single query - no mutations, no complexity
  const user = useQuery(
    api.users.getCurrentUser,
    isSignedIn && isLoaded ? {} : 'skip'
  );
  
  // Simple state derivation - no side effects
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