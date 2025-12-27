import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

export const getRedisConfig = (configService: ConfigService): RedisOptions => {
  const redisUrl = configService.get<string>('REDIS_URL');

  if (redisUrl) {
    const url = new URL(redisUrl);
    const useTls = url.protocol === 'rediss:' || configService.get<string>('REDIS_TLS') === 'true';

    return {
      host: url.hostname,
      port: parseInt(url.port || '6379', 10),
      password: url.password || undefined,
      tls: useTls ? { rejectUnauthorized: false } : undefined,
      retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    };
  }

  const password = configService.get<string>('REDIS_PASSWORD');
  return {
    host: configService.get<string>('REDIS_HOST', 'localhost'),
    port: configService.get<number>('REDIS_PORT', 6379),
    password: password || undefined,
    retryStrategy(times: number) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
  };
};

export const createRedisClient = (configService: ConfigService): Redis => {
  const redisUrl = configService.get<string>('REDIS_URL');

  if (redisUrl) {
    const url = new URL(redisUrl);
    const useTls = url.protocol === 'rediss:' || configService.get<string>('REDIS_TLS') === 'true';

    return new Redis({
      host: url.hostname,
      port: parseInt(url.port || '6379', 10),
      password: url.password || undefined,
      tls: useTls ? { rejectUnauthorized: false } : undefined,
      retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });
  }

  const password = configService.get<string>('REDIS_PASSWORD');
  return new Redis({
    host: configService.get<string>('REDIS_HOST', 'localhost'),
    port: configService.get<number>('REDIS_PORT', 6379),
    password: password || undefined,
    retryStrategy(times: number) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
  });
};
