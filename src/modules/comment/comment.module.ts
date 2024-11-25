import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Comment } from './comment.model';
import { User } from '../user/user.model';
import { Blog } from '../blog/blog.model';
import { AppInsightsProvider } from 'src/providers/app-insights.provider';

@Module({
  controllers: [CommentController],
  providers: [CommentService, AppInsightsProvider],
  imports: [SequelizeModule.forFeature([Comment, User, Blog])],
  exports: [SequelizeModule, AppInsightsProvider],
})
export class CommentModule {}
