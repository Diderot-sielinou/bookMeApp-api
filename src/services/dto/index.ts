import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsNumber,
  Min,
  Max,
  IsUrl,
  IsBoolean,
  IsInt,
} from 'class-validator';

// ==========================================
// CREATE SERVICE DTO
// ==========================================
export class CreateServiceDto {
  @ApiProperty({
    description: 'Service name',
    example: 'Coupe femme',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Service description',
    example: 'Coupe, shampooing et brushing inclus',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Duration in minutes',
    example: 60,
    minimum: 15,
    maximum: 480,
  })
  @IsNumber()
  @Min(15, { message: 'Duration must be at least 15 minutes' })
  @Max(480, { message: 'Duration cannot exceed 8 hours (480 minutes)' })
  duration: number;

  @ApiProperty({
    description: 'Price in currency',
    example: 45.0,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Price cannot be negative' })
  price: number;

  @ApiPropertyOptional({
    description: 'Service image URL',
    example: 'https://cloudinary.com/service.jpg',
  })
  @IsOptional()
  @IsUrl()
  image?: string;

  @ApiPropertyOptional({
    description: 'Display order',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

// ==========================================
// UPDATE SERVICE DTO
// ==========================================
export class UpdateServiceDto extends PartialType(CreateServiceDto) {
  @ApiPropertyOptional({
    description: 'Whether service is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ==========================================
// SERVICE RESPONSE DTO
// ==========================================
export class ServiceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  prestataireId: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty()
  duration: number;

  @ApiProperty()
  price: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  displayOrder: number;

  @ApiProperty({ nullable: true })
  image: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// ==========================================
// SERVICE LIST QUERY DTO
// ==========================================
export class ServiceQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by prestataire ID',
  })
  @IsOptional()
  @IsString()
  prestataireId?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
