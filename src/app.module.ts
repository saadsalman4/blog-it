import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { sequelizeConfig } from './config/sequelize.config';
import { UserModule } from './modules/user/user.module';
import { UserOtpModule } from './modules/user-otp/user-otp.module';
import { ApiTokenModule } from './modules/api-token/api-token.module';
import { BlogModule } from './modules/blog/blog.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SequelizeModule.forRoot(sequelizeConfig),
    UserModule,
    UserOtpModule,
    ApiTokenModule,
    BlogModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
