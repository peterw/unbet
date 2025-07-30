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
  
  // Auto-create user if signed in but user doesn't exist (race-condition-free)
  useEffect(() => {
    // Only proceed if user is explicitly null (not undefined/loading)
    if (isSignedIn && isLoaded && user === null && !isCreatingUser && !creationInProgress.current) {
      // Set flags to prevent concurrent calls
      setIsCreatingUser(true);
      creationInProgress.current = true;
      
      // User is signed in but doesn't exist in Convex - create them
      storeUser()
        .then(() => {
          console.log('User created successfully');
        })
        .catch(error => {
          // If user was already created by another call, that's fine
          console.log('User creation handled or failed:', error);
        })
        .finally(() => {
          // Reset flags regardless of outcome
          setIsCreatingUser(false);
          creationInProgress.current = false;
        });
    }
  }, [isSignedIn, isLoaded, user]); // Remove storeUser from dependencies to prevent re-runs
  
  // Correct loading state calculation
  const isLoading = !isLoaded || (isSignedIn && (user === undefined || isCreatingUser));
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