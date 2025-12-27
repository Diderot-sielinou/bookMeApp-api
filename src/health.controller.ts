import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';
import { Public } from './common/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly dataSource: DataSource,
    @Inject('REDIS_CLIENT') private readonly redis: Redis
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('db')
  @Public()
  @ApiOperation({ summary: 'Database health check' })
  @ApiResponse({ status: 200, description: 'Database is connected' })
  async checkDatabase() {
    try {
      await this.dataSource.query('SELECT 1');
      return {
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('redis')
  @Public()
  @ApiOperation({ summary: 'Redis health check' })
  @ApiResponse({ status: 200, description: 'Redis is connected' })
  async checkRedis() {
    try {
      await this.redis.ping();
      return {
        redis: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        redis: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('full')
  @Public()
  @ApiOperation({ summary: 'Full system health check' })
  @ApiResponse({ status: 200, description: 'Full system status' })
  async fullCheck() {
    const [dbStatus, redisStatus] = await Promise.all([this.checkDatabase(), this.checkRedis()]);

    const allHealthy = dbStatus.database === 'connected' && redisStatus.redis === 'connected';

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      services: {
        database: dbStatus,
        redis: redisStatus,
      },
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }
}
