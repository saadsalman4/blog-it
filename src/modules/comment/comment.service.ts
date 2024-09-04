import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Comment } from './comment.model';
import { CreateCommentDto } from './dto/comment.dto';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(Comment)
    private readonly commentModel: typeof Comment,
  ) {}

  async createComment(userSlug: string, createCommentDto: CreateCommentDto) {
    const { comment, blog_slug } = createCommentDto;
    return await this.commentModel.create({
      comment,
      blog_slug,
      user_slug: userSlug,
    });
  }

  async removeComment(userSlug: string, commentSlug: string) {
    const comment = await this.commentModel.findOne({
      where: { slug: commentSlug, user_slug: userSlug },
    });

    if (!comment) {
      console.log('HERE');
      throw new HttpException('Cannot find comment', HttpStatus.NOT_FOUND);
    }

    return await this.commentModel.destroy({
      where: { slug: commentSlug, user_slug: userSlug },
    });
  }
}
