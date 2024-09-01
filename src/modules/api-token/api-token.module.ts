import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ApiToken } from './api-token.model';
import { ApiTokenService } from './api-token.service';
import { ApiTokenController } from './api-token.controller';

@Module({
  imports: [SequelizeModule.forFeature([ApiToken])], // Register the ApiToken model
  providers: [ApiTokenService],
  controllers: [ApiTokenController],
})
export class ApiTokenModule {}
