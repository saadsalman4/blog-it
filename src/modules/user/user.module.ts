import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './user.model';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserOtp } from '../user-otp/user-otp.model';
import { JwtModule } from '@nestjs/jwt';
import { ApiToken } from '../api-token/api-token.model';
import { Relationship } from '../relationship/relationship.model';
import { AppInsightsModule } from '../application-insights/app-insights.module';
import { AppInsightsProvider } from 'src/providers/app-insights.provider';

@Module({
  imports: [
    SequelizeModule.forFeature([User, UserOtp, ApiToken, Relationship]),
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY,
      signOptions: { expiresIn: '24h' },
    }),
    AppInsightsModule
  ],
  exports: [SequelizeModule, UserService],
  providers: [UserService, AppInsightsProvider],
  controllers: [UserController],
})
export class UserModule {}
