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
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { VoteController } from './modules/vote/vote.controller';
import { VoteModule } from './modules/vote/vote.module';
import { VoteService } from './modules/vote/vote.service';
import { CommentController } from './modules/comment/comment.controller';
import { CommentModule } from './modules/comment/comment.module';
import { CommentService } from './modules/comment/comment.service';
import { RelationshipModule } from './modules/relationship/relationship.module';

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
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'), // Path to your static files directory
    }),
    UserModule,
    UserOtpModule,
    ApiTokenModule,
    BlogModule,
    VoteModule,
    CommentModule,
    RelationshipModule,
  ],
  controllers: [
    AppController,
    ApiTokenController,
    VoteController,
    CommentController,
  ],
  providers: [
    AppService,
    JwtService,
    ApiTokenService,
    VoteService,
    CommentService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('blog/create');
    consumer.apply(AuthMiddleware).forRoutes('blog/delete');
    consumer.apply(AuthMiddleware).forRoutes('blog/following');
    consumer.apply(AuthMiddleware).forRoutes('vote');
    consumer.apply(AuthMiddleware).forRoutes('comments');
    consumer.apply(AuthMiddleware).forRoutes('relationships');
  }
}
