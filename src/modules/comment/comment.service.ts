import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Comment } from './comment.model';
import { Blog } from '../blog/blog.model';
import { User } from '../user/user.model';
import { CreateCommentDto } from './dto/comment.dto';
const axios = require('axios');

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(Comment)
    private readonly commentModel: typeof Comment,
    @InjectModel(Blog) 
    private readonly blogModel: typeof Blog,
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  async createComment(userSlug: string, createCommentDto: CreateCommentDto) {
    const { comment, blog_slug } = createCommentDto;

    // Create the comment in the database
    const newComment = await this.commentModel.create({
      comment,
      blog_slug,
      user_slug: userSlug,
    });

    // Fetch the blog owner and blog title for the email notification
    const blog = await this.blogModel.findOne({
      where: { slug: blog_slug },
      include: [{ all: true }], // Adjust as needed to get the blog owner's details
    });

    // Fetch the comment author's full name
    const commentAuthor = await this.userModel.findOne({
      where: { slug: userSlug },
    });

    if (blog && commentAuthor) {
      const blogOwnerEmail = blog.user.email; // Assuming blog has a user association with an email field
      const blogTitle = blog.title;
      const commentAuthorName = commentAuthor.fullName; // Fetch the full name of the comment author

      // Call the Azure Function using Axios
      try {
        await axios.post(process.env.AZURE_MAIL_NOTIFICATION_API, {
          blogTitle,
          commentAuthor: commentAuthorName, // Use the author's full name
          blogOwnerEmail,
          comment,
        });

        console.log('Email notification sent successfully');
      } catch (error) {
        console.error('Error sending email notification:', error.message);
      }
    }

    return newComment;
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
