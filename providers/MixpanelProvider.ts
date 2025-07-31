import { Platform } from 'react-native';
import { isExpoGo } from '@/utils/isExpoGo';
import { AnalyticsEvent, AnalyticsProvider } from '@/providers/AnalyticsProvider';

// Only import Mixpanel on native platforms
let Mixpanel: any;

if (Platform.OS !== 'web' && !isExpoGo()) {
  try {
    Mixpanel = require('mixpanel-react-native').Mixpanel;
  } catch (error) {
    console.warn('Failed to load mixpanel-react-native:', error);
  }
}

export class MixpanelProvider implements AnalyticsProvider {
  private client: any = null;

  constructor(
    private readonly token: string,
    private readonly trackAutomaticEvents = true
  ) {}

  async initialize(): Promise<void> {
    // Prevent re-initialization if already initialized
    if (this.client) {
      console.log('Mixpanel already initialized');
      return;
    }

    // Skip initialization in Expo Go
    if (!Mixpanel || isExpoGo()) {
      console.log('Mixpanel not initialized - Expo Go or module not available');
      return;
    }
    
    try {
      this.client = new Mixpanel(this.token, this.trackAutomaticEvents);
      await this.client.init();
      console.log('Mixpanel initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Mixpanel:', error);
      // Set client to null to allow retry if needed
      this.client = null;
    }
  }

  identify(userId: string, traits?: Record<string, any>): void {
    if (!this.client) return;

    this.client.identify(userId);
    if (traits) {
      this.client.getPeople().set(traits);
    }
  }

  track(event: AnalyticsEvent): void {
    if (!this.client) return;

    this.client.track(event.name, event.properties);
  }

  reset(): void {
    if (!this.client) return;
    
    this.client.reset();
  }
} 