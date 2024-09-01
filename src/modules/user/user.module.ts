// src/modules/user/user.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './user.model';
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  imports: [SequelizeModule.forFeature([User])], // Register the User model
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
