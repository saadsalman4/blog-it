import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Blog } from './blog.model';
import { BlogDto } from './dto/blog.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BlogService {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Blog) private readonly blogModel: typeof Blog,
  ) {}

  async createBlog(userSlug: string, blogDto: BlogDto, mediaPath: string) {
    const blog = await this.blogModel.create({
      ...blogDto,
      user_slug: userSlug,
      media: mediaPath,
    });
    blog.media = this.configService.get<string>('domain') + mediaPath;
    return blog;
  }

  async removeBlog(userSlug: string, blogSlug: string) {
    const blog = await this.blogModel.findOne({
      where: { slug: blogSlug, user_slug: userSlug },
    });

    if (!blog) {
      console.log('HERE');
      throw new HttpException('Cannot find blog', HttpStatus.NOT_FOUND);
    }

    return await this.blogModel.destroy({
      where: { slug: blogSlug, user_slug: userSlug },
    });
  }
}
