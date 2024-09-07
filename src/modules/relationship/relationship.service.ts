import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Relationship } from './relationship.model';
import { User } from '../user/user.model';

@Injectable()
export class RelationshipService {
  constructor(
    @InjectModel(Relationship)
    private relationshipModel: typeof Relationship,
  ) {}

  // Follow a user
  async followUser(followerId: string, followedId: string) {
    if (followerId == followedId) {
      throw new Error('Cannot follow itself');
    }
    // Check if the relationship already exists
    const existingRelation = await this.relationshipModel.findOne({
      where: {
        follower_id: followerId,
        followed_id: followedId,
      },
    });

    // If the relationship doesn't exist, create a new one
    if (!existingRelation) {
      await this.relationshipModel.create({
        follower_id: followerId,
        followed_id: followedId,
      });
      return { message: 'Successfully followed user' };
    }

    // If the relationship already exists, throw an error
    throw new Error('You are already following this user');
  }

  // Unfollow a user
  async unfollowUser(followerId: string, followedId: string) {
    if (followerId == followedId) {
      throw new Error('Cannot unfollow itself');
    }
    // Find the relationship
    const relation = await this.relationshipModel.findOne({
      where: {
        follower_id: followerId,
        followed_id: followedId,
      },
    });

    // If the relationship exists, delete it
    if (relation) {
      await relation.destroy();
      return { message: 'Successfully unfollowed user' };
    }

    // If the relationship doesn't exist, throw an error
    throw new Error('You are not following this user');
  }
}
