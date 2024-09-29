import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../user/user.model';
import { Blog } from '../blog/blog.model';
import { Comment } from '../comment/comment.model';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Blog) private readonly blogModel: typeof Blog,
    @InjectModel(Comment) private readonly commentModel: typeof Comment,
  ) {}

  // Block a user
  async blockUser(userSlug: string): Promise<any> {
    const user = await this.userModel.findOne({ where: { slug: userSlug, role: 'user', blocked: false } });
    if (!user) {
      throw new NotFoundException({
        code: 404,
        message: 'User not found',
        data: [],
      });
    }
    user.blocked = true;
    await user.save();
    return {
      code: 200,
      message: 'User successfully blocked',
      data: { userSlug: user.slug },
    };
  }

  // Unblock a user
  async unblockUser(userSlug: string): Promise<any> {
    const user = await this.userModel.findOne({ where: { slug: userSlug, role: 'user', blocked: true } });
    if (!user) {
      throw new NotFoundException({
        code: 404,
        message: 'User not found',
        data: [],
      });
    }
    user.blocked = false;
    await user.save();
    return {
      code: 200,
      message: 'User successfully unblocked',
      data: { userSlug: user.slug },
    };
  }

  // Delete a blog
  async deleteBlog(blogSlug: string): Promise<any> {
    const blog = await this.blogModel.findOne({ where: { slug: blogSlug } });
    if (!blog) {
      throw new NotFoundException({
        code: 404,
        message: 'Blog not found',
        data: [],
      });
    }
    await blog.destroy();
    return {
      code: 200,
      message: 'Blog successfully deleted',
      data: { blogSlug: blog.slug },
    };
  }

  // Delete a comment
  async deleteComment(commentSlug: string): Promise<any> {
    const comment = await this.commentModel.findOne({ where: { slug: commentSlug } });
    if (!comment) {
      throw new NotFoundException({
        code: 404,
        message: 'Comment not found',
        data: [],
      });
    }
    await comment.destroy();
    return {
      code: 200,
      message: 'Comment successfully deleted',
      data: { commentSlug: comment.slug },
    };
  }

  async promoteToAdmin(email: string) {
    // Find the user by email
    const user = await this.userModel.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException({
        code: 404,
        message: 'User not found',
        data: [],
      });
    }

    // Check if the user is already an admin
    if (user.role === 'admin') {
      throw new BadRequestException({
        code: 400,
        message: 'User is already an admin',
        data: [],
      });
    }

    // Promote the user to admin
    user.role = 'admin';
    await user.save();

    return {
      email: user.email, role: user.role,
    };
  }
}
