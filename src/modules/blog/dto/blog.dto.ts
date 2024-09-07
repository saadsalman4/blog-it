import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BlogDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}
