import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Blog } from './blog.model';
import { BlogDto } from './dto/blog.dto';
import { ConfigService } from '@nestjs/config';
import { Vote } from '../vote/vote.model';
import { Comment } from '../comment/comment.model';
import { User } from '../user/user.model';
import { Relationship } from '../relationship/relationship.model';
import { Groq } from 'groq-sdk';

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
    const limit = 5;
    const offset = (page - 1) * limit;
    const domain = this.configService.get<string>('domain'); // Get domain from .env

    const blogs = await this.blogModel.findAll({
      attributes: [
        'slug',
        'title',
        'media',
        'description',
        'user_slug',
        [
          this.voteModel.sequelize.literal(
            `(SELECT COUNT(*) FROM \`Votes\` WHERE \`Votes\`.\`blog_slug\` = \`Blog\`.\`slug\` AND \`Votes\`.\`type\` = 'upvote')`,
          ),
          'upvotes',
        ],
        [
          this.voteModel.sequelize.literal(
            `(SELECT COUNT(*) FROM \`Votes\` WHERE \`Votes\`.\`blog_slug\` = \`Blog\`.\`slug\` AND \`Votes\`.\`type\` = 'downvote')`,
          ),
          'downvotes',
        ],
        [
          this.commentModel.sequelize.literal(
            `(SELECT COUNT(*) FROM \`Comments\` WHERE \`Comments\`.\`blog_slug\` = \`Blog\`.\`slug\`)`,
          ),
          'commentsCount',
        ],
        [
          this.voteModel.sequelize.literal(
            `(SELECT COUNT(*) FROM \`Votes\` WHERE \`Votes\`.\`blog_slug\` = \`Blog\`.\`slug\` AND \`Votes\`.\`type\` = 'upvote') -
          (SELECT COUNT(*) FROM \`Votes\` WHERE \`Votes\`.\`blog_slug\` = \`Blog\`.\`slug\` AND \`Votes\`.\`type\` = 'downvote')`,
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
    const domain = this.configService.get<string>('domain');
  
    const blog = await this.blogModel.findOne({
      where: { slug: blogSlug },
      attributes: {
        include: [
          [
            this.voteModel.sequelize.literal(
              `(SELECT COUNT(*) FROM \`Votes\` WHERE \`Votes\`.\`blog_slug\` = \`Blog\`.\`slug\` AND \`Votes\`.\`type\` = 'upvote')`,
            ),
            'upvotes',
          ],
          [
            this.voteModel.sequelize.literal(
              `(SELECT COUNT(*) FROM \`Votes\` WHERE \`Votes\`.\`blog_slug\` = \`Blog\`.\`slug\` AND \`Votes\`.\`type\` = 'downvote')`,
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
  
    // Format media and profile images
    blog.media = blog.media ? `${domain}${blog.media}` : null;
    blog.user.profileImg = blog.user.profileImg ? `${domain}${blog.user.profileImg}` : null;
  
    // Map over comments to format user profile images
    if (blog.comments) {
      blog.comments = blog.comments.map(comment => {
        comment.user.profileImg = comment.user.profileImg ? `${domain}${comment.user.profileImg}` : null;
        return comment;
      });
    }
  
    // Check if the logged-in user is following the blog author
    let followStatus = null; // Initialize follow status
    if (userSlug) {
      const following = await this.relationshipModel.findOne({
        where: {
          follower_id: userSlug,
          followed_id: blog.user_slug, // Assuming user_slug is the slug of the blog author
        },
      });
      
      if (following) {
        followStatus = 'following'; // The logged-in user is following the author
      } else if (blog.user_slug === userSlug) {
        followStatus = 'own'; // The logged-in user is the author
      } else {
        followStatus = 'not_following'; // The logged-in user is not following the author
      }
    } else {
      followStatus = 'not_logged_in'; // User is not logged in
    }

    let votingStatus = 'no_vote';
    if (userSlug) {
      const vote = await this.voteModel.findOne({
        where: { user_slug: userSlug, blog_slug: blogSlug },
      });
      if (vote) {
        if(vote.type=='upvote'){
          votingStatus='upvoted'
        }
        else{
          votingStatus='downvoted'
        }
      }
    }
  
    return {
      blog,
      followStatus,
      votingStatus,
    };
  }


  async getFollowedUsersBlogs(userSlug: string, page: number) {
    const limit = 5;
    const offset = (page - 1) * limit;
    const domain = this.configService.get<string>('domain');

    // Get all followed users by the current user
    const followedUsers = await this.relationshipModel.findAll({
      where: { follower_id: userSlug },
      attributes: ['followed_id'],
    });

    // Map the followed user IDs
    const followedIds = followedUsers.map((rel) => rel.followed_id);

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
            `(SELECT COUNT(*) FROM \`Votes\` WHERE \`Votes\`.\`blog_slug\` = \`Blog\`.\`slug\` AND \`Votes\`.\`type\` = 'upvote')`,
          ),
          'upvotes',
        ],
        [
          this.voteModel.sequelize.literal(
            `(SELECT COUNT(*) FROM \`Votes\` WHERE \`Votes\`.\`blog_slug\` = \`Blog\`.\`slug\` AND \`Votes\`.\`type\` = 'downvote')`,
          ),
          'downvotes',
        ],
        [
          this.commentModel.sequelize.literal(
            `(SELECT COUNT(*) FROM \`Comments\` WHERE \`Comments\`.\`blog_slug\` = \`Blog\`.\`slug\`)`,
          ),
          'commentsCount',
        ],
        [
          this.voteModel.sequelize.literal(
            `(SELECT COUNT(*) FROM \`Votes\` WHERE \`Votes\`.\`blog_slug\` = \`Blog\`.\`slug\` AND \`Votes\`.\`type\` = 'upvote') - 
             (SELECT COUNT(*) FROM \`Votes\` WHERE \`Votes\`.\`blog_slug\` = \`Blog\`.\`slug\` AND \`Votes\`.\`type\` = 'downvote')`,
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
    const limit = 5;
    const offset = (page - 1) * limit;
    const domain = this.configService.get<string>('domain'); // Get domain from .env

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
            `(SELECT COUNT(*) FROM \`Votes\` WHERE \`Votes\`.\`blog_slug\` = \`Blog\`.\`slug\` AND \`Votes\`.\`type\` = 'upvote')`,
          ),
          'upvotes',
        ],
        [
          this.voteModel.sequelize.literal(
            `(SELECT COUNT(*) FROM \`Votes\` WHERE \`Votes\`.\`blog_slug\` = \`Blog\`.\`slug\` AND \`Votes\`.\`type\` = 'downvote')`,
          ),
          'downvotes',
        ],
        [
          this.commentModel.sequelize.literal(
            `(SELECT COUNT(*) FROM \`Comments\` WHERE \`Comments\`.\`blog_slug\` = \`Blog\`.\`slug\`)`,
          ),
          'commentsCount',
        ],
        [
          this.voteModel.sequelize.literal(
            `(SELECT COUNT(*) FROM \`Votes\` WHERE \`Votes\`.\`blog_slug\` = \`Blog\`.\`slug\` AND \`Votes\`.\`type\` = 'upvote') -
          (SELECT COUNT(*) FROM \`Votes\` WHERE \`Votes\`.\`blog_slug\` = \`Blog\`.\`slug\` AND \`Votes\`.\`type\` = 'downvote')`,
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

  async roastBlog(blogSlug: string){
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
    // Step 3: Initialize the Groq client
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
    try {
      const response = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "you are a helpful assistant. you should only give your response in text form",
          },
          {
            role: "user",
            content: `Please roast this blog in a humorous way:\n\n${blogContent}`,
          },
        ],
        model: "llama3-8b-8192",
        temperature: 0.5,
        max_tokens: 1024,
        top_p: 1,
        stop: null,
        stream: false,
      });
      const roast = response?.choices?.[0]?.message || 'No roast available.';
      console.log(roast)
      // Step 5: Return the roast
      return { roast };
    } catch (error) {
      throw new HttpException(
        `Failed to generate roast: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  
  }
}
