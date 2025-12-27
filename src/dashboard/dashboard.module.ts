import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Review } from '../reviews/entities/review.entity';
import { Slot } from '../slots/entities/slot.entity';
import { Prestataire } from '../users/entities/prestataire.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, Review, Slot, Prestataire])],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
