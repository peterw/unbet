import { Platform } from 'react-native';

// Only import TrackingTransparency on native platforms
let TrackingTransparency: any = {
  requestTrackingPermissionsAsync: async () => ({ status: 'granted' }),
  getTrackingPermissionsAsync: async () => ({ status: 'granted' }),
  getAdvertisingId: async () => null,
};

if (Platform.OS !== 'web') {
  TrackingTransparency = require('expo-tracking-transparency');
}

/**
 * App Tracking Transparency (ATT) Handler
 * 
 * Handles iOS 14.5+ App Tracking Transparency permission
 * Required for proper Adjust attribution and IDFA access
 */

export enum ATTStatus {
  UNDETERMINED = 'undetermined',
  DENIED = 'denied',
  GRANTED = 'granted',
}

export class AppTrackingTransparency {
  
  /**
   * Request App Tracking Transparency permission
   * Uses the native Expo TrackingTransparency API
   */
  static async requestPermission(): Promise<ATTStatus> {
    if (Platform.OS !== 'ios') {
      console.log('ATT: Not iOS, skipping permission request');
      return ATTStatus.GRANTED; // Android and web don't need ATT
    }

    try {
      console.log('🔒 Requesting App Tracking Transparency permission...');
      
      const { status } = await TrackingTransparency.requestTrackingPermissionsAsync();
      console.log('🔒 ATT Permission result:', status);
      
             // Update device identifiers after permission is granted
       if (status === 'granted') {
         console.log('✅ ATT Permission granted - will update device identifiers in callback');
         return ATTStatus.GRANTED;
       } else {
         console.log('❌ ATT Permission denied or restricted');
         return status === 'denied' ? ATTStatus.DENIED : ATTStatus.UNDETERMINED;
       }
      
    } catch (error) {
      console.error('❌ Error requesting ATT permission:', error);
      return ATTStatus.UNDETERMINED;
    }
  }
  
  /**
   * Get current App Tracking Transparency status
   */
  static async getStatus(): Promise<ATTStatus> {
    if (Platform.OS !== 'ios') {
      return ATTStatus.GRANTED; // Android and web don't need ATT
    }

    try {
      const { status } = await TrackingTransparency.getTrackingPermissionsAsync();
      console.log('🔒 Current ATT status:', status);
      
      switch (status) {
        case 'granted':
          return ATTStatus.GRANTED;
        case 'denied':
          return ATTStatus.DENIED;
        default:
          return ATTStatus.UNDETERMINED;
      }
    } catch (error) {
      console.error('❌ Error getting ATT status:', error);
      return ATTStatus.UNDETERMINED;
    }
  }
  
  /**
   * Check if we should show ATT request
   * Returns true if status is UNDETERMINED
   */
  static async shouldRequestPermission(): Promise<boolean> {
    const status = await this.getStatus();
    return status === ATTStatus.UNDETERMINED;
  }
  
  /**
   * Get user-friendly status message
   */
  static getStatusMessage(status: ATTStatus): string {
    switch (status) {
      case ATTStatus.UNDETERMINED:
        return 'Permission not requested yet';
      case ATTStatus.DENIED:
        return 'Permission denied by user';
      case ATTStatus.GRANTED:
        return 'Permission granted';
      default:
        return 'Unknown status';
    }
  }
  
  /**
   * Get the advertising ID (IDFA on iOS, AAID on Android)
   * Only works if ATT permission is granted on iOS 14.5+
   */
  static async getAdvertisingId(): Promise<string | null> {
    try {
      if (Platform.OS === 'ios') {
        // Check permission first
        const status = await this.getStatus();
        if (status !== ATTStatus.GRANTED) {
          console.log('🔒 ATT permission not granted, IDFA will be null');
          return null;
        }
      }
      
      const advertisingId = await TrackingTransparency.getAdvertisingId();
      console.log('📱 Advertising ID:', advertisingId ? 'obtained' : 'null');
      return advertisingId;
    } catch (error) {
      console.error('❌ Error getting advertising ID:', error);
      return null;
    }
  }
  
  /**
   * Show ATT permission with custom timing
   * Call this at an appropriate moment in your app flow
   */
  static async requestWithTiming(delayMs: number = 2000): Promise<ATTStatus> {
    // Check if we should request
    const shouldRequest = await this.shouldRequestPermission();
    
    if (!shouldRequest) {
      console.log('🔒 ATT permission already determined, skipping request');
      return await this.getStatus();
    }
    
    // Add a small delay to let the app settle
    await new Promise(resolve => setTimeout(resolve, delayMs));
    
    return await this.requestPermission();
  }
}

export default AppTrackingTransparency; 