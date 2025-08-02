import React, { createContext, useContext, useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppleAuthContextType {
  signInWithApple: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AppleAuthContext = createContext<AppleAuthContextType>({
  signInWithApple: async () => {},
  isLoading: false,
  error: null,
});

export const useAppleAuth = () => {
  const context = useContext(AppleAuthContext);
  if (!context) {
    throw new Error('useAppleAuth must be used within AppleAuthProvider');
  }
  return context;
};

interface AppleAuthProviderProps {
  children: React.ReactNode;
  onSuccessRoute?: string;
}

const APPLE_USER_KEY = 'apple_user_id';

export function AppleAuthProvider({ children, onSuccessRoute = '/(main)/(tabs)/' }: AppleAuthProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signInWithAppleAction = useAction(api.appleAuth.signInWithApple);
  const router = useRouter();

  const signInWithApple = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if Apple authentication is available
      if (Platform.OS !== 'ios' || !(await AppleAuthentication.isAvailableAsync())) {
        throw new Error('Apple Sign In is not available on this device');
      }

      // Request Apple authentication
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Validate credential data
      if (!credential.identityToken) {
        throw new Error('No identity token received from Apple');
      }

      // Call our Convex action to verify token and create/update user
      const result = await signInWithAppleAction({
        identityToken: credential.identityToken,
        user: credential.user,
        email: credential.email || undefined,
        fullName: credential.fullName || undefined,
      });

      if (result.success && result.userId) {
        // Store Apple user ID for future logins
        await AsyncStorage.setItem(APPLE_USER_KEY, credential.user);
        
        // Clear any previous errors on success
        setError(null);
        
        // Navigate to main app
        router.replace(onSuccessRoute);
      }
    } catch (err: any) {
      if (err?.code === 'ERR_CANCELED') {
        // User cancelled - don't show error
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Apple Sign In failed';
      setError(errorMessage);
      
      if (Platform.OS === 'ios') {
        Alert.alert('Sign In Error', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppleAuthContext.Provider 
      value={{ 
        signInWithApple,
        isLoading,
        error,
      }}
    >
      {children}
    </AppleAuthContext.Provider>
  );
}