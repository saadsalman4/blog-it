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
  AfterSync,
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

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false, // Default to false, meaning not blocked
  })
  blocked: boolean;


  @AfterSync
  static async addInitialAdmin() {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@blogit.com';
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        fullName: 'Super Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        otp_verified: true,
      });
    }
  }
}
