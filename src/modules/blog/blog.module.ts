import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Blog } from './blog.model';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';

@Module({
  imports: [SequelizeModule.forFeature([Blog])], // Register the Blog model
  providers: [BlogService],
  controllers: [BlogController],
})
export class BlogModule {}
