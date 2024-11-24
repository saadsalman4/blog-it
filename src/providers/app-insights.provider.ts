import * as appInsights from 'applicationinsights';

export const AppInsightsProvider = {
  provide: 'APP_INSIGHTS',
  useFactory: () => {
    appInsights
      .setup(process.env.APPINSIGHTS_INSTRUMENTATIONKEY)
      .setAutoCollectRequests(true)
      .setAutoCollectPerformance(true, true) // Fix: Provide `collectExtendedMetrics`
      .setAutoCollectDependencies(true)
      .setAutoCollectExceptions(true)
      .setAutoCollectConsole(true, true) // Enable console logging
      .start();

    return appInsights.defaultClient; // Fix: Use `defaultClient` from `appInsights`
  },
};
