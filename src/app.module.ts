import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { sequelizeConfig } from './config/sequelize.config';
import { UserModule } from './modules/user/user.module';
import { UserOtpModule } from './modules/user-otp/user-otp.module';
import { ApiTokenModule } from './modules/api-token/api-token.module';
import { BlogModule } from './modules/blog/blog.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthMiddleware } from './middleware/auth.middleware';
import { ApiTokenService } from './modules/api-token/api-token.service';
import { ApiTokenController } from './modules/api-token/api-token.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SequelizeModule.forRoot(sequelizeConfig),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET_KEY'),
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
    UserModule,
    UserOtpModule,
    ApiTokenModule,
    BlogModule,
  ],
  controllers: [AppController, ApiTokenController],
  providers: [AppService, JwtService, ApiTokenService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('blog'); // Ensure the path is correct
  }
}
