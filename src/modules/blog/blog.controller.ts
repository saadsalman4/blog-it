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
import { BlogDto } from './dto/blog.dto';
import { Request } from 'express';
import * as path from 'path';
import { BlobServiceClient } from '@azure/storage-blob';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Post('create')
  @UseInterceptors(
    FileInterceptor('media', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB size limit
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'video/mp4'];
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type'), false);
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

    let mediaUrl = null;
    if (file) {
      mediaUrl = await this.uploadToAzureBlob(file);
    }

    const blog = await this.blogService.createBlog(
      user.userSlug,
      blogDto,
      mediaUrl, // Store the Azure Blob URL in the database
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

  @Get('/user/:userSlug')
  async getUserBlogs(
    @Param('userSlug') userSlug: string,
    @Query('page') page: number = 1, // Defaults to page 1 if not provided
    @Res() res,
  ) {
    try {
      const blogs = await this.blogService.getUserBlogs(userSlug, page);
      return res.status(HttpStatus.OK).json({
        code: HttpStatus.OK,
        message: 'User blogs retrieved successfully',
        data: blogs,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Internal server error',
        data: [],
      });
    }
  }

  
  private async uploadToAzureBlob(file: Express.Multer.File): Promise<string> {
    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_BLOB_CONTAINER_NAME);
  
    // Generate a unique file name for the blob
    const blobName = `${Date.now()}-${path.parse(file.originalname).name}${path.extname(file.originalname)}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  
    // Set the correct Content-Type based on the file's MIME type
    const contentType = file.mimetype; // This will get the correct MIME type of the uploaded file
  
    // Upload file buffer to Azure Blob with the appropriate content type
    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: {
        blobContentType: contentType, // Ensure the Content-Type is set correctly
      },
    });
  
    // Return the URL to access the blob
    return `${process.env.AZURE_BLOB_URL}/${process.env.AZURE_BLOB_CONTAINER_NAME}/${blobName}`;
  }

}
