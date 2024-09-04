import {
  Column,
  Model,
  Table,
  PrimaryKey,
  Default,
  DataType,
  IsUUID,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../user/user.model';
import { Blog } from '../blog/blog.model';

@Table
export class Comment extends Model<Comment> {
  @PrimaryKey
  @IsUUID(4)
  @Default(uuidv4)
  @Column({ type: DataType.UUID })
  slug: string;

  @Column({
    allowNull: false,
    type: DataType.TEXT,
  })
  comment: string;

  @ForeignKey(() => Blog)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  blog_slug: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  user_slug: string;

  @BelongsTo(() => Blog)
  blog: Blog;

  @BelongsTo(() => User)
  user: User;
}
