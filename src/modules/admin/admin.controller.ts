import { Body, Controller, Delete, HttpStatus, Param, Patch, Post, Res } from '@nestjs/common';
import { AdminService } from './admin.service';
import { LoginDto } from '../user/dto/login.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
      const { email, password } = loginDto;
      return await this.adminService.login(email, password);
  }


  // Block a user
  @Patch('block/:userSlug')
  async blockUser(@Param('userSlug') userSlug: string) {
    return await this.adminService.blockUser(userSlug);
  }

  // Unblock a user
  @Patch('unblock/:userSlug')
  async unblockUser(@Param('userSlug') userSlug: string) {
    return await this.adminService.unblockUser(userSlug);
  }

  // Delete a blog
  @Delete('blog/:blogSlug')
  async deleteBlog(@Param('blogSlug') blogSlug: string) {
    return await this.adminService.deleteBlog(blogSlug);
  }

  // Delete a comment
  @Delete('comment/:commentSlug')
  async deleteComment(@Param('commentSlug') commentSlug: string) {
    return await this.adminService.deleteComment(commentSlug);
  }

  @Post('promote-to-admin')
  async promoteToAdmin(@Body('email') email: string, @Res() res) {
    try{
        const result = await this.adminService.promoteToAdmin(email);
        return res.status(HttpStatus.OK).json({
            code: HttpStatus.OK,
            message: 'Admin promoted successfully',
            data: result

            ,
          });
    }
    catch(error){
        console.log(error);
        return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
        code: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || 'Internal server error',
        data: [],
      });
    }

  }
}