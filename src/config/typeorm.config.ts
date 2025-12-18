import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

const dbUrl = process.env.DATABASE_URL;

const config: DataSourceOptions = dbUrl
  ? {
      // URL de connexion (Supabase / Production)
      type: 'postgres',
      url: dbUrl,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    }
  : {
      // Cas : Paramètres individuels (Local / Développement)
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      username: process.env.DATABASE_USERNAME || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'bookme',
    };

// Propriétés communes (Entities, Migrations, etc.)
export default new DataSource({
  ...config,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: true,
});
