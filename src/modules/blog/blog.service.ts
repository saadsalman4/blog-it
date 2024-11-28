import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Blog } from './blog.model';
import { BlogDto } from './dto/blog.dto';
import { ConfigService } from '@nestjs/config';
import { Vote } from '../vote/vote.model';
import { Comment } from '../comment/comment.model';
import { User } from '../user/user.model';
import { Relationship } from '../relationship/relationship.model';
import axios from 'axios';

@Injectable()
export class BlogService {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Blog) private readonly blogModel: typeof Blog,
    @InjectModel(Vote) private readonly voteModel: typeof Vote,
    @InjectModel(Comment) private readonly commentModel: typeof Comment,
    @InjectModel(Relationship) private relationshipModel: typeof Relationship,
  ) {}

  async createBlog(userSlug: string, blogDto: BlogDto, mediaPath: string) {
    const blog = await this.blogModel.create({
      ...blogDto,
      user_slug: userSlug,
      media: mediaPath,
    });
    // blog.media = this.configService.get<string>('domain') + mediaPath;
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

  async getAllBlogs(page: number) {
    const limit = 6;
    const offset = (page - 1) * limit;
  
    const blogs = await this.blogModel.findAll({
      attributes: [
        'slug',
        'title',
        'media',
        'description',
        'user_slug',
        [
          this.voteModel.sequelize.literal(
            `(SELECT COUNT(*) FROM [Votes] WHERE [Votes].[blog_slug] = [Blog].[slug] AND [Votes].[type] = 'upvote')`
          ),
          'upvotes',
        ],
        [
          this.voteModel.sequelize.literal(
            `(SELECT COUNT(*) FROM [Votes] WHERE [Votes].[blog_slug] = [Blog].[slug] AND [Votes].[type] = 'downvote')`
          ),
          'downvotes',
        ],
        [
          this.commentModel.sequelize.literal(
            `(SELECT COUNT(*) FROM [Comments] WHERE [Comments].[blog_slug] = [Blog].[slug])`
          ),
          'commentsCount',
        ],
        [
          this.voteModel.sequelize.literal(
            `(SELECT COUNT(*) FROM [Votes] WHERE [Votes].[blog_slug] = [Blog].[slug] AND [Votes].[type] = 'upvote') -
            (SELECT COUNT(*) FROM [Votes] WHERE [Votes].[blog_slug] = [Blog].[slug] AND [Votes].[type] = 'downvote')`
          ),
          'ranking',
        ],
      ],
      include: [
        {
          model: User,
          attributes: ['fullName', 'profileImg'],
        },
      ],
      order: [[this.voteModel.sequelize.literal('ranking'), 'DESC']],
      limit,
      offset,
    });
  
    return blogs;
  }

  async getBlog(blogSlug: string, userSlug: string | null) {
    const blog = await this.blogModel.findOne({
      where: { slug: blogSlug },
      attributes: {
        include: [
          [
            this.voteModel.sequelize.literal(
              `(SELECT COUNT(*) FROM [Votes] WHERE [Votes].[blog_slug] = [Blog].[slug] AND [Votes].[type] = 'upvote')`
            ),
            'upvotes',
          ],
          [
            this.voteModel.sequelize.literal(
              `(SELECT COUNT(*) FROM [Votes] WHERE [Votes].[blog_slug] = [Blog].[slug] AND [Votes].[type] = 'downvote')`
            ),
            'downvotes',
          ],
        ],
      },
      include: [
        {
          model: User,
          attributes: ['fullName', 'email', 'profileImg', 'slug'],
        },
        {
          model: Comment,
          include: [
            {
              model: User,
              attributes: ['fullName', 'profileImg'],
            },
          ],
        },
      ],
    });
  
    if (!blog) {
      throw new HttpException('Cannot find blog', HttpStatus.NOT_FOUND);
    }
  
    // Format media and profile images if needed
    if (blog.comments) {
      blog.comments = blog.comments.map((comment) => {
        return comment;
      });
    }
  
    // Check if the logged-in user is following the blog author
    let followStatus = null;
    if (userSlug) {
      const following = await this.relationshipModel.findOne({
        where: {
          follower_id: userSlug,
          followed_id: blog.user_slug, // Assuming user_slug is the slug of the blog author
        },
      });
  
      if (following) {
        followStatus = 'following';
      } else if (blog.user_slug === userSlug) {
        followStatus = 'own';
      } else {
        followStatus = 'not_following';
      }
    } else {
      followStatus = 'not_logged_in';
    }
  
    // Determine voting status
    let votingStatus = 'no_vote';
    if (userSlug) {
      const vote = await this.voteModel.findOne({
        where: { user_slug: userSlug, blog_slug: blogSlug },
      });
      if (vote) {
        votingStatus = vote.type === 'upvote' ? 'upvoted' : 'downvoted';
      }
    }
  
    return {
      blog,
      followStatus,
      votingStatus,
    };
  }
  


  async getFollowedUsersBlogs(userSlug: string, page: number) {
    const limit = 6;
    const offset = (page - 1) * limit;
  
    // Get all followed users by the current user
    const followedUsers = await this.relationshipModel.findAll({
      where: { follower_id: userSlug },
      attributes: ['followed_id'],
    });
  
    // Map the followed user IDs
    const followedIds = followedUsers.map((rel) => rel.followed_id);
  
    if (followedIds.length === 0) {
      return []; // If no users are followed, return an empty array
    }
  
    // Fetch blogs by followed users with upvotes, downvotes, and comments count
    const blogs = await this.blogModel.findAll({
      where: {
        user_slug: followedIds,
      },
      attributes: [
        'slug',
        'title',
        'media',
        'description',
        'user_slug',
        [
          this.voteModel.sequelize.literal(
            `(SELECT COUNT(*) FROM [Votes] WHERE [Votes].[blog_slug] = [Blog].[slug] AND [Votes].[type] = 'upvote')`
          ),
          'upvotes',
        ],
        [
          this.voteModel.sequelize.literal(
            `(SELECT COUNT(*) FROM [Votes] WHERE [Votes].[blog_slug] = [Blog].[slug] AND [Votes].[type] = 'downvote')`
          ),
          'downvotes',
        ],
        [
          this.commentModel.sequelize.literal(
            `(SELECT COUNT(*) FROM [Comments] WHERE [Comments].[blog_slug] = [Blog].[slug])`
          ),
          'commentsCount',
        ],
        [
          this.voteModel.sequelize.literal(
            `((SELECT COUNT(*) FROM [Votes] WHERE [Votes].[blog_slug] = [Blog].[slug] AND [Votes].[type] = 'upvote') - 
              (SELECT COUNT(*) FROM [Votes] WHERE [Votes].[blog_slug] = [Blog].[slug] AND [Votes].[type] = 'downvote'))`
          ),
          'ranking',
        ],
      ],
      include: [
        {
          model: User,
          attributes: ['fullName', 'profileImg'],
        },
      ],
      order: [[this.voteModel.sequelize.literal('ranking'), 'DESC']],
      limit,
      offset,
    });
  
    return blogs;
  }
  

  async getUserBlogs(userSlug: string, page: number) {
    const limit = 6;
    const offset = (page - 1) * limit;
  
    const blogs = await this.blogModel.findAll({
      where: { user_slug: userSlug },
      attributes: [
        'slug',
        'title',
        'media',
        'description',
        'user_slug',
        [
          this.voteModel.sequelize.literal(
            `(SELECT COUNT(*) FROM [Votes] WHERE [Votes].[blog_slug] = [Blog].[slug] AND [Votes].[type] = 'upvote')`
          ),
          'upvotes',
        ],
        [
          this.voteModel.sequelize.literal(
            `(SELECT COUNT(*) FROM [Votes] WHERE [Votes].[blog_slug] = [Blog].[slug] AND [Votes].[type] = 'downvote')`
          ),
          'downvotes',
        ],
        [
          this.commentModel.sequelize.literal(
            `(SELECT COUNT(*) FROM [Comments] WHERE [Comments].[blog_slug] = [Blog].[slug])`
          ),
          'commentsCount',
        ],
        [
          this.voteModel.sequelize.literal(
            `((SELECT COUNT(*) FROM [Votes] WHERE [Votes].[blog_slug] = [Blog].[slug] AND [Votes].[type] = 'upvote') -
             (SELECT COUNT(*) FROM [Votes] WHERE [Votes].[blog_slug] = [Blog].[slug] AND [Votes].[type] = 'downvote'))`
          ),
          'ranking',
        ],
      ],
      include: [
        {
          model: User,
          attributes: ['fullName', 'profileImg'],
        },
      ],
      order: [[this.voteModel.sequelize.literal('ranking'), 'DESC']],
      limit,
      offset,
    });
  
    return blogs;
  }
  

  async roastBlog(blogSlug: string) {
    // Step 1: Fetch the blog from the database
    const blog = await this.blogModel.findOne({
        where: { slug: blogSlug },
        attributes: ['title', 'description', 'slug'], // Fetch only necessary fields
    });
    if (!blog) {
        throw new HttpException('Blog not found', HttpStatus.NOT_FOUND);
    }

    // Step 2: Prepare the blog content
    const blogContent = `
      Title: ${blog.title}
      Description: ${blog.description}
    `;

    // Step 3: Call the Azure Function for Groq processing
    const azureFunctionUrl = process.env.AZURE_FUNCTION_ROAST_URL; // Add this URL to your .env file

    try {
        const response = await axios.post(azureFunctionUrl, { blogContent });

        if (response.status === 200 && response.data.roast) {
            return { roast: response.data.roast };
        } else {
            throw new Error(response.data.error || 'Unknown error from Azure Function');
        }
    } catch (error) {
        throw new HttpException(
            `Failed to generate roast: ${error.message}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }
}
}
