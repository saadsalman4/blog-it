import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './user.model';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserOtp } from '../user-otp/user-otp.model';
import { JwtModule } from '@nestjs/jwt';
import { ApiToken } from '../api-token/api-token.model';
import { Relationship } from '../relationship/relationship.model';

@Module({
  imports: [
    SequelizeModule.forFeature([User, UserOtp, ApiToken, Relationship]),
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY,
      signOptions: { expiresIn: '24h' },
    }),
  ],
  exports: [SequelizeModule],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
