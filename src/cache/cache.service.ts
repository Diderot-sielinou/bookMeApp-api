/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger, Inject } from '@nestjs/common';
import Redis from 'ioredis';

import { CACHE_TTL } from '../common/constants';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Cache get error for ${key}: ${error.message}`);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.redis.setex(key, ttl, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
    } catch (error) {
      this.logger.error(`Cache set error for ${key}: ${error.message}`);
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Cache delete error for ${key}: ${error.message}`);
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async delByPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return keys.length;
    } catch (error) {
      this.logger.error(`Cache delete by pattern error: ${error.message}`);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Cache exists error for ${key}: ${error.message}`);
      return false;
    }
  }

  /**
   * Get remaining TTL for a key
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      this.logger.error(`Cache TTL error for ${key}: ${error.message}`);
      return -1;
    }
  }

  /**
   * Set expiration on existing key
   */
  async expire(key: string, ttl: number): Promise<void> {
    try {
      await this.redis.expire(key, ttl);
    } catch (error) {
      this.logger.error(`Cache expire error for ${key}: ${error.message}`);
    }
  }

  /**
   * Increment a counter
   */
  async incr(key: string): Promise<number> {
    try {
      return await this.redis.incr(key);
    } catch (error) {
      this.logger.error(`Cache incr error for ${key}: ${error.message}`);
      return 0;
    }
  }

  /**
   * Decrement a counter
   */
  async decr(key: string): Promise<number> {
    try {
      return await this.redis.decr(key);
    } catch (error) {
      this.logger.error(`Cache decr error for ${key}: ${error.message}`);
      return 0;
    }
  }

  // ==========================================
  // CACHE HELPERS
  // ==========================================

  /**
   * Cache prestataire profile
   */
  async cacheProfile(prestataireId: string, data: unknown): Promise<void> {
    await this.set(`profile:${prestataireId}`, data, CACHE_TTL.PROFILE);
  }

  /**
   * Get cached prestataire profile
   */
  async getCachedProfile<T>(prestataireId: string): Promise<T | null> {
    return this.get<T>(`profile:${prestataireId}`);
  }

  /**
   * Invalidate prestataire profile cache
   */
  async invalidateProfile(prestataireId: string): Promise<void> {
    await this.del(`profile:${prestataireId}`);
  }

  /**
   * Cache available slots
   */
  async cacheSlots(prestataireId: string, date: string, data: unknown): Promise<void> {
    await this.set(`slots:${prestataireId}:${date}`, data, CACHE_TTL.AVAILABLE_SLOTS);
  }

  /**
   * Get cached slots
   */
  async getCachedSlots<T>(prestataireId: string, date: string): Promise<T | null> {
    return this.get<T>(`slots:${prestataireId}:${date}`);
  }

  /**
   * Invalidate slots cache for prestataire
   */
  async invalidateSlots(prestataireId: string): Promise<void> {
    await this.delByPattern(`slots:${prestataireId}:*`);
  }

  /**
   * Cache search results
   */
  async cacheSearchResults(queryHash: string, data: unknown): Promise<void> {
    await this.set(`search:${queryHash}`, data, CACHE_TTL.AVAILABLE_SLOTS);
  }

  /**
   * Get cached search results
   */
  async getCachedSearchResults<T>(queryHash: string): Promise<T | null> {
    return this.get<T>(`search:${queryHash}`);
  }

  /**
   * Invalidate all search cache
   */
  async invalidateSearchCache(): Promise<number> {
    return this.delByPattern('search:*');
  }

  /**
   * Cache statistics
   */
  async cacheStats(key: string, data: unknown): Promise<void> {
    await this.set(`stats:${key}`, data, CACHE_TTL.STATS);
  }

  /**
   * Get cached statistics
   */
  async getCachedStats<T>(key: string): Promise<T | null> {
    return this.get<T>(`stats:${key}`);
  }

  // ==========================================
  // RATE LIMITING HELPERS
  // ==========================================

  /**
   * Check rate limit
   */
  async checkRateLimit(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - windowSeconds;

    // Use sorted set for sliding window rate limiting
    const multi = this.redis.multi();

    // Remove old entries
    multi.zremrangebyscore(key, 0, windowStart);

    // Count current entries
    multi.zcard(key);

    // Add current request
    multi.zadd(key, now, `${now}-${Math.random()}`);

    // Set expiration
    multi.expire(key, windowSeconds);

    const results = await multi.exec();
    const currentCount = (results?.[1]?.[1] as number) || 0;

    return {
      allowed: currentCount < limit,
      remaining: Math.max(0, limit - currentCount - 1),
      resetAt: now + windowSeconds,
    };
  }
}
