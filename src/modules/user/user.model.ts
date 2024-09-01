import {
  Column,
  Model,
  Table,
  PrimaryKey,
  IsUUID,
  Default,
  DataType,
  BeforeCreate,
  BeforeUpdate,
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

@Table
export class User extends Model<User> {
  @PrimaryKey
  @IsUUID(4)
  @Default(uuidv4) // Automatically generates a UUIDv4 when a new user is created
  @Column({ type: DataType.UUID })
  slug: string;

  @Column({
    allowNull: false,
    type: DataType.STRING,
  })
  fullName: string;

  @Column({
    allowNull: false,
    unique: true, // Ensures that each email is unique
    type: DataType.STRING,
  })
  email: string;

  @Column({
    allowNull: false,
    type: DataType.STRING,
  })
  password: string;

  @Column({
    type: DataType.STRING,
    allowNull: true, // Profile image is optional
  })
  profileImg: string;

  @Column({
    allowNull: false,
    type: DataType.ENUM('admin', 'user'), // Limits role to 'admin' or 'user'
  })
  role: 'admin' | 'user';

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  otp_verified: boolean;

  @BeforeCreate
  @BeforeUpdate
  static async hashPassword(user: User) {
    if (user.password) {
      user.password = await bcrypt.hash(user.password, 10);
    }
  }
}
