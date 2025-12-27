import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../../common/constants';

// ==========================================
// QUERY USERS DTO
// ==========================================
export class QueryUsersDto {
  @ApiPropertyOptional({
    description: 'Search by name or email',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by role',
    enum: UserRole,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Filter by active status',
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by email verified',
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  emailVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Start date for registration',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for registration',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Sort by',
    enum: ['createdAt', 'email', 'lastName'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';

  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}

// ==========================================
// QUERY PENDING PRESTATAIRES DTO
// ==========================================
export class QueryPendingPrestatairesDto {
  @ApiPropertyOptional({
    description: 'Search by name or business name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by categories',
    type: [String],
  })
  @IsOptional()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}

// ==========================================
// UPDATE USER STATUS DTO
// ==========================================
export class UpdateUserStatusDto {
  @ApiProperty({
    description: 'Activate or deactivate user',
  })
  @IsBoolean()
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Reason for status change',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

// ==========================================
// VALIDATE PRESTATAIRE DTO
// ==========================================
export class ValidatePrestataireDto {
  @ApiProperty({
    description: 'Approval decision',
    enum: ['approve', 'reject', 'request_info'],
  })
  @IsString()
  decision: 'approve' | 'reject' | 'request_info';

  @ApiPropertyOptional({
    description: 'Message to prestataire (required for reject/request_info)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;

  @ApiPropertyOptional({
    description: 'Award verified badge on approval',
  })
  @IsOptional()
  @IsBoolean()
  awardVerifiedBadge?: boolean;
}

// ==========================================
// MODERATE REVIEW DTO
// ==========================================
export class ModerateReviewDto {
  @ApiProperty({
    description: 'Moderation decision',
    enum: ['keep', 'remove', 'warn_author'],
  })
  @IsString()
  decision: 'keep' | 'remove' | 'warn_author';

  @ApiPropertyOptional({
    description: 'Reason for decision',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

// ==========================================
// AWARD BADGE DTO
// ==========================================
export class AwardBadgeDto {
  @ApiProperty({
    description: 'Badge type to award',
  })
  @IsString()
  badgeType: string;

  @ApiPropertyOptional({
    description: 'Expiration date (null for permanent)',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

// ==========================================
// PLATFORM STATISTICS DTO
// ==========================================
export class PlatformStatisticsDto {
  @ApiProperty()
  users: {
    total: number;
    clients: number;
    prestataires: number;
    admins: number;
    newThisMonth: number;
    newThisWeek: number;
    activeToday: number;
  };

  @ApiProperty()
  prestataires: {
    pending: number;
    active: number;
    suspended: number;
    topRated: number;
  };

  @ApiProperty()
  appointments: {
    total: number;
    thisMonth: number;
    thisWeek: number;
    today: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    cancellationRate: number;
  };

  @ApiProperty()
  reviews: {
    total: number;
    thisMonth: number;
    averageRating: number;
    flagged: number;
  };

  @ApiProperty()
  revenue: {
    totalEstimated: number;
    thisMonth: number;
    lastMonth: number;
  };
}

// ==========================================
// AUDIT LOG QUERY DTO
// ==========================================
export class QueryAuditLogsDto {
  @ApiPropertyOptional({
    description: 'Filter by user ID',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filter by action',
  })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({
    description: 'Filter by entity type',
  })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({
    description: 'Start date',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 50,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}

// ==========================================
// CATEGORY MANAGEMENT DTO
// ==========================================
export class CreateCategoryDto {
  @ApiProperty({
    description: 'Category name',
    example: 'Massage',
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Category icon',
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({
    description: 'Category description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({
    description: 'Category name',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Category icon',
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({
    description: 'Category description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Is category active',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
