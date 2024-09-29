import {
  ForbiddenException,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import { ApiToken } from '../modules/api-token/api-token.model';
import { ConfigService } from '@nestjs/config';
import { User } from '../modules/user/user.model';


@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel(ApiToken) private readonly apiTokenModel: typeof ApiToken,
    @InjectModel(User) private readonly userModel: typeof User
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
      const secretKey = this.configService.get<string>('JWT_SECRET_KEY');
      const decodedToken = this.jwtService.verify(token, { secret: secretKey });
  
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
  
      // Check if user is blocked
      const user = await this.userModel.findOne({ where: { slug: decodedToken.userSlug } });
      if (!user) {
        throw new UnauthorizedException({
          code: 401,
          message: 'User not found',
          data: [],
        });
      }
  
      // Return 403 if the user is blocked
      if (user.blocked) {
        throw new ForbiddenException({
          code: 403,
          message: 'User is blocked',
          data: [],
        });
      }
  
      req['user'] = decodedToken;
      next();
    } catch (error) {
      console.log(error);
      if (error.status === 403) {
        throw new ForbiddenException({
          code: 403,
          message: 'User is blocked',
          data: [],
        });
      }
      throw new UnauthorizedException({
        code: 401,
        message: 'Token verification failed',
        data: [],
      });
    }
  }
  
  
}