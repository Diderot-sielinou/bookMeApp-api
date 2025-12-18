import { ConfigService } from '@nestjs/config';
import { ThrottlerModuleOptions } from '@nestjs/throttler';

export const getThrottlerConfig = (configService: ConfigService): ThrottlerModuleOptions => {
  return {
    throttlers: [
      {
        name: 'default',
        ttl: configService.get<number>('THROTTLE_TTL', 60) * 1000,
        limit: configService.get<number>('THROTTLE_LIMIT', 100),
      },
      {
        name: 'login',
        ttl: configService.get<number>('THROTTLE_LOGIN_TTL', 900) * 1000,
        limit: configService.get<number>('THROTTLE_LOGIN_LIMIT', 5),
      },
    ],
  };
};
