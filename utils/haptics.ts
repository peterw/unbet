import { Platform } from 'react-native';
import * as ExpoHaptics from 'expo-haptics';

/**
 * Web-safe Haptics wrapper
 */
export const Haptics = {
  impactAsync: async (style?: ExpoHaptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== 'web') {
      return ExpoHaptics.impactAsync(style);
    }
    // No-op on web
  },
  
  notificationAsync: async (type?: ExpoHaptics.NotificationFeedbackType) => {
    if (Platform.OS !== 'web') {
      return ExpoHaptics.notificationAsync(type);
    }
    // No-op on web
  },
  
  selectionAsync: async () => {
    if (Platform.OS !== 'web') {
      return ExpoHaptics.selectionAsync();
    }
    // No-op on web
  },
  
  ImpactFeedbackStyle: ExpoHaptics.ImpactFeedbackStyle,
  NotificationFeedbackType: ExpoHaptics.NotificationFeedbackType,
};