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
export class UserOtp extends Model<UserOtp> {
  @PrimaryKey
  @IsUUID(4)
  @Default(uuidv4) // Automatically generates a UUIDv4 when a new OTP is created
  @Column({ type: DataType.UUID })
  slug: string;

  @Column({
    allowNull: false,
    type: DataType.STRING,
  })
  otp: string;

  @Column({
    allowNull: false,
    type: DataType.DATE,
  })
  otp_expiry: Date;

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
