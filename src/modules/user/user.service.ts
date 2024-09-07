import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';
import { SignupDto } from './dto/signup.dto';
import { UserOtp } from '../user-otp/user-otp.model';
import { ApiToken } from '../api-token/api-token.model';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as moment from 'moment';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(UserOtp)
    private readonly userOtpModel: typeof UserOtp,
    @InjectModel(ApiToken) private readonly apiTokenModel: typeof ApiToken,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService, // Inject ConfigService
  ) {}

  async signup(signupDto: SignupDto): Promise<void> {
    const { fullName, email, password } = signupDto;

    const existingUser = await this.userModel.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User already exists with this email');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.userModel.create({
      fullName,
      email,
      password: hashedPassword,
      role: 'user',
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP expires in 10 minutes

    await this.userOtpModel.create({
      otp,
      otp_expiry: otpExpiry,
      is_active: true,
      user_slug: user.slug,
    });

    await this.sendOTP(email, otp);
  }

  async verifyOtp(email: string, otp: string): Promise<any> {
    const user = await this.userModel.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.otp_verified) {
      throw new BadRequestException('User already verified');
    }

    const latestOtp = await this.userOtpModel.findOne({
      where: {
        user_slug: user.slug,
        is_active: true,
      },
      order: [['createdAt', 'DESC']],
    });

    if (!latestOtp) {
      throw new BadRequestException('OTP not found or expired');
    }

    if (new Date() > latestOtp.otp_expiry || latestOtp.otp !== otp) {
      throw new BadRequestException('OTP has expired or invalid OTP');
    }

    user.otp_verified = true;
    await user.save();
  }

  async login(email: string, password: string): Promise<any> {
    const user = await this.userModel.findOne({ where: { email } });
    const secretKey = this.configService.get<string>('JWT_SECRET_KEY');
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    if (!user.otp_verified) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date();
      otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);

      await this.sendOTP(email, otp);

      await this.userOtpModel.update(
        { is_active: false },
        {
          where: {
            user_slug: user.slug,
            is_active: true,
          },
        },
      );

      await this.userOtpModel.create({
        otp,
        otp_expiry: otpExpiry,
        is_active: true,
        user_slug: user.slug,
      });

      return {
        code: 310,
        message: 'Account not verified. A new OTP has been sent to your email.',
        data: [],
      };
    }
    const payload = { userSlug: user.slug, fullName: user.fullName };
    const token = this.jwtService.sign(payload, {
      secret: secretKey,
      expiresIn: '24h',
    });

    await this.apiTokenModel.update(
      { is_active: false },
      { where: { user_slug: user.slug, is_active: true } },
    );

    await this.apiTokenModel.create({
      api_token: token,
      token_type: 'user',
      is_active: true,
      user_slug: user.slug,
    });

    return {
      code: HttpStatus.OK,
      message: 'Login successful',
      data: {
        email: user.email,
        fullName: user.fullName,
        token: token,
      },
    };
  }

  async resendOtp(email: string): Promise<any> {
    const user = await this.userModel.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.otp_verified) {
      throw new BadRequestException('Account is already verified');
    }

    const latestOtp = await this.userOtpModel.findOne({
      where: { user_slug: user.slug },
      order: [['createdAt', 'DESC']],
    });

    if (
      latestOtp &&
      moment().diff(moment(latestOtp.createdAt), 'seconds') < 30
    ) {
      throw new ConflictException(
        'OTP already sent recently. Please try again later.',
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP expires in 10 minutes

    await this.userOtpModel.update(
      { is_active: false },
      {
        where: {
          user_slug: user.slug,
          is_active: true,
        },
      },
    );

    await this.userOtpModel.create({
      otp,
      otp_expiry: otpExpiry,
      is_active: true,
      user_slug: user.slug,
    });

    await this.sendOTP(email, otp);
  }

  async sendOTP(email: string, otp: string): Promise<any> {
    //TODO at the end
    console.log('OTP sent to ', email, ': ', otp);
  }
}
