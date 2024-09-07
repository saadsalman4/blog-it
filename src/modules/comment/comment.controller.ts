import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  Delete,
  Param,
  HttpStatus,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto, DeleteCommentDto } from './dto/comment.dto';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post('/')
  async createComment(
    @Body() createCommentDto: CreateCommentDto,
    @Req() req,
    @Res() res,
  ) {
    try {
      const user = req['user'];
      const userSlug = user.userSlug;
      const comment = await this.commentService.createComment(
        userSlug,
        createCommentDto,
      );
      return res.status(HttpStatus.CREATED).json({
        code: HttpStatus.CREATED,
        message: 'Comment created successfully',
        data: comment,
      });
    } catch (error) {
      res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
        code: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Internal server error',
        data: [],
      });
    }
  }

  @Delete('/:commentSlug')
  async removeComment(
    @Param('commentSlug') commentSlug: string,
    @Req() req,
    @Res() res,
  ) {
    try {
      const user = req['user'];
      const userSlug = user.userSlug;
      await this.commentService.removeComment(userSlug, commentSlug);
      return res.status(HttpStatus.OK).json({
        code: HttpStatus.OK,
        message: 'Successfully removed comment',
        data: [],
      });
    } catch (error) {
      res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
        code: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Internal server error',
        data: [],
      });
    }
  }
}
