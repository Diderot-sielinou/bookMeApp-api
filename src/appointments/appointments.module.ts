import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './entities/appointment.entity';
import { Slot } from '../slots/entities/slot.entity';
import { Service } from '../services/entities/service.entity';
import { Client } from '../users/entities/client.entity';
import { Prestataire } from '../users/entities/prestataire.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, Slot, Service, Client, Prestataire])],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
