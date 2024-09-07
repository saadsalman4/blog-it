import { Module } from '@nestjs/common';
import { RelationshipController } from './relationship.controller';
import { RelationshipService } from './relationship.service';
import { Relationship } from './relationship.model';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  controllers: [RelationshipController],
  providers: [RelationshipService],
  imports: [SequelizeModule.forFeature([Relationship])],
  exports: [SequelizeModule],
})
export class RelationshipModule {}
