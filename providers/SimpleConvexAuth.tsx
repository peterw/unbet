import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
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
  
  // Track if we're currently creating a user to prevent race conditions
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const creationInProgress = useRef(false);
  
  // Read-only query to check if user exists
  const user = useQuery(
    api.users.getCurrentUser,
    isSignedIn && isLoaded ? {} : 'skip'
  );
  
  // Mutation to create user when needed
  const storeUser = useMutation(api.users.store);
  
  // Attempt to create the Convex user once all prerequisites are met
  useEffect(() => {
    // 1. Make sure Clerk is ready and the person is signed in
    if (!isSignedIn || !isLoaded) {
      return;
    }

    // 2. Wait for the Convex query to finish loading
    if (user === undefined) {
      return;
    }

    // 3. If the user already exists in Convex there's nothing to do
    if (user !== null) {
      return;
    }

    // 4. Guard against overlapping create calls
    if (isCreatingUser || creationInProgress.current) {
      return;
    }

    creationInProgress.current = true;
    setIsCreatingUser(true);

    const create = async () => {
      try {
        await storeUser();
        console.log('[SimpleConvexAuth] User created in Convex');
      } catch (err) {
        console.error('[SimpleConvexAuth] Failed to create user in Convex:', err);
      } finally {
        creationInProgress.current = false;
        setIsCreatingUser(false);
      }
    };

    void create();
  }, [isSignedIn, isLoaded, user]); // intentionally omit storeUser to keep dependencies stable
  
  // Correct loading state calculation
  const isLoading = !isLoaded || (isSignedIn && (user === undefined || user === null || isCreatingUser));
  const isAuthenticated = isLoaded && isSignedIn && user !== null && user !== undefined;
  
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