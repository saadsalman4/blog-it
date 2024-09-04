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
  Unique,
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../user/user.model';
import { Blog } from '../blog/blog.model';

@Table
export class Vote extends Model<Vote> {
  @PrimaryKey
  @IsUUID(4)
  @Default(uuidv4)
  @Column({ type: DataType.UUID })
  slug: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  user_slug: string;

  @ForeignKey(() => Blog)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  blog_slug: string;

  @Column({
    type: DataType.ENUM('upvote', 'downvote'),
    allowNull: false,
  })
  type: 'upvote' | 'downvote';

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => Blog)
  blog: Blog;
}
