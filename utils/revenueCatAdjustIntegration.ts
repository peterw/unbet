import { Platform } from 'react-native';

// Only import RevenueCat types on native platforms
let PurchasesPackage: any;
let CustomerInfo: any;

if (Platform.OS !== 'web') {
  const rcLib = require('react-native-purchases');
  PurchasesPackage = rcLib.PurchasesPackage;
  CustomerInfo = rcLib.CustomerInfo;
}

/**
 * Revenue Cat + Adjust Integration
 * 
 * This utility helps bridge Revenue Cat events with Adjust tracking
 * using the event tokens you've configured in your Adjust dashboard.
 */

export class RevenueCatAdjustIntegration {
  
  /**
   * Track trial started event
   */
  static trackTrialStarted(customerInfo: CustomerInfo, packageInfo?: PurchasesPackage) {
    const productId = packageInfo?.product.identifier || 'unknown';
    const userId = customerInfo.originalAppUserId;
    
    console.log('🚀 Trial started:', { productId, userId });
    // Adjust events will be sent server-side by RevenueCat – avoid client-side duplicate
    // AdjustEvents.trackRCTrialStarted(productId, userId);
  }

  /**
   * Track trial conversion (when trial converts to paid subscription)
   */
  static trackTrialConverted(customerInfo: CustomerInfo, packageInfo?: PurchasesPackage) {
    const productId = packageInfo?.product.identifier || 'unknown';
    const userId = customerInfo.originalAppUserId;
    const revenue = packageInfo?.product.price || 0;
    const currency = packageInfo?.product.currencyCode || 'USD';
    
    console.log('💰 Trial converted:', { productId, userId, revenue, currency });
    // AdjustEvents.trackRCTrialConverted(productId, revenue, currency, userId);
  }

  /**
   * Track trial cancellation
   */
  static trackTrialCancelled(customerInfo: CustomerInfo, productId: string) {
    const userId = customerInfo.originalAppUserId;
    
    console.log('❌ Trial cancelled:', { productId, userId });
    // AdjustEvents.trackRCTrialCancelled(productId, userId);
  }

  /**
   * Track initial purchase (first time purchase)
   */
  static trackInitialPurchase(customerInfo: CustomerInfo, packageInfo: PurchasesPackage) {
    const productId = packageInfo.product.identifier;
    const userId = customerInfo.originalAppUserId;
    const revenue = packageInfo.product.price;
    const currency = packageInfo.product.currencyCode || 'USD';
    
    console.log('🎉 Initial purchase:', { productId, userId, revenue, currency });
    // AdjustEvents.trackRCInitialPurchase(productId, revenue, currency, userId);
  }

  /**
   * Track subscription renewal
   */
  static trackRenewal(customerInfo: CustomerInfo, packageInfo?: PurchasesPackage) {
    const productId = packageInfo?.product.identifier || 'unknown';
    const userId = customerInfo.originalAppUserId;
    const revenue = packageInfo?.product.price || 0;
    const currency = packageInfo?.product.currencyCode || 'USD';
    
    console.log('🔄 Subscription renewed:', { productId, userId, revenue, currency });
    // AdjustEvents.trackRCRenewal(productId, revenue, currency, userId);
  }

  /**
   * Track subscription cancellation
   */
  static trackCancellation(customerInfo: CustomerInfo, productId: string) {
    const userId = customerInfo.originalAppUserId;
    
    console.log('🚫 Subscription cancelled:', { productId, userId });
    // AdjustEvents.trackRCCancellation(productId, userId);
  }

  /**
   * Track subscription expiration
   */
  static trackExpiration(customerInfo: CustomerInfo, productId: string) {
    const userId = customerInfo.originalAppUserId;
    
    console.log('⏰ Subscription expired:', { productId, userId });
    // AdjustEvents.trackRCExpiration(productId, userId);
  }

  /**
   * Track product change (upgrade/downgrade)
   */
  static trackProductChange(customerInfo: CustomerInfo, oldProductId: string, newProductId: string) {
    const userId = customerInfo.originalAppUserId;
    
    console.log('🔄 Product changed:', { oldProductId, newProductId, userId });
    // AdjustEvents.trackRCProductChange(oldProductId, newProductId, userId);
  }

  /**
   * Track non-subscription purchase (one-time purchases)
   */
  static trackNonSubscriptionPurchase(customerInfo: CustomerInfo, packageInfo: PurchasesPackage) {
    const productId = packageInfo.product.identifier;
    const userId = customerInfo.originalAppUserId;
    const revenue = packageInfo.product.price;
    const currency = packageInfo.product.currencyCode || 'USD';
    
    console.log('💳 Non-subscription purchase:', { productId, userId, revenue, currency });
    // AdjustEvents.trackRCNonSubscriptionPurchase(productId, revenue, currency, userId);
  }

  /**
   * Comprehensive handler for Revenue Cat purchase updates
   * Call this from your Revenue Cat purchase listener
   */
  static handlePurchaseUpdate(customerInfo: CustomerInfo, packageInfo?: PurchasesPackage) {
    try {
      // Check if this is the first purchase
      const isFirstPurchase = Object.keys(customerInfo.allPurchaseDates).length === 1;
      
      // Check if user is in trial
      const activeEntitlements = customerInfo.activeSubscriptions;
      const isTrialActive = Object.values(customerInfo.entitlements.active).some(
        entitlement => entitlement.periodType === 'TRIAL'
      );
      
      if (packageInfo) {
        if (isFirstPurchase) {
          this.trackInitialPurchase(customerInfo, packageInfo);
        } else if (isTrialActive) {
          this.trackTrialStarted(customerInfo, packageInfo);
        } else {
          // This is a renewal or subscription purchase
          this.trackRenewal(customerInfo, packageInfo);
        }
      }
      
    } catch (error) {
      console.error('Error handling Revenue Cat purchase update:', error);
    }
  }

  /**
   * Helper to determine subscription status changes
   * Call this when customer info updates to track status changes
   */
  static handleCustomerInfoUpdate(
    previousCustomerInfo: CustomerInfo | null, 
    currentCustomerInfo: CustomerInfo
  ) {
    try {
      if (!previousCustomerInfo) return;
      
      // Check for trial conversions
      const previousTrials = Object.values(previousCustomerInfo.entitlements.active).filter(
        e => e.periodType === 'TRIAL'
      );
      const currentTrials = Object.values(currentCustomerInfo.entitlements.active).filter(
        e => e.periodType === 'TRIAL'
      );
      
      // Check for subscription changes
      const previousSubs = Object.keys(previousCustomerInfo.activeSubscriptions);
      const currentSubs = Object.keys(currentCustomerInfo.activeSubscriptions);
      
      // Track trial conversions
      if (previousTrials.length > 0 && currentTrials.length === 0) {
        // Trial converted to paid subscription
        previousTrials.forEach(trial => {
          this.trackTrialConverted(currentCustomerInfo);
        });
      }
      
      // Track cancellations (when subscription becomes inactive)
      const cancelledSubs = previousSubs.filter(sub => !currentSubs.includes(sub));
      cancelledSubs.forEach(productId => {
        this.trackCancellation(currentCustomerInfo, productId);
      });
      
    } catch (error) {
      console.error('Error handling customer info update:', error);
    }
  }
}

export default RevenueCatAdjustIntegration; 