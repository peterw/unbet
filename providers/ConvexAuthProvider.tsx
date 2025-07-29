import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';

interface ConvexAuthContextType {
  user: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  retryAuth: () => void;
}

const ConvexAuthContext = createContext<ConvexAuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
  retryAuth: () => {},
});

export const useConvexAuth = () => {
  const context = useContext(ConvexAuthContext);
  if (!context) {
    throw new Error('useConvexAuth must be used within ConvexAuthProvider');
  }
  return context;
};

interface ConvexAuthProviderProps {
  children: React.ReactNode;
}

export function ConvexAuthProvider({ children }: ConvexAuthProviderProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const [authAttempts, setAuthAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Query user with retry logic
  const user = useQuery(
    api.users.getCurrentUser,
    // Only query if signed in
    isSignedIn ? {} : 'skip'
  );
  
  const storeUser = useMutation(api.users.store);

  const createOrGetUser = async () => {
    if (!isLoaded || !isSignedIn) {
      console.log('[ConvexAuth] Not ready to create user:', { isLoaded, isSignedIn });
      return;
    }

    // User query is still loading
    if (user === undefined) {
      console.log('[ConvexAuth] User query still loading...');
      return;
    }

    // User exists
    if (user !== null) {
      console.log('[ConvexAuth] User exists:', user._id);
      setError(null);
      return;
    }

    // User doesn't exist, try to create
    try {
      console.log('[ConvexAuth] Creating user in Convex...');
      const userId = await storeUser();
      console.log('[ConvexAuth] User created:', userId);
      setError(null);
      setAuthAttempts(0);
    } catch (err) {
      console.error('[ConvexAuth] Failed to create user:', err);
      setError('Failed to authenticate. Please try signing out and back in.');
      
      // Retry a few times
      if (authAttempts < 3) {
        setTimeout(() => {
          setAuthAttempts(prev => prev + 1);
        }, 2000);
      }
    }
  };

  useEffect(() => {
    createOrGetUser();
  }, [isLoaded, isSignedIn, user, authAttempts]);

  const retryAuth = () => {
    setAuthAttempts(prev => prev + 1);
    setError(null);
  };

  // Show loading state while auth is initializing
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#5B7FDE" />
        <Text style={{ marginTop: 16, color: '#FFF', fontSize: 16 }}>Initializing...</Text>
      </View>
    );
  }

  // Show error state if authentication failed
  if (error && isSignedIn) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', padding: 20 }}>
        <Text style={{ color: '#FF6B6B', fontSize: 18, textAlign: 'center', marginBottom: 20 }}>{error}</Text>
        <TouchableOpacity
          style={{ backgroundColor: '#5B7FDE', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
          onPress={retryAuth}
        >
          <Text style={{ color: '#FFF', fontSize: 16 }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isAuthenticated = isSignedIn && user !== null && user !== undefined;
  const isLoading = isSignedIn && user === undefined;

  return (
    <ConvexAuthContext.Provider 
      value={{ 
        user,
        isLoading,
        isAuthenticated,
        error,
        retryAuth,
      }}
    >
      {children}
    </ConvexAuthContext.Provider>
  );
}