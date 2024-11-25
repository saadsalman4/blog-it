import { HttpException, HttpStatus, Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Comment } from './comment.model';
import { Blog } from '../blog/blog.model';
import { User } from '../user/user.model';
import { CreateCommentDto } from './dto/comment.dto';
const axios = require('axios');
import * as appInsights from 'applicationinsights';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(Comment)
    private readonly commentModel: typeof Comment,
    @InjectModel(Blog) 
    private readonly blogModel: typeof Blog,
    @InjectModel(User)
    private readonly userModel: typeof User,
    @Inject('APP_INSIGHTS') private readonly appInsightsClient: appInsights.TelemetryClient,
  ) {}

  async createComment(userSlug: string, createCommentDto: CreateCommentDto) {
    const { comment, blog_slug } = createCommentDto;
  
    try {
      // Track the function call
      this.appInsightsClient.trackEvent({
        name: 'createCommentCalled',
        properties: { userSlug, blog_slug },
      });
  
      // Create the comment in the database
      const newComment = await this.commentModel.create({
        comment,
        blog_slug,
        user_slug: userSlug,
      });
  
      // Track the successful database creation
      this.appInsightsClient.trackEvent({
        name: 'commentCreated',
        properties: { commentSlug: newComment.slug, userSlug, blog_slug },
      });
  
      // Fetch the blog owner and blog title for the email notification
      const blog = await this.blogModel.findOne({
        where: { slug: blog_slug },
        include: [{ all: true }],
      });
  
      if (userSlug !== blog.user_slug) {
        // Fetch the comment author's full name
        const commentAuthor = await this.userModel.findOne({
          where: { slug: userSlug },
        });
  
        if (blog && commentAuthor) {
          const blogOwnerEmail = blog.user.email;
          const blogTitle = blog.title;
          const commentAuthorName = commentAuthor.fullName;
  
          try {
            // Call the Azure Function
            await axios.post(process.env.AZURE_MAIL_NOTIFICATION_API, {
              blogTitle,
              commentAuthor: commentAuthorName,
              blogOwnerEmail,
              comment,
            });
  
            // Track the successful email notification
            this.appInsightsClient.trackEvent({
              name: 'emailNotificationSent',
              properties: {
                blogTitle,
                commentAuthorName,
                blogOwnerEmail,
                comment,
              },
            });
  
            console.log('Email notification sent successfully');
          } catch (error) {
            // Track the email notification error
            this.appInsightsClient.trackException({
              exception: error,
              properties: { blogOwnerEmail, blogTitle },
            });
  
            console.error('Error sending email notification:', error.message);
          }
        }
      }
  
      return newComment;
    } catch (error) {
      // Track any error in the function
      this.appInsightsClient.trackException({
        exception: error,
        properties: { userSlug, blog_slug, comment },
      });
  
      console.error('Error in createComment:', error.message);
      throw error;
    }
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
