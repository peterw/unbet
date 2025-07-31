import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Platform, View, Text, ActivityIndicator } from 'react-native';
import RevenueCatAdjustIntegration from '@/utils/revenueCatAdjustIntegration';
import FacebookSDK from '@/utils/facebook';
import * as SecureStore from 'expo-secure-store';
import { isExpoGo } from '@/utils/isExpoGo';

// Only import RevenueCat on native platforms
let Purchases: any = {
  configure: async () => {},
  setLogLevel: () => {},
  addCustomerInfoUpdateListener: () => {},
  getOfferings: async () => ({ current: null }),
  getCustomerInfo: async () => ({ entitlements: { active: {} } }),
  purchasePackage: async () => {},
  restorePurchases: async () => ({ entitlements: { active: {} } }),
};
let LOG_LEVEL: any = { DEBUG: 'debug' };
let PurchasesPackage: any;
let CustomerInfo: any;
let Adjust: any = {};

// Load native modules - RevenueCat works in Preview Mode in Expo Go
if (Platform.OS !== 'web') {
  try {
    const rcLib = require('react-native-purchases');
    Purchases = rcLib.default;
    LOG_LEVEL = rcLib.LOG_LEVEL;
    PurchasesPackage = rcLib.PurchasesPackage;
    CustomerInfo = rcLib.CustomerInfo;
    
    if (isExpoGo()) {
      console.log('📱 RevenueCat running in Expo Go Preview Mode - purchases will be mocked');
    }
  } catch (error) {
    console.warn('Failed to load react-native-purchases:', error);
  }
  
  try {
    const adjustLib = require('react-native-adjust');
    Adjust = adjustLib.Adjust || adjustLib.default || {};
  } catch (error) {
    console.warn('Failed to load react-native-adjust:', error);
    Adjust = {};
  }
}

// Key used to remember if the "Subscribe" event was already logged for the current active subscription period.
const SUBSCRIBE_LOGGED_KEY = 'protai_subscribe_logged_v1';

// Use keys from you RevenueCat API Keys
const APIKeys = {
  apple: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY || 'dummy_key_for_development',
  // google: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY || 'dummy_key_for_development',
};

interface RevenueCatProps {
  purchasePackage?: (pack: PurchasesPackage) => Promise<void>;
  restorePermissions?: () => Promise<CustomerInfo>;
  updateDeviceIdentifiers?: () => Promise<void>;
  user: UserState;
  packages: PurchasesPackage[];
}

export interface UserState {
  items: string[];
  pro: boolean;
}

const RevenueCatContext = createContext<RevenueCatProps | null>(null);

// Provide RevenueCat functions to our app
export const RevenueCatProvider = ({ children }: any) => {
  const [user, setUser] = useState<UserState>({ items: [], pro: false });
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [previousCustomerInfo, setPreviousCustomerInfo] = useState<CustomerInfo | null>(null);
  const [subscribeLogged, setSubscribeLogged] = useState<boolean>(false);
  const subscribeLoggedRef = useRef<boolean>(false);
  
  console.log('RevenueCatProvider - isReady:', isReady, 'isExpoGo:', isExpoGo());
  // Keep ref in sync with state so listener closure always has latest value
  useEffect(() => {
    subscribeLoggedRef.current = subscribeLogged;
  }, [subscribeLogged]);

  // Load persisted flag on mount so we know if Subscribe was already fired earlier.
  useEffect(() => {
    (async () => {
      try {
        const val = await SecureStore.getItemAsync(SUBSCRIBE_LOGGED_KEY);
        if (val === 'true') {
          setSubscribeLogged(true);
        }
      } catch (err) {
        console.warn('Failed to read subscribe flag:', err);
      }
    })();
  }, []);

  /**
   * Reads the Adjust advertising identifier (adid) and forwards it to RevenueCat.
   * It uses the new `setAttributes` API as the `setAdjustID` / `collectDeviceIdentifiers`
   * helpers were removed in RevenueCat SDK v8.
   */
  const forwardAdjustIdToRevenueCat = async () => {
    try {
      // Check if Adjust is properly initialized before calling getAdid
      const adjustAppToken = process.env.EXPO_PUBLIC_ADJUST_APP_TOKEN;
      if (!adjustAppToken || adjustAppToken === 'your_adjust_app_token_here' || !Adjust.getAdid) {
        console.log('ℹ️ Adjust SDK not initialized or token not set - skipping Adjust ID forwarding');
        return;
      }

      Adjust.getAdid(async (adid?: string) => {
        if (!adid || adid === 'unknown') {
          console.log('ℹ️ Adjust adid not yet available – will retry later');
          return;
        }

        console.log('🔗 Forwarding Adjust ID to RevenueCat:', adid);

        // New SDKs expose only `setAttributes`, older ones still expose `setAdjustID`.
        if (typeof (Purchases as any).setAdjustID === 'function') {
          await (Purchases as any).setAdjustID(adid);
        } else if (typeof Purchases.setAttributes === 'function') {
          await Purchases.setAttributes({ $adjustId: adid });
        } else {
          console.warn('⚠️ Purchases SDK does not expose a way to set $adjustId');
        }
      });
    } catch (error) {
      console.error('❌ Error forwarding Adjust ID to RevenueCat:', error);
    }
  };

  // Set up device data collection for Adjust integration
  const setupAdjustDeviceDataCollection = async () => {
    try {
      console.log('🔗 Setting up RevenueCat + Adjust device data collection...');

      // Forward the Adjust identifier as early as possible so RevenueCat can
      // associate it with the subscriber before the first purchase happens.
      await forwardAdjustIdToRevenueCat();

      console.log('✅ Device data collection initialised');
    } catch (error) {
      console.error('❌ Error setting up RevenueCat + Adjust device data:', error);
    }
  };

  // Update device identifiers (call this after ATT permission is granted)
  const updateDeviceIdentifiers = async () => {
    try {
      console.log('🔄 Updating RevenueCat device identifiers after ATT permission...');

      // Re-forward the Adjust adid in case it became available only after the
      // user granted ATT permission.
      await forwardAdjustIdToRevenueCat();

      console.log('✅ Device identifiers updated successfully');
    } catch (error) {
      console.error('❌ Error updating device identifiers:', error);
    }
  };

  useEffect(() => {
    console.log('RevenueCatProvider useEffect running');
    const init = async () => {
      console.log('RevenueCatProvider init() called');

      // Skip initialization only on web
      if (Platform.OS === 'web') {
        console.log('RevenueCatProvider - Skipping init for web');
        setIsReady(true);
        return;
      }
      
      // In Expo Go, RevenueCat works in sandbox mode
      if (isExpoGo()) {
        console.log('🏖️ Expo Go detected - RevenueCat will run in sandbox mode');
      }

      // Load Subscribe flag BEFORE configuring Purchases so listener uses correct state
      try {
        const stored = await SecureStore.getItemAsync(SUBSCRIBE_LOGGED_KEY);
        if (stored === 'true') {
          setSubscribeLogged(true);
          subscribeLoggedRef.current = true;
        }
      } catch (err) {
        console.warn('Failed to read subscribe flag (init):', err);
      }

      try {
        // if (Platform.OS === 'android') {
        //   await Purchases.configure({ apiKey: APIKeys.google });
        // } else {
        if (Purchases && Purchases.configure) {
          await Purchases.configure({ apiKey: APIKeys.apple });
          console.log('RevenueCat configured successfully');
        } else {
          console.log('RevenueCat module not available - skipping configuration');
        }
        // }
      } catch (error) {
        console.error('Error configuring RevenueCat:', error);
      }
      
      setIsReady(true);

      // Use more logging during debug if want!
      // if (process.env.NODE_ENV === 'development') {
      //   Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      // }

      // Listen for customer updates
      Purchases.addCustomerInfoUpdateListener(async (info) => {
        // Track changes for Adjust
        RevenueCatAdjustIntegration.handleCustomerInfoUpdate(previousCustomerInfo, info);

        // Detect first time Unlimited entitlement activation and log Subscribe to Meta
        const hadUnlimitedPreviously = Boolean(previousCustomerInfo?.entitlements.active['Unlimited']);
        const hasUnlimitedNow = Boolean(info.entitlements.active['Unlimited']);

        // Fire Subscribe event only once per actual subscription period.
        if (!hadUnlimitedPreviously && hasUnlimitedNow && !subscribeLoggedRef.current) {
          FacebookSDK.logSubscribe();
          setSubscribeLogged(true);
          subscribeLoggedRef.current = true;
          try {
            await SecureStore.setItemAsync(SUBSCRIBE_LOGGED_KEY, 'true');
          } catch (err) {
            console.warn('Failed to persist subscribe flag:', err);
          }
        }

        // Reset the flag if the Unlimited entitlement is no longer active
        if (!hasUnlimitedNow && subscribeLogged) {
          setSubscribeLogged(false);
          try {
            await SecureStore.deleteItemAsync(SUBSCRIBE_LOGGED_KEY);
          } catch (err) {
            console.warn('Failed to reset subscribe flag:', err);
          }
        }

        updateCustomerInformation(info);
        setPreviousCustomerInfo(info);
      });

      // Load all offerings and the user object with entitlements
      await loadOfferings();

      // Set up device data collection for Adjust integration
      await setupAdjustDeviceDataCollection();
    };
    init();
  }, []);

  // Load all offerings a user can (currently) purchase
  const loadOfferings = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      // console.log('Received offerings:', JSON.stringify(offerings, null, 2));
      if (offerings.current) {
        setPackages(offerings.current.availablePackages);
      } else {
        console.warn('No current offerings available');
      }
    } catch (error) {
      console.error('Failed to load offerings:', error);
    }
  };

  // Update user state based on previous purchases
  const updateCustomerInformation = async (customerInfo: CustomerInfo) => {
    const newUser: UserState = { items: [], pro: false };

    if (customerInfo?.entitlements.active['Unlimited'] !== undefined) {
      newUser.pro = true;
    }

    setUser(newUser);
  };

  // Purchase a package
  const purchasePackage = async (pack: PurchasesPackage) => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pack);

      // Track the purchase for Adjust – "Subscribe" handled elsewhere.
      RevenueCatAdjustIntegration.handlePurchaseUpdate(customerInfo, pack);

      // Log the monetary value to Meta so we get ROAS/LTV reporting.
      FacebookSDK.logPurchase(pack.product.price, pack.product.currencyCode);

      // Directly add our consumable product
      if (pack.product.identifier === 'protai_9.99_1m') {
        setUser({ ...user, items: [...user.items, pack.product.identifier] });
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        alert(e);
      }
    }
  };

  // // Restore previous purchases
  const restorePermissions = async () => {
    const customer = await Purchases.restorePurchases();
    return customer;
  };

  const value = {
    restorePermissions,
    user,
    packages,
    purchasePackage,
    updateDeviceIdentifiers,
  };

  // Don't block the entire app while RevenueCat initializes
  // This allows the app to continue loading and create the user in Convex
  if (!isReady) {
    console.log('RevenueCatProvider - Initializing in background...');
    // Return children immediately with limited functionality
    // RevenueCat functions will be no-ops until ready
    const limitedValue = {
      restorePermissions: async () => ({ entitlements: { active: {} } } as any),
      user: { items: [], pro: false },
      packages: [],
      purchasePackage: async () => {
        console.warn('RevenueCat not ready yet');
      },
      updateDeviceIdentifiers: async () => {
        console.warn('RevenueCat not ready yet');
      },
    };
    return <RevenueCatContext.Provider value={limitedValue}>{children}</RevenueCatContext.Provider>;
  }

  console.log('RevenueCatProvider - Ready, rendering children');
  return <RevenueCatContext.Provider value={value}>{children}</RevenueCatContext.Provider>;
};

// Export context for easy usage
export const useRevenueCat = () => {
  return useContext(RevenueCatContext) as RevenueCatProps;
};