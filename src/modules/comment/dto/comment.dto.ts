import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty()
  comment: string;

  @IsUUID()
  blog_slug: string;
}

export class DeleteCommentDto {
  @IsUUID()
  comment_slug: string;
}
