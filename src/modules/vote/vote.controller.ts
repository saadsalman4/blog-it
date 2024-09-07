import {
  Controller,
  Post,
  Delete,
  Param,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { VoteService } from './vote.service';

@Controller('vote')
export class VoteController {
  constructor(private readonly voteService: VoteService) {}

  @Post('/:blogSlug/:type')
  async vote(
    @Param('blogSlug') blogSlug: string,
    @Param('type') type: 'upvote' | 'downvote',
    @Req() req,
    @Res() res,
  ) {
    try {
      const user = req['user'];
      const userSlug = user.userSlug;
      const vote = await this.voteService.vote(userSlug, blogSlug, type);

      res.status(HttpStatus.CREATED).json({
        code: HttpStatus.CREATED,
        message: `Successfully ${type}d this blog`,
        data: vote,
      });
    } catch (error) {
      console.log(error);
      res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
        code: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Internal server error',
        data: [],
      });
    }
  }

  @Delete('/:blogSlug')
  async removeVote(
    @Param('blogSlug') blogSlug: string,
    @Req() req,
    @Res() res,
  ) {
    try {
      const user = req['user'];
      const userSlug = user.userSlug;
      await this.voteService.removeVote(userSlug, blogSlug);
      return res.status(HttpStatus.OK).json({
        code: HttpStatus.OK,
        message: `Successfully removed vote`,
        data: [],
      });
    } catch (error) {
      console.log(error);
      res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
        code: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Internal server error',
        data: [],
      });
    }
  }
}
