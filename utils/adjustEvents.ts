import AdjustSDK from './adjust';

/**
 * Event tracking utilities for Protein AI app
 * Using actual Adjust event tokens from dashboard
 */

export const AdjustEvents = {
  // App lifecycle events
  trackAppOpened: () => {
    // "vfdhhk","InApp App Opened","false"
    AdjustSDK.trackEvent('vfdhhk');
  },

  trackFirstAppOpened: () => {
    // "5ear07","InApp First App Opened","true" 
    AdjustSDK.trackEvent('5ear07');
  },

  // User onboarding
  trackOnboardingCompleted: (userId?: string) => {
    // "8neqc0","InApp Onboarding Completed","true"
    const parameters: Record<string, string> = {};
    if (userId) {
      parameters.user_id = userId;
    }
    AdjustSDK.trackEvent('8neqc0', undefined, undefined, parameters);
  },

  // Revenue Cat subscription events
  trackRCCancellation: (productId?: string, userId?: string) => {
    // "s51cme","RC Cancellation","false"
    const parameters: Record<string, string> = {};
    if (productId) parameters.product_id = productId;
    if (userId) parameters.user_id = userId;
    AdjustSDK.trackEvent('s51cme', undefined, undefined, parameters);
  },

  trackRCExpiration: (productId?: string, userId?: string) => {
    // "7jhu5f","RC Expiration","false"
    const parameters: Record<string, string> = {};
    if (productId) parameters.product_id = productId;
    if (userId) parameters.user_id = userId;
    AdjustSDK.trackEvent('7jhu5f', undefined, undefined, parameters);
  },

  trackRCInitialPurchase: (productId: string, revenue: number, currency: string = 'USD', userId?: string) => {
    // "r5zjr1","RC Initial purchase","false"
    const parameters: Record<string, string> = {
      product_id: productId,
    };
    if (userId) parameters.user_id = userId;
    AdjustSDK.trackEvent('r5zjr1', revenue, currency, parameters);
  },

  trackRCNonSubscriptionPurchase: (productId: string, revenue: number, currency: string = 'USD', userId?: string) => {
    // "d81s9g","RC Non subscription purchase","false"
    const parameters: Record<string, string> = {
      product_id: productId,
    };
    if (userId) parameters.user_id = userId;
    AdjustSDK.trackEvent('d81s9g', revenue, currency, parameters);
  },

  trackRCProductChange: (oldProductId: string, newProductId: string, userId?: string) => {
    // "5xi50p","RC Product change","false"
    const parameters: Record<string, string> = {
      old_product_id: oldProductId,
      new_product_id: newProductId,
    };
    if (userId) parameters.user_id = userId;
    AdjustSDK.trackEvent('5xi50p', undefined, undefined, parameters);
  },

  trackRCRenewal: (productId: string, revenue: number, currency: string = 'USD', userId?: string) => {
    // "i3ntih","RC Renewal","false"
    const parameters: Record<string, string> = {
      product_id: productId,
    };
    if (userId) parameters.user_id = userId;
    AdjustSDK.trackEvent('i3ntih', revenue, currency, parameters);
  },

  trackRCTrialCancelled: (productId: string, userId?: string) => {
    // "lqiu76","RC Trial cancelled","false"
    const parameters: Record<string, string> = {
      product_id: productId,
    };
    if (userId) parameters.user_id = userId;
    AdjustSDK.trackEvent('lqiu76', undefined, undefined, parameters);
  },

  trackRCTrialConverted: (productId: string, revenue: number, currency: string = 'USD', userId?: string) => {
    // "c8euvj","RC Trial converted","false"
    const parameters: Record<string, string> = {
      product_id: productId,
    };
    if (userId) parameters.user_id = userId;
    AdjustSDK.trackEvent('c8euvj', revenue, currency, parameters);
  },

  trackRCTrialStarted: (productId: string, userId?: string) => {
    // "biqsyb","RC Trial started","false"
    const parameters: Record<string, string> = {
      product_id: productId,
    };
    if (userId) parameters.user_id = userId;
    AdjustSDK.trackEvent('biqsyb', undefined, undefined, parameters);
  },
};

export default AdjustEvents; 