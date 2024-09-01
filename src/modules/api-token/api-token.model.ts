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
export class ApiToken extends Model<ApiToken> {
  @PrimaryKey
  @IsUUID(4)
  @Default(uuidv4) // Automatically generates a UUIDv4 when a new API token is created
  @Column({ type: DataType.UUID })
  slug: string;

  @Column({
    allowNull: false,
    type: DataType.TEXT, // Using TEXT for storing JWT tokens
  })
  api_token: string;

  @Column({
    allowNull: false,
    type: DataType.ENUM('admin', 'user'), // Indicates if the token is for admin or user
  })
  token_type: 'admin' | 'user';

  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  is_active: boolean;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  user_slug: string;

  @BelongsTo(() => User)
  user: User;
}
