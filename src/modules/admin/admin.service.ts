import { BadRequestException, HttpStatus, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../user/user.model';
import { Blog } from '../blog/blog.model';
import { ApiToken } from '../api-token/api-token.model';
import { Comment } from '../comment/comment.model';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';


@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Blog) private readonly blogModel: typeof Blog,
    @InjectModel(Comment) private readonly commentModel: typeof Comment,
    @InjectModel(ApiToken) private readonly apiTokenModel: typeof ApiToken,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}


  async login(email: string, password: string): Promise<any> {
    const user = await this.userModel.findOne({ where: { email, role:'admin' } });
    const secretKey = this.configService.get<string>('JWT_SECRET_KEY');
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }


    const payload = { userSlug: user.slug, fullName: user.fullName };

    const token = this.jwtService.sign(payload, {
      secret: secretKey,
      expiresIn: '24h',
    });

    await this.apiTokenModel.update(
      { is_active: false },
      { where: { user_slug: user.slug, is_active: true } },
    );

      await this.apiTokenModel.create({
            api_token: token,
            token_type: 'admin',
            is_active: true,
            user_slug: user.slug,
          });

    return {
      code: 200,
      message: 'Login successful',
      data: {
        email: user.email,
        fullName: user.fullName,
        token: token,
      },
    };
  }


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