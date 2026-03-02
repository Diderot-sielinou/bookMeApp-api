import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

// ==========================================
// CREATE REVIEW DTO
// ==========================================
export class CreateReviewDto {
  @ApiProperty({
    description: 'Appointment ID',
    example: 'uuid',
  })
  @IsUUID()
  appointmentId: string;

  @ApiProperty({
    description: 'Overall rating (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating cannot exceed 5' })
  rating: number;

  @ApiPropertyOptional({
    description: 'Quality rating (1-5)',
    example: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  qualityRating?: number;

  @ApiPropertyOptional({
    description: 'Punctuality rating (1-5)',
    example: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  punctualityRating?: number;

  @ApiPropertyOptional({
    description: 'Cleanliness rating (1-5)',
    example: 4,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  cleanlinessRating?: number;

  @ApiPropertyOptional({
    description: 'Review comment (min 10 chars)',
    example: 'Excellent service, très professionnelle !',
  })
  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Comment must be at least 10 characters' })
  @MaxLength(1000, { message: 'Comment cannot exceed 1000 characters' })
  comment?: string;
}

// ==========================================
// UPDATE REVIEW DTO
// ==========================================
export class UpdateReviewDto {
  @ApiPropertyOptional({
    description: 'Overall rating (1-5)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({
    description: 'Quality rating (1-5)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  qualityRating?: number;

  @ApiPropertyOptional({
    description: 'Punctuality rating (1-5)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  punctualityRating?: number;

  @ApiPropertyOptional({
    description: 'Cleanliness rating (1-5)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  cleanlinessRating?: number;

  @ApiPropertyOptional({
    description: 'Review comment',
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  comment?: string;
}

// ==========================================
// RESPOND TO REVIEW DTO
// ==========================================
export class RespondReviewDto {
  @ApiProperty({
    description: 'Prestataire response to the review',
    example: 'Merci beaucoup pour votre retour positif !',
  })
  @IsString()
  @MinLength(5, { message: 'Response must be at least 5 characters' })
  @MaxLength(500, { message: 'Response cannot exceed 500 characters' })
  response: string;
}

// ==========================================
// FLAG REVIEW DTO
// ==========================================
export class FlagReviewDto {
  @ApiProperty({
    description: 'Reason for flagging',
    example: 'Contenu inapproprié',
    enum: ['inappropriate', 'spam', 'off_topic', 'fake'],
  })
  @IsString()
  @MaxLength(500)
  reason: string;
}

// ==========================================
// QUERY REVIEWS DTO
// ==========================================
export class QueryReviewsDto {
  @ApiPropertyOptional({
    description: 'Filter by prestataire ID',
  })
  @IsOptional()
  @IsUUID()
  prestataireId?: string;

  @ApiPropertyOptional({
    description: 'Filter by client ID',
  })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({
    description: 'Filter by minimum rating',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  minRating?: number;

  @ApiPropertyOptional({
    description: 'Filter by maximum rating',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  maxRating?: number;

  @ApiPropertyOptional({
    description: 'Filter flagged reviews only',
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  flaggedOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Sort by',
    enum: ['createdAt', 'rating'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'rating';

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
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number;
}

// ==========================================
// REVIEW RESPONSE DTO
// ==========================================
export class ReviewResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  appointmentId: string;

  @ApiProperty()
  clientId: string;

  @ApiProperty()
  prestataireId: string;

  @ApiProperty()
  rating: number;

  @ApiProperty({ nullable: true })
  qualityRating: number | null;

  @ApiProperty({ nullable: true })
  punctualityRating: number | null;

  @ApiProperty({ nullable: true })
  cleanlinessRating: number | null;

  @ApiProperty({ nullable: true })
  comment: string | null;

  @ApiProperty({ nullable: true })
  prestataireResponse: string | null;

  @ApiProperty({ nullable: true })
  responseAt: Date | null;

  @ApiProperty()
  flagged: boolean;

  @ApiProperty()
  isVisible: boolean;

  @ApiProperty()
  editCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Relations
  @ApiPropertyOptional()
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
}

// ==========================================
// REVIEW STATISTICS DTO
// ==========================================
export class ReviewStatisticsDto {
  @ApiProperty()
  averageRating: number;

  @ApiProperty()
  totalReviews: number;

  @ApiProperty()
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };

  @ApiProperty()
  averageQuality: number | null;

  @ApiProperty()
  averagePunctuality: number | null;

  @ApiProperty()
  averageCleanliness: number | null;
}
