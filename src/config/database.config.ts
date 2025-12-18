import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const isProduction = configService.get('NODE_ENV') === 'production';

  // Support for DATABASE_URL (Supabase/Railway format)
  const databaseUrl = configService.get<string>('DATABASE_URL');

  if (databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      ssl: configService.get('DATABASE_SSL') === 'true' ? { rejectUnauthorized: false } : false,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
      synchronize: false, // Always false in production
      migrationsRun: true,
      logging: !isProduction,
      extra: {
        max: 20, // Connection pool size
        connectionTimeoutMillis: 10000,
      },
    };
  }

  // Individual connection parameters
  return {
    type: 'postgres',
    host: configService.get<string>('DATABASE_HOST', 'localhost'),
    port: configService.get<number>('DATABASE_PORT', 5432),
    username: configService.get<string>('DATABASE_USERNAME', 'postgres'),
    password: configService.get<string>('DATABASE_PASSWORD', 'postgres'),
    database: configService.get<string>('DATABASE_NAME', 'bookme'),
    ssl: configService.get('DATABASE_SSL') === 'true' ? { rejectUnauthorized: false } : false,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    synchronize: configService.get('DATABASE_SYNCHRONIZE') === 'true' && !isProduction,
    migrationsRun: true,
    logging: configService.get('DATABASE_LOGGING') === 'true',
    extra: {
      max: 20,
      connectionTimeoutMillis: 10000,
    },
  };
};
