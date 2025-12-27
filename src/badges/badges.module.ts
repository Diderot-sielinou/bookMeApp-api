import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BadgesController } from './badges.controller';
import { BadgesService } from './badges.service';
import { Badge } from './entities/badge.entity';
import { Prestataire } from '../users/entities/prestataire.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Review } from '../reviews/entities/review.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Badge, Prestataire, Appointment, Review])],
  controllers: [BadgesController],
  providers: [BadgesService],
  exports: [BadgesService],
})
export class BadgesModule {}
