import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Blog } from './blog.model';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { Vote } from '../vote/vote.model';
import { User } from '../user/user.model';
import { Comment } from '../comment/comment.model';
import { Relationship } from '../relationship/relationship.model';

@Module({
  imports: [
    SequelizeModule.forFeature([Blog, Vote, Comment, User, Relationship]),
  ],

  providers: [BlogService],
  controllers: [BlogController],
})
export class BlogModule {}
