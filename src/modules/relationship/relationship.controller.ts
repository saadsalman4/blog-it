import {
  Controller,
  Post,
  Delete,
  Param,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { RelationshipService } from './relationship.service';
import { Request, Response } from 'express';

@Controller('relationships')
export class RelationshipController {
  constructor(private readonly relationshipService: RelationshipService) {}

  // Route to follow a user
  @Post('/follow/:followedId')
  async followUser(
    @Param('followedId') followedId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const user = req['user'];
      const followerId = user.userSlug;
      const result = await this.relationshipService.followUser(
        followerId,
        followedId,
      ); // Call the service to follow the user
      return res.status(HttpStatus.OK).json({
        code: HttpStatus.OK,
        message: result.message,
        data: [],
      });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        code: HttpStatus.BAD_REQUEST,
        message: error.message,
        data: [],
      });
    }
  }

  // Route to unfollow a user
  @Delete('/unfollow/:followedId')
  async unfollowUser(
    @Param('followedId') followedId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const user = req['user']; // Extract user details from the request
      const followerId = user.userSlug; // Get the follower's user slug
      const result = await this.relationshipService.unfollowUser(
        followerId,
        followedId,
      ); // Call the service to unfollow the user
      return res.status(HttpStatus.OK).json({
        code: HttpStatus.OK,
        message: result.message,
        data: [],
      });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        code: HttpStatus.BAD_REQUEST,
        message: error.message,
        data: [],
      });
    }
  }
}
