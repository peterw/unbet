import * as SecureStore from 'expo-secure-store';
import { ClerkLoaded, ClerkProvider, useAuth, ClerkLoading } from '@clerk/clerk-expo';
import { Slot, SplashScreen } from 'expo-router';
import { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RevenueCatProvider } from '@/providers/SafeRevenueCatProvider';
import { useEffect, useMemo } from 'react';
import { MixpanelProvider } from '@/providers/MixpanelProvider';
import { AnalyticsProviderComponent } from '@/providers/AnalyticsProvider';
import AdjustSDK from '@/utils/adjust';
import AdjustEvents from '@/utils/adjustEvents';
import AppTrackingTransparency, { ATTStatus } from '@/utils/appTrackingTransparency';
import { isExpoGo } from '@/utils/isExpoGo';

// Conditionally import Adjust
let Adjust: any = {
  getIdfv: (callback: Function) => callback('unknown'),
};

if (!isExpoGo()) {
  try {
    Adjust = require('react-native-adjust').Adjust;
  } catch (error) {
    console.warn('Failed to load react-native-adjust:', error);
  }
}
import FacebookSDK from '@/utils/facebook';

// Conditionally import Purchases
let Purchases: any = {
  setAttributes: async () => {},
};

if (!isExpoGo()) {
  try {
    Purchases = require('react-native-purchases').default;
  } catch (error) {
    console.warn('Failed to load react-native-purchases:', error);
  }
}

import { Platform, AppState } from 'react-native';
import { useFonts } from 'expo-font';
import { initializeApp } from '@/utils/envCheck';
import { SimpleConvexAuthProvider } from '@/providers/SimpleConvexAuth';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { View, Text, ActivityIndicator } from 'react-native';

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
      return item
    } catch (error) {
      console.error('SecureStore get item error: ', error)
      // Only delete on specific errors, not network issues
      if (error.message?.includes('item not found') || error.message?.includes('not exist')) {
        await SecureStore.deleteItemAsync(key)
      }
      return null
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value)
    } catch (err) {
      console.error('SecureStore save item error: ', err)
      return
    }
  },
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash screen might already be hidden, that's ok
});

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
console.log('Convex URL:', convexUrl);

const convex = new ConvexReactClient(convexUrl!, {
  unsavedChangesWarning: false,
});

const RootLayoutNav = () => {
  // Load fonts locally - these load instantly since they're bundled
  const [fontsLoaded] = useFonts({
    'DMSans_300Light': require('../assets/fonts/DM_Sans/static/DMSans-Light.ttf'),
    'DMSans_400Regular': require('../assets/fonts/DM_Sans/static/DMSans-Regular.ttf'),
    'DMSans_500Medium': require('../assets/fonts/DM_Sans/static/DMSans-Medium.ttf'),
    'DMSans_700Bold': require('../assets/fonts/DM_Sans/static/DMSans-Bold.ttf'),
    'DMSerifDisplay_400Regular': require('../assets/fonts/DM_Serif_Display/DMSerifDisplay-Regular.ttf'),
    'DMSerifDisplay_400Regular_Italic': require('../assets/fonts/DM_Serif_Display/DMSerifDisplay-Italic.ttf'),
  });

  // Initialise the Mixpanel analytics provider once. The token should be
  // provided via your app configuration (e.g. app.config.ts or .env files)
  // and exposed to the client through the Expo "EXPO_PUBLIC_" prefix.
  const mixpanelProvider = useMemo(() => {
    const token = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN!;

    return new MixpanelProvider(token);
  }, []);

  // Hide splash screen when fonts are loaded
  useEffect(() => {
    if (fontsLoaded) {
      console.log('[RootLayout] Fonts loaded, hiding splash screen');
      SplashScreen.hideAsync().catch(err => {
        console.error('[RootLayout] Error hiding splash screen:', err);
      });
    }
  }, [fontsLoaded]);

  useEffect(() => {
    // Check environment variables on app initialization
    initializeApp();
    
    // Initialize Adjust SDK only if token is provided
    const adjustAppToken = process.env.EXPO_PUBLIC_ADJUST_APP_TOKEN;
    if (adjustAppToken && adjustAppToken !== 'your_adjust_app_token_here') {
      const adjustEnvironment = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';
      AdjustSDK.initialize(adjustAppToken, adjustEnvironment as 'sandbox' | 'production');
      
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
    } else {
      console.log('Adjust SDK not initialized - no token provided');
    }

    // Initialize Facebook / Meta SDK
    const fbAppId = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || 'YOUR_FACEBOOK_APP_ID';
    FacebookSDK.init(fbAppId);

    // Request ATT permission after a delay to let the app settle
    setTimeout(async () => {
      try {
        const adjustAppToken = process.env.EXPO_PUBLIC_ADJUST_APP_TOKEN;
        const status = await AppTrackingTransparency.requestWithTiming(3000);
        console.log('🔒 Final ATT status:', AppTrackingTransparency.getStatusMessage(status));

        // Update device identifiers if ATT was granted
        if (status === ATTStatus.GRANTED) {
          console.log('✅ ATT granted - updating device identifiers...');

          // Update device identifiers in both RevenueCat and trigger Adjust attribution refresh
          if (adjustAppToken && adjustAppToken !== 'your_adjust_app_token_here') {
            await AdjustSDK.updateDeviceIdentifiersAfterATT();
          }
          console.log('🔄 Device identifiers updated');
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
        if (Platform.OS === 'ios' && adjustAppToken && adjustAppToken !== 'your_adjust_app_token_here') {
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
      if (adjustAppToken && adjustAppToken !== 'your_adjust_app_token_here') {
        AdjustSDK.cleanup();
      }
    };
  }, []);

  // Show loading screen until fonts are loaded
  if (!fontsLoaded) {
    console.log('[RootLayout] Fonts not loaded yet, fontsLoaded =', fontsLoaded);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ marginTop: 10, color: '#fff', fontSize: 16 }}>Loading fonts...</Text>
      </View>
    );
  }

  console.log('[RootLayout] Fonts loaded successfully! fontsLoaded =', fontsLoaded);

  console.log('Rendering app with Clerk key:', publishableKey ? 'Set' : 'Missing');

  return (
    <ErrorBoundary>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <ClerkLoading>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" />
            <Text style={{ marginTop: 10 }}>Loading Clerk...</Text>
          </View>
        </ClerkLoading>
        <ClerkLoaded>
        <RevenueCatProvider>
          <AnalyticsProviderComponent provider={mixpanelProvider}>
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
              <SimpleConvexAuthProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <Slot />
                </GestureHandlerRootView>
              </SimpleConvexAuthProvider>
            </ConvexProviderWithClerk>
          </AnalyticsProviderComponent>
        </RevenueCatProvider>
      </ClerkLoaded>
      </ClerkProvider>
    </ErrorBoundary>
  );
};

export default RootLayoutNav;