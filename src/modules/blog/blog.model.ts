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

@Table
export class Blog extends Model<Blog> {
  @PrimaryKey
  @IsUUID(4)
  @Default(uuidv4) // Automatically generates a UUIDv4 when a new blog is created
  @Column({ type: DataType.UUID })
  slug: string;

  @Column({
    allowNull: false,
    type: DataType.STRING,
  })
  title: string;

  @Column({
    type: DataType.TEXT,
  })
  media: string;

  @Column({
    type: DataType.TEXT,
  })
  description: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  user_slug: string;

  @BelongsTo(() => User)
  user: User;
}
