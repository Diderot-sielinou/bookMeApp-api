/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Redis from 'ioredis';

import { Prestataire } from '../users/entities/prestataire.entity';
import { SearchDto, SearchResultDto } from './dto';
import { PrestataireStatus, CACHE_TTL } from '../common/constants';
import { normalizePagination, createPaginatedResult } from '../common/utils/pagination.util';
import { PaginatedResult } from '../common/interfaces';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly SEARCH_CACHE_PREFIX = 'search:';

  constructor(
    @InjectRepository(Prestataire)
    private readonly prestataireRepository: Repository<Prestataire>,
    @Inject('REDIS_CLIENT') private readonly redis: Redis
  ) {}

  /**
   * Search prestataires with full-text search and filters
   */
  async search(dto: SearchDto): Promise<PaginatedResult<SearchResultDto>> {
    const { page, limit, skip } = normalizePagination(dto.page, dto.limit);

    // Build cache key
    const cacheKey = this.buildCacheKey(dto);

    // Check cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug(`Search cache hit: ${cacheKey}`);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return JSON.parse(cached);
    }

    // Build query
    const queryBuilder = this.prestataireRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.services', 'service', 'service.isActive = true')
      .leftJoinAndSelect('p.badges', 'badge', 'badge.isActive = true')
      .where('p.status = :status', { status: PrestataireStatus.ACTIVE })
      .andWhere('p.profileCompleted = :completed', { completed: true });

    // Full-text search
    if (dto.query) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const searchQuery = dto.query.trim().replace(/\s+/g, ' & ');
      queryBuilder.andWhere(
        `(
          p.businessName ILIKE :queryLike OR
          p.bio ILIKE :queryLike OR
          p.city ILIKE :queryLike OR
          EXISTS (
            SELECT 1 FROM unnest(p.categories) cat 
            WHERE cat ILIKE :queryLike
          ) OR
          EXISTS (
            SELECT 1 FROM services s 
            WHERE s.prestataire_id = p.id 
            AND s.name ILIKE :queryLike
          )
        )`,
        { queryLike: `%${dto.query}%` }
      );
    }

    // Filter by category
    if (dto.category) {
      queryBuilder.andWhere(':category = ANY(p.categories)', {
        category: dto.category,
      });
    }

    // Filter by categories array
    if (dto.categories?.length) {
      queryBuilder.andWhere('p.categories && :categories', {
        categories: dto.categories,
      });
    }

    // Filter by city
    if (dto.city) {
      queryBuilder.andWhere('p.city ILIKE :city', { city: `%${dto.city}%` });
    }

    // Filter by postal code
    if (dto.postalCode) {
      queryBuilder.andWhere('p.postalCode = :postalCode', {
        postalCode: dto.postalCode,
      });
    }

    // Filter by minimum rating
    if (dto.minRating) {
      queryBuilder.andWhere('p.averageRating >= :minRating', {
        minRating: dto.minRating,
      });
    }

    // Filter by price range
    if (dto.minPrice !== undefined || dto.maxPrice !== undefined) {
      queryBuilder.andWhere(
        `EXISTS (
          SELECT 1 FROM services s 
          WHERE s.prestataire_id = p.id 
          AND s.is_active = true
          ${dto.minPrice !== undefined ? 'AND s.price >= :minPrice' : ''}
          ${dto.maxPrice !== undefined ? 'AND s.price <= :maxPrice' : ''}
        )`,
        {
          ...(dto.minPrice !== undefined && { minPrice: dto.minPrice }),
          ...(dto.maxPrice !== undefined && { maxPrice: dto.maxPrice }),
        }
      );
    }

    // Filter by availability (has slots)
    if (dto.hasAvailability) {
      queryBuilder.andWhere(
        `EXISTS (
          SELECT 1 FROM slots s 
          WHERE s.prestataire_id = p.id 
          AND s.status = 'AVAILABLE'
          AND s.date >= CURRENT_DATE
          AND s.deleted_at IS NULL
        )`
      );
    }

    // Filter by badges
    if (dto.badges?.length) {
      queryBuilder.andWhere(
        `EXISTS (
          SELECT 1 FROM badges b 
          WHERE b.prestataire_id = p.id 
          AND b.is_active = true
          AND b.type IN (:...badges)
        )`,
        { badges: dto.badges }
      );
    }

    // Sorting
    switch (dto.sortBy) {
      case 'rating':
        queryBuilder.orderBy('p.averageRating', dto.sortOrder || 'DESC');
        break;
      case 'reviews':
        queryBuilder.orderBy('p.totalReviews', dto.sortOrder || 'DESC');
        break;
      case 'appointments':
        queryBuilder.orderBy('p.totalAppointments', dto.sortOrder || 'DESC');
        break;
      case 'name':
        queryBuilder.orderBy('p.businessName', dto.sortOrder || 'ASC');
        break;
      default:
        // Default: relevance-based sorting
        queryBuilder.orderBy('p.averageRating', 'DESC').addOrderBy('p.totalReviews', 'DESC');
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const prestataires = await queryBuilder.getMany();

    // Transform to search results
    const results: SearchResultDto[] = prestataires.map((p) => ({
      id: p.id,
      businessName: p.businessName,
      firstName: p.firstName,
      lastName: p.lastName,
      bio: p.bio,
      avatar: p.avatar,
      categories: p.categories,
      city: p.city,
      postalCode: p.postalCode,
      averageRating: parseFloat(p.averageRating.toString()),
      totalReviews: p.totalReviews,
      totalAppointments: p.totalAppointments,
      services:
        p.services?.map((s) => ({
          id: s.id,
          name: s.name,
          duration: s.duration,
          price: parseFloat(s.price.toString()),
        })) || [],
      badges:
        p.badges?.map((b) => ({
          type: b.type,
          awardedAt: b.awardedAt,
        })) || [],
      minPrice: p.services?.length
        ? Math.min(...p.services.map((s) => parseFloat(s.price.toString())))
        : null,
      maxPrice: p.services?.length
        ? Math.max(...p.services.map((s) => parseFloat(s.price.toString())))
        : null,
    }));

    const result = createPaginatedResult(results, total, page, limit);

    // Cache result
    await this.redis.setex(
      cacheKey,
      CACHE_TTL.AVAILABLE_SLOTS, // 5 minutes
      JSON.stringify(result)
    );

    return result;
  }

  /**
   * Get popular categories
   */
  async getPopularCategories(): Promise<{ category: string; count: number }[]> {
    const cacheKey = 'search:popular-categories';

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const result = await this.prestataireRepository
      .createQueryBuilder('p')
      .select('unnest(p.categories)', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('p.status = :status', { status: PrestataireStatus.ACTIVE })
      .groupBy('category')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    await this.redis.setex(cacheKey, CACHE_TTL.STATS, JSON.stringify(result));

    return result;
  }

  /**
   * Get search suggestions (autocomplete)
   */
  async getSuggestions(query: string): Promise<string[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const cacheKey = `search:suggestions:${query.toLowerCase()}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get business names
    const businesses = await this.prestataireRepository
      .createQueryBuilder('p')
      .select('p.businessName', 'name')
      .where('p.status = :status', { status: PrestataireStatus.ACTIVE })
      .andWhere('p.businessName ILIKE :query', { query: `%${query}%` })
      .limit(5)
      .getRawMany();

    // Get categories
    const categories = await this.prestataireRepository
      .createQueryBuilder('p')
      .select('DISTINCT unnest(p.categories)', 'category')
      .where('p.status = :status', { status: PrestataireStatus.ACTIVE })
      .andWhere('EXISTS (SELECT 1 FROM unnest(p.categories) c WHERE c ILIKE :query)', {
        query: `%${query}%`,
      })
      .limit(5)
      .getRawMany();

    // Get cities
    const cities = await this.prestataireRepository
      .createQueryBuilder('p')
      .select('DISTINCT p.city', 'city')
      .where('p.status = :status', { status: PrestataireStatus.ACTIVE })
      .andWhere('p.city ILIKE :query', { query: `%${query}%` })
      .limit(5)
      .getRawMany();

    const suggestions = [
      ...businesses.map((b) => b.name),
      ...categories.map((c) => c.category),
      ...cities.map((c) => c.city),
    ].filter(Boolean);

    // Remove duplicates and limit
    const uniqueSuggestions = [...new Set(suggestions)].slice(0, 10);

    await this.redis.setex(cacheKey, CACHE_TTL.AVAILABLE_SLOTS, JSON.stringify(uniqueSuggestions));

    return uniqueSuggestions;
  }

  /**
   * Build cache key from search parameters
   */
  private buildCacheKey(dto: SearchDto): string {
    const params = Object.entries(dto)
      .filter(([, value]) => value !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${JSON.stringify(value)}`)
      .join('|');

    return `${this.SEARCH_CACHE_PREFIX}${params}`;
  }

  /**
   * Invalidate search cache (called when prestataire updates profile)
   */
  async invalidateSearchCache(): Promise<void> {
    const keys = await this.redis.keys(`${this.SEARCH_CACHE_PREFIX}*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
    this.logger.debug(`Invalidated ${keys.length} search cache entries`);
  }
}
