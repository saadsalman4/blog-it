import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { User } from '../user/user.model';
import { Blog } from '../blog/blog.model';
import { Comment } from '../comment/comment.model';

@Module({
  imports: [
    SequelizeModule.forFeature([User, Blog, Comment]), // Import models
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}