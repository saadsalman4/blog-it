import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  Req,
  Delete,
  Param,
  Res,
  HttpStatus,
  Query,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BlogService } from './blog.service';
import { BlogDto } from './dto/blog.dto'; // Assuming you have a DTO for blog creation
import { Request } from 'express';
import { diskStorage } from 'multer';
import * as path from 'path';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Post('create')
  @UseInterceptors(
    FileInterceptor('media', {
      storage: diskStorage({
        destination: './public/uploads', // Adjust the path as per your directory structure
        filename: (req, file, cb) => {
          const fileName = `${Date.now()}-${path.parse(file.originalname).name}${path.extname(file.originalname)}`;
          cb(null, fileName);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB size limit for media upload
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'video/mp4'];
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(null, false);
        }
      },
    }),
  )
  async createBlog(
    @Body() blogDto: BlogDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const user = req['user']; // Retrieved from the AuthMiddleware

    let mediaPath = null;
    if (file) {
      mediaPath = `/uploads/${file.filename}`; // Adjust the path as per your public directory structure
    }

    const blog = await this.blogService.createBlog(
      user.userSlug,
      blogDto,
      mediaPath,
    );
    return {
      code: 201,
      message: 'Blog created successfully',
      data: blog,
    };
  }

  @Delete('delete/:blogSlug')
  async deleteBlog(
    @Param('blogSlug') blogSlug: string,
    @Req() req,
    @Res() res,
  ) {
    try {
      const user = req['user'];
      const userSlug = user.userSlug;
      await this.blogService.removeBlog(userSlug, blogSlug);
      return res.status(HttpStatus.OK).json({
        code: HttpStatus.OK,
        message: 'Successfully removed blog',
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

  @Get('/following')
  async getFollowedBlogs(@Req() req, @Res() res, @Query('page') page = 1) {
    try {
      const user = req['user'];
      const blogs = await this.blogService.getFollowedUsersBlogs(
        user.userSlug,
        page,
      );
      return res
        .status(HttpStatus.OK)
        .json({ code: 200, message: 'Success', data: blogs });
    } catch (error) {
      console.log(error);
      res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
        code: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Internal server error',
        data: [],
      });
    }
  }

  @Get()
  async getAllBlogs(@Query('page') page: number = 1, @Res() res) {
    try {
      const blogs = await this.blogService.getAllBlogs(page);
      return res.status(HttpStatus.OK).json({
        code: HttpStatus.OK,
        message: 'Blogs retrieved successfully',
        data: blogs,
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
