import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Vote } from './vote.model';
// import { Blog } from '../blog/blog.model';

@Injectable()
export class VoteService {
  constructor(
    @InjectModel(Vote)
    private readonly voteModel: typeof Vote,
    // private readonly blogModel: typeof Blog,
  ) {}

  async vote(userSlug: string, blogSlug: string, type: 'upvote' | 'downvote') {
    const existingVote = await this.voteModel.findOne({
      where: { user_slug: userSlug, blog_slug: blogSlug },
    });

    if (existingVote) {
      if (existingVote.type === type) {
        throw new ConflictException(`You've already ${type}d this blog`);
      }
      // Update the vote
      existingVote.type = type;
      return await existingVote.save();
    }

    // const blog = await this.blogModel.findOne({
    //   where: { slug: blogSlug },
    // });

    // if (!blog) {
    //   throw new NotFoundException('Blog not found');
    // }

    // Create a new vote
    return await this.voteModel.create({
      user_slug: userSlug,
      blog_slug: blogSlug,
      type,
    });
  }

  async removeVote(userSlug: string, blogSlug: string) {
    return await this.voteModel.destroy({
      where: { user_slug: userSlug, blog_slug: blogSlug },
    });
  }

  //not needed - we will use joins when fetching blogs
  async getVotes(blogSlug: string) {
    const upvotes = await this.voteModel.count({
      where: { blog_slug: blogSlug, type: 'upvote' },
    });

    const downvotes = await this.voteModel.count({
      where: { blog_slug: blogSlug, type: 'downvote' },
    });

    return { upvotes, downvotes };
  }
}
