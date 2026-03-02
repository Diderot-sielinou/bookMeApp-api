import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: envFile });
dotenv.config();

const dbUrl = process.env.DATABASE_URL;

const baseConfig: DataSourceOptions = dbUrl
  ? {
      type: 'postgres',
      url: dbUrl,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    }
  : {
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      username: process.env.DATABASE_USERNAME || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'bookme',
    };

const isCompiled = __dirname.includes('dist');

const entitiesPath = isCompiled
  ? path.join(__dirname, '..', '**', '*.entity.js')
  : path.join(__dirname, '..', 'database', 'migrations', '*.ts');

const migrationsPath = isCompiled
  ? path.join(__dirname, '..', 'database', 'migrations', '*.js')
  : path.join(__dirname, '..', 'database', 'migrations', '*.ts');

export default new DataSource({
  ...baseConfig,
  entities: [entitiesPath],
  migrations: [migrationsPath],
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
  extra: {
    max: 20,
    connectionTimeoutMillis: 10000,
  },
});
