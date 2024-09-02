import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Blog } from './blog.model';
import { BlogDto } from './dto/blog.dto';

@Injectable()
export class BlogService {
  constructor(@InjectModel(Blog) private readonly blogModel: typeof Blog) {}

  async createBlog(userSlug: string, blogDto: BlogDto, mediaPath: string) {
    const blog = await this.blogModel.create({
      ...blogDto,
      user_slug: userSlug,
      media: mediaPath,
    });
    return blog;
  }
}
