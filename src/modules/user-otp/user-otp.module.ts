// src/modules/user-otp/user-otp.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserOtp } from './user-otp.model';
import { UserOtpService } from './user-otp.service';
import { UserOtpController } from './user-otp.controller';

@Module({
  imports: [SequelizeModule.forFeature([UserOtp])], // Register the UserOtp model
  providers: [UserOtpService],
  controllers: [UserOtpController],
})
export class UserOtpModule {}
