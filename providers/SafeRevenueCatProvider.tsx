import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { isExpoGo } from '@/utils/isExpoGo';

interface RevenueCatContextType {
  user: any;
  packages: any;
  purchasePackage: (packageId: string) => Promise<{ success: boolean }>;
  isLoading: boolean;
  error: string | null;
}

const RevenueCatContext = createContext<RevenueCatContextType>({
  user: null,
  packages: null,
  purchasePackage: async () => ({ success: false }),
  isLoading: false,
  error: null,
});

export const useRevenueCat = () => {
  const context = useContext(RevenueCatContext);
  if (!context) {
    throw new Error('useRevenueCat must be used within RevenueCatProvider');
  }
  return context;
};

interface RevenueCatProviderProps {
  children: React.ReactNode;
}

export function RevenueCatProvider({ children }: RevenueCatProviderProps) {
  const [user, setUser] = useState(null);
  const [packages, setPackages] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Safe purchase function that won't crash
  const purchasePackage = async (packageId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // In Expo Go, just return mock success
      if (isExpoGo() || Platform.OS === 'web') {
        console.log('[RevenueCat] Mock purchase in Expo Go:', packageId);
        return { success: true };
      }

      // TODO: Implement real RevenueCat purchase logic here
      // This is where you'd call the actual RevenueCat SDK
      console.log('[RevenueCat] Would purchase:', packageId);
      
      return { success: false };
    } catch (err) {
      console.error('[RevenueCat] Purchase error:', err);
      setError('Purchase failed');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize RevenueCat safely
  useEffect(() => {
    const initRevenueCat = async () => {
      try {
        if (isExpoGo() || Platform.OS === 'web') {
          console.log('[RevenueCat] Running in Expo Go - using mock data');
          // Set mock data for Expo Go
          setUser({ pro: false });
          setPackages([]);
          return;
        }

        // TODO: Initialize real RevenueCat SDK here
        console.log('[RevenueCat] Would initialize SDK in development build');
        setUser({ pro: false });
        setPackages([]);
        
      } catch (err) {
        console.error('[RevenueCat] Initialization error:', err);
        setError('Failed to initialize RevenueCat');
        // Set fallback values so app doesn't crash
        setUser({ pro: false });
        setPackages([]);
      }
    };

    initRevenueCat();
  }, []);

  const contextValue: RevenueCatContextType = {
    user,
    packages,
    purchasePackage,
    isLoading,
    error,
  };

  return (
    <RevenueCatContext.Provider value={contextValue}>
      {children}
    </RevenueCatContext.Provider>
  );
}