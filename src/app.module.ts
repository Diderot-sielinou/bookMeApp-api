import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD } from '@nestjs/core';

// Configuration
import { getDatabaseConfig } from './config/database.config';
import { getThrottlerConfig } from './config/throttler.config';

// // Feature Modules
// import { AuthModule } from './auth/auth.module';
// import { UsersModule } from './users/users.module';
// import { ServicesModule } from './services/services.module';
// import { SlotsModule } from './slots/slots.module';
// import { AppointmentsModule } from './appointments/appointments.module';
// import { ReviewsModule } from './reviews/reviews.module';
// import { MessagesModule } from './messages/messages.module';
// import { NotificationsModule } from './notifications/notifications.module';
// import { BadgesModule } from './badges/badges.module';
// import { SearchModule } from './search/search.module';
// import { DashboardModule } from './dashboard/dashboard.module';
// import { AdminModule } from './admin/admin.module';
// import { EmailModule } from './email/email.module';
// import { CacheModule } from './cache/cache.module';
// import { UploadModule } from './upload/upload.module';
// import { CronModule } from './cron/cron.module';

// // Health Controller
// import { HealthController } from './health.controller';

// // Guards
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getThrottlerConfig,
    }),

    // Scheduled Tasks
    ScheduleModule.forRoot(),

    // Event Emitter
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),

    // Global Cache Module (must be before other modules that use Redis)
    // CacheModule,

    // Feature Modules
    // AuthModule,
    // UsersModule,
    // ServicesModule,
    // SlotsModule,
    // AppointmentsModule,
    // ReviewsModule,
    // MessagesModule,
    // NotificationsModule,
    // BadgesModule,
    // SearchModule,
    // DashboardModule,
    // AdminModule,
    // EmailModule,
    // UploadModule,
    // CronModule,
  ],
  // controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
