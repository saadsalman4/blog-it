import { IsString, IsEmail, MinLength } from 'class-validator';

export class SignupDto {
  @IsString()
  fullName: string;

  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}
