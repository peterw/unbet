import { Platform } from 'react-native';

// Only import Adjust on native platforms
let Adjust: any = {};
let AdjustConfig: any = {
  EnvironmentSandbox: 'sandbox',
  EnvironmentProduction: 'production',
  LogLevelVerbose: 'verbose',
};
let AdjustEvent: any = class {
  constructor(token: string) {
    this.token = token;
  }
  setRevenue() {}
  setTransactionId() {}
  setCurrency() {}
};

if (Platform.OS !== 'web') {
  try {
    const adjustLib = require('react-native-adjust');
    Adjust = adjustLib.Adjust || adjustLib.default?.Adjust || {};
    AdjustConfig = adjustLib.AdjustConfig || adjustLib.default?.AdjustConfig || {
      EnvironmentSandbox: 'sandbox',
      EnvironmentProduction: 'production',
      LogLevelVerbose: 'verbose',
    };
    AdjustEvent = adjustLib.AdjustEvent || adjustLib.default?.AdjustEvent || class {
      constructor(token: string) {
        this.token = token;
      }
      setRevenue() {}
      setTransactionId() {}
      setCurrency() {}
    };
  } catch (error) {
    console.warn('Failed to load react-native-adjust:', error);
  }
}

export class AdjustSDK {
  private static initialized = false;

  // Initialize Adjust SDK with your app token
  static initialize(appToken: string, environment: 'sandbox' | 'production' = 'sandbox') {
    if (this.initialized || Platform.OS === 'web') {
      console.log('Adjust SDK already initialized or on web platform');
      return;
    }

    try {

    const adjustConfig = new AdjustConfig(
      appToken,
      environment === 'sandbox' ? AdjustConfig.EnvironmentSandbox : AdjustConfig.EnvironmentProduction
    );

    // Set log level for debugging (remove in production)
    if (environment === 'sandbox' && adjustConfig.setLogLevel) {
      adjustConfig.setLogLevel(AdjustConfig.LogLevelVerbose);
    }

    // Optional: Set attribution callback
    if (adjustConfig.setAttributionCallback) {
      adjustConfig.setAttributionCallback((attribution) => {
      console.log('Adjust attribution:', attribution);
      
      // RevenueCat expects the *Adjust Device Identifier* (adid) – not the tracker token.
      // We also guard against SDK version differences where helper methods might not exist.
      const adid = (attribution as any)?.adid;
      if (adid && adid !== 'unknown') {
        try {
          const Purchases = require('react-native-purchases').default;

          // Forward the Adjust ID so that RevenueCat can forward events to Adjust.
          if (typeof Purchases.setAdjustID === 'function') {
            Purchases.setAdjustID(adid);
            console.log('✅ RevenueCat updated with Adjust ID:', adid);
          } else if (typeof Purchases.setAttributes === 'function') {
            Purchases.setAttributes({
              $adjustId: adid,
            });
            console.log('✅ RevenueCat updated with $adjustId attribute:', adid);
          } else {
            console.warn('⚠️ Purchases SDK does not expose setAdjustID or setAttributes – cannot forward Adjust ID');
          }
        } catch (error) {
          console.error('❌ Error setting Adjust ID in RevenueCat:', error);
        }
      } else {
        console.warn('⚠️ No valid Adjust adid found in attribution:', JSON.stringify(attribution, null, 2));
      }
      });
    }

    // Optional: Set session callback
    if (adjustConfig.setSessionTrackingSucceededCallback) {
      adjustConfig.setSessionTrackingSucceededCallback((sessionSuccess: any) => {
        console.log('Adjust session success:', sessionSuccess);
      });
    }

    // Optional: Set event callback
    if (adjustConfig.setEventTrackingSucceededCallback) {
      adjustConfig.setEventTrackingSucceededCallback((eventSuccess: any) => {
        console.log('Adjust event success:', eventSuccess);
      });
    }

    if (Adjust.initSdk) {
      Adjust.initSdk(adjustConfig);
    }
    this.initialized = true;
    console.log('Adjust SDK initialized successfully');
    
    // Check if Adjust ID is already available and set it in RevenueCat
    this.setInitialAdjustId();
    } catch (error) {
      console.error('Failed to initialize Adjust SDK:', error);
      // Don't set initialized to true if initialization failed
      // This prevents the "invalid reuse after initialization failure" error
    }
  }

  // Set initial Adjust ID if available at app launch
  static setInitialAdjustId() {
    try {
      // The Adjust ID will be available through the attribution callback
      // We don't need to manually get it here since it will come through the callback
      console.log('ℹ️ Waiting for Adjust attribution callback to set ID in RevenueCat');
    } catch (error) {
      console.error('❌ Error in setInitialAdjustId:', error);
    }
  }

  // Track custom events
  static trackEvent(eventToken: string, revenue?: number, currency?: string, parameters?: Record<string, string>) {
    if (!this.initialized || Platform.OS === 'web') {
      console.warn('Adjust SDK not initialized or on web platform. Skipping event tracking.');
      return;
    }

    const adjustEvent = new AdjustEvent(eventToken);

    // Add revenue if provided
    if (revenue && currency && adjustEvent.setRevenue) {
      adjustEvent.setRevenue(revenue, currency);
    }

    // Add custom parameters
    if (parameters && adjustEvent.addCallbackParameter) {
      Object.entries(parameters).forEach(([key, value]) => {
        adjustEvent.addCallbackParameter(key, value);
      });
    }

    if (Adjust.trackEvent) {
      Adjust.trackEvent(adjustEvent);
    }
  }

  // Track app launch
  static trackAppLaunch() {
    // You can create a specific event token for app launches in Adjust dashboard
    console.log('App launched - Adjust will track this automatically');
  }

  // Track user registration
  static trackUserRegistration(userId?: string) {
    const parameters: Record<string, string> = {};
    if (userId) {
      parameters.user_id = userId;
    }
    
    // Replace 'your_registration_token' with actual token from Adjust dashboard
    this.trackEvent('your_registration_token', undefined, undefined, parameters);
  }

  // Track purchase
  static trackPurchase(amount: number, currency: string, productId: string) {
    const parameters = {
      product_id: productId,
    };
    
    // Replace 'your_purchase_token' with actual token from Adjust dashboard
    this.trackEvent('your_purchase_token', amount, currency, parameters);
  }

  // Track subscription
  static trackSubscription(amount: number, currency: string, subscriptionType: string) {
    const parameters = {
      subscription_type: subscriptionType,
    };
    
    // Replace 'your_subscription_token' with actual token from Adjust dashboard
    this.trackEvent('your_subscription_token', amount, currency, parameters);
  }

  // Track protein analysis (specific to your app)
  static trackProteinAnalysis(proteinAmount: number, method: 'camera' | 'manual') {
    const parameters = {
      protein_amount: proteinAmount.toString(),
      analysis_method: method,
    };
    
    // Replace 'your_protein_analysis_token' with actual token from Adjust dashboard
    this.trackEvent('your_protein_analysis_token', undefined, undefined, parameters);
  }

  // Update device identifiers after ATT permission granted
  static async updateDeviceIdentifiersAfterATT() {
    try {
      console.log('🔄 Updating device identifiers after ATT permission...');

      // Fetch the Adjust adid again – it might only be available once the user
      // has granted tracking permission – and forward it to RevenueCat.
      Adjust.getAdid(async (adid?: string) => {
        if (!adid || adid === 'unknown') {
          console.log('ℹ️ Adjust adid still not available after ATT permission');
          return;
        }

        try {
          const Purchases = require('react-native-purchases').default;

          if (typeof (Purchases as any).setAdjustID === 'function') {
            await (Purchases as any).setAdjustID(adid);
          } else if (typeof Purchases.setAttributes === 'function') {
            await Purchases.setAttributes({ $adjustId: adid });
          }

          console.log('✅ Forwarded Adjust ID to RevenueCat after ATT:', adid);
        } catch (innerError) {
          console.error('❌ Error forwarding Adjust ID after ATT:', innerError);
        }
      });
    } catch (error) {
      console.error('❌ Error updating device identifiers after ATT:', error);
    }
  }

  // Cleanup method for component unmounting
  static cleanup() {
    if (this.initialized) {
      Adjust.componentWillUnmount();
    }
  }
}

export default AdjustSDK; 