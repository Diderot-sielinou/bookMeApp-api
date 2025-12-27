import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Client } from './entities/client.entity';
import { Prestataire } from './entities/prestataire.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Client, Prestataire])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
