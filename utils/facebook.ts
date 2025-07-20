import { Settings, AppEventsLogger } from 'react-native-fbsdk-next';

/**
 * Simple wrapper around Meta (Facebook) SDK to handle initialization
 * and common app-events used in Protein AI.
 */
class FacebookSDK {
  private static initialized = false;

  /**
   * Initialise the SDK once. Safe to call multiple times.
   */
  static init(appId: string) {
    if (this.initialized) {
      return;
    }

    // Configure and initialise the SDK
    Settings.setAppID(appId);
    Settings.initializeSDK();

    // Enable advertiser tracking so events contain IDFA when users allow it
    Settings.setAdvertiserTrackingEnabled(true);

    this.initialized = true;
  }

  /** Log the standard Completed Tutorial/Onboarding event. */
  static logCompletedOnboarding() {
    if (!this.initialized) return;
    // `CompletedTutorial` is the closest standard event to onboarding completion
    AppEventsLogger.logEvent(AppEventsLogger.AppEvents.CompletedTutorial);
  }

  /** Log the standard Subscribe event when the user becomes premium. */
  static logSubscribe() {
    if (!this.initialized) return;
    // Log the standard "Subscribe" event
    AppEventsLogger.logEvent(AppEventsLogger.AppEvents.Subscribe);

    // Ensure the event is sent to Meta right away instead of waiting for the
    // automatic flush interval or app backgrounding. This helps when testing
    // locally and guarantees the event appears quickly in the Events Manager.
    try {
      AppEventsLogger.flush();
    } catch (err) {
      // `flush` may throw if the SDK is not fully ready on some Android builds
      // – swallow the error as it's non-critical for production.
      console.warn('FBSDK flush failed:', err);
    }
  }

  /** Log a purchase with value & currency for ROAS reporting */
  static logPurchase(amount: number, currency: string) {
    if (!this.initialized) return;
    try {
      AppEventsLogger.logPurchase(amount, currency);
      AppEventsLogger.flush();
    } catch (err) {
      console.warn('FBSDK purchase log failed:', err);
    }
  }

  /** Log the standard AddedToWishlist event, useful for testing event tracking on app launch. */
  static logAddedToWishlist() {
    if (!this.initialized) return;
    try {
      // Log the standard "AddedToWishlist" event
      AppEventsLogger.logEvent(AppEventsLogger.AppEvents.AddedToWishlist);

      // Flush immediately so the event appears quickly in Events Manager
      AppEventsLogger.flush();
    } catch (err) {
      console.warn('FBSDK AddedToWishlist log failed:', err);
    }
  }
}

export default FacebookSDK; 