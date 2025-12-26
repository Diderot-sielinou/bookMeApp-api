import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminBootstrapService } from './admin-bootstrap.service';
import { AuditLog } from './entities/audit-log.entity';
import { User } from '../users/entities/user.entity';
import { Prestataire } from '../users/entities/prestataire.entity';
import { Client } from '../users/entities/client.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Review } from '../reviews/entities/review.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog, User, Prestataire, Client, Appointment, Review]),
    UsersModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminBootstrapService],
  exports: [AdminService],
})
export class AdminModule {}
