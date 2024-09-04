import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import { ApiToken } from '../modules/api-token/api-token.model';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel(ApiToken) private readonly apiTokenModel: typeof ApiToken,
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
      console.log('Decoded token:', decodedToken);

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

      req['user'] = decodedToken; // Attach user info to request if needed
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
