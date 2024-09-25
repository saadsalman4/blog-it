import {
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
  Get,
  Param,
  Put,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { SignupDto } from './dto/signup.dto';
import { Response } from 'express';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { BlobServiceClient } from '@azure/storage-blob';
import * as path from 'path';


@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('signup')
  async signup(
    @Body() signupDto: SignupDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      await this.userService.signup(signupDto);
      res.status(HttpStatus.CREATED).json({
        code: HttpStatus.CREATED,
        message: 'User registered successfully',
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

  @Post('verify-otp')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto, @Res() res: Response) {
    try {
      const { email, otp } = verifyOtpDto;
      await this.userService.verifyOtp(email, otp);
      res.status(HttpStatus.OK).json({
        code: 200,
        message: 'User verified successfully',
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

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    try {
      const { email, password } = loginDto;
      const response = await this.userService.login(email, password);
      res.status(response.code).json({
        code: response.code,
        message: response.message,
        data: response.data,
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

  @Post('resend-otp')
  async resendOtp(@Body() resendOtpDto: ResendOtpDto, @Res() res: Response) {
    try {
      const { email } = resendOtpDto;
      await this.userService.resendOtp(email);
      res.status(HttpStatus.OK).json({
        code: 200,
        message: 'OTP resent',
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

  @Get('/info/:userSlug')
  async getUserInfo(@Param('userSlug') userSlug: string, @Res() res) {
    try {
      const userInfo = await this.userService.getUserInfo(userSlug);
      return res.status(HttpStatus.OK).json({
        code: HttpStatus.OK,
        message: 'User info retrieved successfully',
        data: userInfo,
      });
    } catch (error) {
      return res.status(HttpStatus.NOT_FOUND).json({
        code: HttpStatus.NOT_FOUND,
        message: error.message || 'User not found',
        data: [],
      });
    }
  }

  @Put('/edit-profile')
@UseInterceptors(
  FileInterceptor('profileImg', {
    fileFilter: (req, file, callback) => {
      const allowedMimeTypes = ['image/jpeg', 'image/png'];
      if (allowedMimeTypes.includes(file.mimetype)) {
        callback(null, true);
      } else {
        callback(
          new Error('Invalid file type. Only JPEG and PNG images are allowed.'),
          false,
        );
      }
    },
  }),
)
async editUserProfile(
  @Body() updateData: { fullName?: string },
  @UploadedFile() profileImg: Express.Multer.File,
  @Req() req,
  @Res() res,
) {
  try {
    const userSlug = req.user.userSlug; // Assuming userSlug is extracted from the token in the request

    let profileImgPath: string | undefined = undefined;
    if (profileImg) {
      // Upload the image to Azure Blob Storage
      profileImgPath = await this.uploadProfileImageToAzureBlob(profileImg);
    }

    const updatedUser = await this.userService.updateUserProfile(userSlug, {
      fullName: updateData.fullName,
      profileImg: profileImgPath,
    });

    return res.status(HttpStatus.OK).json({
      code: HttpStatus.OK,
      message: 'Profile updated successfully',
      data: {
        fullName: updatedUser.fullName,
        profileImg: updatedUser.profileImg,
      },
    });
  } catch (error) {
    return res
      .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
      .json({
        code: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Internal server error',
        data: [],
      });
  }
  }

  private async uploadProfileImageToAzureBlob(file: Express.Multer.File): Promise<string> {
    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_BLOB_CONTAINER_NAME);
  
    // Generate a unique file name for the blob
    const blobName = `profile-${Date.now()}-${path.parse(file.originalname).name}${path.extname(file.originalname)}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  
    // Upload file buffer to Azure Blob with the appropriate content type (only images allowed)
    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: {
        blobContentType: file.mimetype, // Ensure the correct MIME type for the image
      },
    });
  
    // Return the URL to access the blob
    return `${process.env.AZURE_BLOB_URL}/${process.env.AZURE_BLOB_CONTAINER_NAME}/${blobName}`;
  }
}
