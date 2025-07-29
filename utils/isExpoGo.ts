import Constants from 'expo-constants';

/**
 * Detects if the app is running in Expo Go
 */
export const isExpoGo = (): boolean => {
  return Constants.appOwnership === 'expo';
};

/**
 * Detects if the app is running in a development build or production
 */
export const isStandaloneBuild = (): boolean => {
  return Constants.appOwnership === 'standalone';
};

/**
 * Detects if the app is running in development mode
 */
export const isDevelopment = (): boolean => {
  return __DEV__ === true;
};