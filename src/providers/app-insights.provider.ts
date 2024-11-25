import * as appInsights from 'applicationinsights';
import { Provider } from '@nestjs/common';

export const AppInsightsProvider: Provider = {
  provide: 'APP_INSIGHTS',
  useFactory: () => {
    appInsights.setup(process.env.APPINSIGHTS_INSTRUMENTATIONKEY)
      .setAutoDependencyCorrelation(true)
      .setAutoCollectRequests(true)
      .setAutoCollectPerformance(true, true)
      .setAutoCollectExceptions(true)
      .setAutoCollectDependencies(true)
      .setAutoCollectConsole(true, true)
      .setUseDiskRetryCaching(true)
      .start();

    return appInsights.defaultClient; // Ensure this returns the correct client
  },
};
