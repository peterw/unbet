import { Platform } from 'react-native';

// Environment variable checker
export const checkEnvironmentVariables = () => {
  const required = [
    'EXPO_PUBLIC_CONVEX_URL',
    'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'EXPO_PUBLIC_MIXPANEL_TOKEN',
    'EXPO_PUBLIC_FACEBOOK_APP_ID'
  ];

  const optional = [
    'EXPO_PUBLIC_ADJUST_APP_TOKEN'
  ];

  const missing: string[] = [];
  const missingOptional: string[] = [];
  
  required.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  optional.forEach(varName => {
    if (!process.env[varName]) {
      missingOptional.push(varName);
    }
  });

  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    console.error('Please check your .env file and ensure all variables are set correctly.');
  }

  if (missingOptional.length > 0) {
    console.log('Optional environment variables not set:', missingOptional);
  }

  return missing.length === 0;
};

// Call this in your app initialization
export const initializeApp = () => {
  const envOk = checkEnvironmentVariables();
  
  if (!envOk) {
    console.warn('App may not function correctly due to missing environment variables');
  }
  
  // Log current environment for debugging
  console.log('Current environment:', {
    convexUrl: process.env.EXPO_PUBLIC_CONVEX_URL ? 'Set' : 'Missing',
    clerkKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'Set' : 'Missing',
    platform: Platform.OS
  });
};