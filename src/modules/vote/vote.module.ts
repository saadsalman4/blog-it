import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Vote } from './vote.model';
import { VoteService } from './vote.service';
import { VoteController } from './vote.controller';
import { Blog } from '../blog/blog.model';

@Module({
  imports: [SequelizeModule.forFeature([Vote, Blog])],
  exports: [SequelizeModule],
  providers: [VoteService],
  controllers: [VoteController],
})
export class VoteModule {}
