import {
    Injectable,
    NestMiddleware,
    ForbiddenException,
    UnauthorizedException,
  } from '@nestjs/common';
  import { Request, Response, NextFunction } from 'express';
  import { JwtService } from '@nestjs/jwt';
  import { InjectModel } from '@nestjs/sequelize';
  import { ApiToken } from '../modules/api-token/api-token.model';
  import { ConfigService } from '@nestjs/config';
  import { User } from '../modules/user/user.model';

  @Injectable()
  export class AdminAuthMiddleware implements NestMiddleware {
    constructor(
      private readonly jwtService: JwtService,
      private readonly configService: ConfigService,
      @InjectModel(ApiToken) private readonly apiTokenModel: typeof ApiToken,
      @InjectModel(User) private readonly userModel: typeof User,
    ) {}

    async use(req: Request, res: Response, next: NextFunction) {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new UnauthorizedException({
          code: 401,
          message: 'No token provided',
          data: [],
        });
      }
      const token = authHeader;

      try {
        // Decode and verify token using secret key
        const secretKey = this.configService.get<string>('JWT_SECRET_KEY');
        const decodedToken = this.jwtService.verify(token, { secret: secretKey });

        // Check if token is active
        const apiToken = await this.apiTokenModel.findOne({
          where: { api_token: token, is_active: true },
        });

        if (!apiToken) {
          throw new UnauthorizedException({
            code: 401,
            message: 'Token is inactive or invalid',
            data: [],
          });
        }

        // Check user role
        const user = await this.userModel.findOne({ where: { slug: decodedToken.userSlug } });
        if (!user) {
          throw new UnauthorizedException({
            code: 401,
            message: 'User not found',
            data: [],
          });
        }

        // Assuming the endpoint requires admin access
        if (user.role !== 'admin') {
          throw new ForbiddenException({
            code: 403,
            message: 'Access denied: Admins only',
            data: [],
          });
        }

        if(apiToken.token_type!='admin'){
          throw new ForbiddenException({
            code: 403,
            message: 'Access denied: Admins only',
            data: [],
          });
        }

        req['user'] = decodedToken; // Attach user info to request
        next();
      } catch (error) {
        console.log(error);
        throw new UnauthorizedException({
          code: 401,
          message: 'Token verification failed',
          data: [],
        });
      }
    }
  }