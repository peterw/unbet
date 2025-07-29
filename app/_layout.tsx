import * as SecureStore from 'expo-secure-store';
import { ClerkLoaded, ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { Slot, SplashScreen } from 'expo-router';
import { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RevenueCatProvider } from '@/providers/RevenueCatProvider';
import { useEffect, useMemo } from 'react';
import { MixpanelProvider } from '@/providers/MixpanelProvider';
import { AnalyticsProviderComponent } from '@/providers/AnalyticsProvider';
import AdjustSDK from '@/utils/adjust';
import AdjustEvents from '@/utils/adjustEvents';
import AppTrackingTransparency, { ATTStatus } from '@/utils/appTrackingTransparency';
import FacebookSDK from '@/utils/facebook';
import Purchases from 'react-native-purchases';
import { Adjust } from 'react-native-adjust';
import { Platform } from 'react-native';
import { useFonts } from 'expo-font';
import {
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  DMSerifDisplay_400Regular,
  DMSerifDisplay_400Regular_Italic,
} from '@expo-google-fonts/dm-serif-display';
import { initializeApp } from '@/utils/envCheck';
import { SimpleAuthProvider } from '@/providers/SimpleAuthProvider';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!

if (!publishableKey) {
  throw new Error(
    'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env',
  )
}

const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key)
      if (item) {
        console.log(`${key} was used 🔐 \n`)
      } else {
        console.log('No values stored under key: ' + key)
      }
      return item
    } catch (error) {
      console.error('SecureStore get item error: ', error)
      await SecureStore.deleteItemAsync(key)
      return null
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value)
    } catch (err) {
      return
    }
  },
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

const RootLayoutNav = () => {
  // Load fonts
  const [fontsLoaded] = useFonts({
    DMSans_300Light,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    DMSerifDisplay_400Regular,
    DMSerifDisplay_400Regular_Italic,
  });

  // Initialise the Mixpanel analytics provider once. The token should be
  // provided via your app configuration (e.g. app.config.ts or .env files)
  // and exposed to the client through the Expo "EXPO_PUBLIC_" prefix.
  const mixpanelProvider = useMemo(() => {
    const token = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN!;

    return new MixpanelProvider(token);
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    // Check environment variables on app initialization
    initializeApp();
    
    // Initialize Adjust SDK
    const adjustAppToken = process.env.EXPO_PUBLIC_ADJUST_APP_TOKEN || 'YOUR_APP_TOKEN';
    const adjustEnvironment = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';

    AdjustSDK.initialize(adjustAppToken, adjustEnvironment as 'sandbox' | 'production');

    // 👉 Initialise Facebook / Meta SDK
    const fbAppId = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || 'YOUR_FACEBOOK_APP_ID';
    FacebookSDK.init(fbAppId);

    // Track app opened - this will automatically detect if it's first launch
    const isFirstLaunch = !(global as any).__ADJUST_FIRST_LAUNCH_TRACKED__;
    if (isFirstLaunch) {
      (global as any).__ADJUST_FIRST_LAUNCH_TRACKED__ = true;
      // Track first app opened (unique event)
      setTimeout(() => AdjustEvents.trackFirstAppOpened(), 1000);
    } else {
      // Track regular app opened
      setTimeout(() => AdjustEvents.trackAppOpened(), 1000);
    }

    // Request ATT permission after a delay to let the app settle
    setTimeout(async () => {
      try {
        const status = await AppTrackingTransparency.requestWithTiming(3000);
        console.log('🔒 Final ATT status:', AppTrackingTransparency.getStatusMessage(status));

        // Update device identifiers if ATT was granted
        if (status === ATTStatus.GRANTED) {
          console.log('✅ ATT granted - updating device identifiers...');

          // Update device identifiers in both RevenueCat and trigger Adjust attribution refresh
          await AdjustSDK.updateDeviceIdentifiersAfterATT();
          console.log('🔄 Device identifiers updated - attribution should refresh automatically');
        }

        // Get the advertising ID if available and forward to RevenueCat
        const advertisingId = await AppTrackingTransparency.getAdvertisingId();
        if (advertisingId) {
          console.log('📱 IDFA obtained successfully – forwarding to RevenueCat');
          try {
            await (Purchases as any).setAttributes({ $idfa: advertisingId });
          } catch (err) {
            console.warn('⚠️ Unable to set $idfa attribute in RevenueCat:', err);
          }
        } else {
          console.log('📱 IDFA not available');
        }

        // Also forward IDFV for completeness (iOS only)
        if (Platform.OS === 'ios') {
          Adjust.getIdfv(async (idfv?: string) => {
            if (idfv && idfv !== 'unknown') {
              try {
                await (Purchases as any).setAttributes({ $idfv: idfv });
                console.log('📱 IDFV forwarded to RevenueCat');
              } catch (err) {
                console.warn('⚠️ Unable to set $idfv attribute in RevenueCat:', err);
              }
            }
          });
        }
      } catch (error) {
        console.error('❌ Error requesting ATT permission:', error);
      }
    }, 2000);

    // Cleanup function
    return () => {
      AdjustSDK.cleanup();
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <RevenueCatProvider>
          <AnalyticsProviderComponent provider={mixpanelProvider}>
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
              <SimpleAuthProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <Slot />
                </GestureHandlerRootView>
              </SimpleAuthProvider>
            </ConvexProviderWithClerk>
          </AnalyticsProviderComponent>
        </RevenueCatProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
};

export default RootLayoutNav;