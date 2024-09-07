import {
  Column,
  Model,
  Table,
  PrimaryKey,
  Default,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../user/user.model';
import { v4 as uuidv4 } from 'uuid';

@Table
export class Relationship extends Model<Relationship> {
  @PrimaryKey
  @Default(uuidv4)
  @Column({ type: DataType.UUID })
  slug: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  follower_id: string;

  @BelongsTo(() => User, 'follower_id')
  follower: User;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  followed_id: string;

  @BelongsTo(() => User, 'followed_id')
  followed: User;
}
