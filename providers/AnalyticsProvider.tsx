import React, { createContext, useContext, useEffect } from 'react';

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
}

export interface AnalyticsProvider {
  initialize(): Promise<void>;
  identify(userId: string, traits?: Record<string, any>): void;
  track(event: AnalyticsEvent): void;
  reset(): void;
}

interface AnalyticsContextType {
  analytics: AnalyticsProvider;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context.analytics;
};

interface AnalyticsProviderProps {
  provider: AnalyticsProvider;
  children: React.ReactNode;
}

export const AnalyticsProviderComponent: React.FC<AnalyticsProviderProps> = ({
  provider,
  children
}) => {
  // Ensure the underlying analytics provider is initialized as soon as this
  // context provider is mounted. The initialise method is responsible for any
  // async setup (e.g. establishing native bridges, fetching stored identities,
  // etc.).
  useEffect(() => {
    // Initialize only once for the given provider instance
    provider.initialize();
    // `provider` should be stable (provided via useMemo/useState at the call
    // site). If the reference does change, re-initialise to avoid using a
    // stale instance.
  }, [provider]);
  return (
    <AnalyticsContext.Provider value={{ analytics: provider }}>
      {children}
    </AnalyticsContext.Provider>
  );
}; 