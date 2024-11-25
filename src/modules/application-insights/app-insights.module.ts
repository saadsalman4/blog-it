import { Module } from '@nestjs/common';
import { AppInsightsProvider } from '../../providers/app-insights.provider';

@Module({
  providers: [AppInsightsProvider],
  exports: [AppInsightsProvider],
})
export class AppInsightsModule {}
