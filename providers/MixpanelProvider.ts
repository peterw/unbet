import { Mixpanel } from 'mixpanel-react-native';
import { AnalyticsEvent, AnalyticsProvider } from '@/providers/AnalyticsProvider';

export class MixpanelProvider implements AnalyticsProvider {
  private client: Mixpanel | null = null;

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