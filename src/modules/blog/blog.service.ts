import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Blog } from './blog.model';
import { BlogDto } from './dto/blog.dto';
import { ConfigService } from '@nestjs/config';
import { Vote } from '../vote/vote.model';
import { Comment } from '../comment/comment.model';
import { User } from '../user/user.model';
import { Relationship } from '../relationship/relationship.model';

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

  async getAllBlogs(page: number) {
    const limit = 5;
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

  async getFollowedUsersBlogs(userSlug: string, page: number) {
    const limit = 5;
    const offset = (page - 1) * limit;

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
}
