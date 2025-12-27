import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SlotsController } from './slots.controller';
import { SlotsService } from './slots.service';
import { Slot } from './entities/slot.entity';
import { Service } from '../services/entities/service.entity';
import { Prestataire } from '../users/entities/prestataire.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Slot, Service, Prestataire])],
  controllers: [SlotsController],
  providers: [SlotsService],
  exports: [SlotsService],
})
export class SlotsModule {}
