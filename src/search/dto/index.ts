import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  // IsEnum,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

// ==========================================
// SEARCH PRESTATAIRES DTO
// ==========================================
export class SearchPrestatairesDto {
  @ApiPropertyOptional({
    description: 'Search query (name, business name, services)',
    example: 'coiffure paris',
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({
    description: 'Filter by categories',
    example: ['Coiffure', 'Esthétique'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({
    description: 'Minimum rating (1-5)',
    example: 4,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  minRating?: number;

  @ApiPropertyOptional({
    description: 'Minimum price',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Maximum price',
    example: 200,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Filter by badges',
    example: ['TOP', 'VERIFIED'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  badges?: string[];

  @ApiPropertyOptional({
    description: 'Only show prestataires with availability in next N days',
    example: 7,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  @Type(() => Number)
  availableWithinDays?: number;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['relevance', 'rating', 'reviews', 'price_asc', 'price_desc', 'newest'],
    default: 'relevance',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'relevance' | 'rating' | 'reviews' | 'price_asc' | 'price_desc' | 'newest';

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
// SEARCH DTO (for service)
// ==========================================
export class SearchDto {
  @ApiPropertyOptional({ description: 'Search query' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ description: 'Single category filter' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Multiple categories filter', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({ description: 'City filter' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Postal code filter' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Minimum rating' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  minRating?: number;

  @ApiPropertyOptional({ description: 'Minimum price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Only with availability' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hasAvailability?: boolean;

  @ApiPropertyOptional({ description: 'Filter by badges', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  badges?: string[];

  @ApiPropertyOptional({
    description: 'Sort by',
    enum: ['rating', 'reviews', 'appointments', 'name'],
  })
  @IsOptional()
  @IsString()
  sortBy?: 'rating' | 'reviews' | 'appointments' | 'name';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}

// ==========================================
// AUTOCOMPLETE DTO
// ==========================================
export class AutocompleteDto {
  @ApiProperty({
    description: 'Search query',
    example: 'coif',
  })
  @IsString()
  query: string;

  @ApiPropertyOptional({
    description: 'Maximum number of suggestions',
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  @Type(() => Number)
  limit?: number;
}

// ==========================================
// SEARCH RESULT DTO
// ==========================================
export class SearchResultDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  businessName: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ nullable: true })
  bio: string | null;

  @ApiProperty({ type: [String] })
  categories: string[];

  @ApiProperty({ nullable: true })
  avatar: string | null;

  @ApiProperty({ nullable: true })
  city: string | null;

  @ApiProperty({ nullable: true })
  postalCode: string | null;

  @ApiProperty()
  averageRating: number;

  @ApiProperty()
  totalReviews: number;

  @ApiProperty()
  totalAppointments: number;

  @ApiProperty()
  services: Array<{
    id: string;
    name: string;
    price: number;
    duration: number;
  }>;

  @ApiProperty()
  badges: Array<{
    type: string;
    awardedAt: Date;
  }>;

  @ApiProperty({ nullable: true })
  minPrice: number | null;

  @ApiProperty({ nullable: true })
  maxPrice: number | null;
}

// ==========================================
// AUTOCOMPLETE RESULT DTO
// ==========================================
export class AutocompleteResultDto {
  @ApiProperty({
    description: 'Suggestion type',
    enum: ['prestataire', 'category', 'service'],
  })
  type: 'prestataire' | 'category' | 'service';

  @ApiProperty()
  id: string;

  @ApiProperty()
  text: string;

  @ApiPropertyOptional()
  subtext?: string;

  @ApiPropertyOptional()
  avatar?: string;
}

// ==========================================
// POPULAR CATEGORIES DTO
// ==========================================
export class PopularCategoriesDto {
  @ApiPropertyOptional({
    description: 'Number of categories to return',
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  @Type(() => Number)
  limit?: number;
}

// ==========================================
// CATEGORY RESULT DTO
// ==========================================
export class CategoryResultDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  count: number;

  @ApiPropertyOptional()
  icon?: string;
}
