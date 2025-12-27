import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsPhoneNumber,
  IsArray,
  IsUrl,
  IsNumber,
  Min,
  Max,
  ValidateNested,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OpeningHours } from '../../common/interfaces';

// ==========================================
// UPDATE CLIENT DTO
// ==========================================
export class UpdateClientDto {
  @ApiPropertyOptional({
    description: 'First name',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Last name',
    example: 'Doe',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+33612345678',
  })
  @IsOptional()
  @IsPhoneNumber(undefined, { message: 'Invalid phone number format' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Avatar URL',
    example: 'https://cloudinary.com/avatar.jpg',
  })
  @IsOptional()
  @IsUrl()
  avatar?: string;
}

// ==========================================
// TIME SLOT DTO (for opening hours)
// ==========================================
export class TimeSlotDto {
  @ApiProperty({ description: 'Start time (HH:mm)', example: '09:00' })
  @IsString()
  start: string;

  @ApiProperty({ description: 'End time (HH:mm)', example: '12:00' })
  @IsString()
  end: string;
}

// ==========================================
// OPENING HOURS DTO
// ==========================================
export class OpeningHoursDto {
  @ApiPropertyOptional({ type: [TimeSlotDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  monday?: TimeSlotDto[] | 'closed';

  @ApiPropertyOptional({ type: [TimeSlotDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  tuesday?: TimeSlotDto[] | 'closed';

  @ApiPropertyOptional({ type: [TimeSlotDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  wednesday?: TimeSlotDto[] | 'closed';

  @ApiPropertyOptional({ type: [TimeSlotDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  thursday?: TimeSlotDto[] | 'closed';

  @ApiPropertyOptional({ type: [TimeSlotDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  friday?: TimeSlotDto[] | 'closed';

  @ApiPropertyOptional({ type: [TimeSlotDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  saturday?: TimeSlotDto[] | 'closed';

  @ApiPropertyOptional({ type: [TimeSlotDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  sunday?: TimeSlotDto[] | 'closed';
}

// ==========================================
// UPDATE PRESTATAIRE DTO
// ==========================================
export class UpdatePrestataireDto {
  @ApiPropertyOptional({
    description: 'Business name',
    example: 'Salon de Beauté Marie',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  businessName?: string;

  @ApiPropertyOptional({
    description: 'First name',
    example: 'Marie',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Last name',
    example: 'Dupont',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Bio description',
    example: "Coiffeuse professionnelle avec 10 ans d'expérience...",
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({
    description: 'Professional categories',
    example: ['Coiffure', 'Esthétique'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+33612345678',
  })
  @IsOptional()
  @IsPhoneNumber(undefined, { message: 'Invalid phone number format' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Avatar URL',
  })
  @IsOptional()
  @IsUrl()
  avatar?: string;

  @ApiPropertyOptional({
    description: 'Portfolio images URLs',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  portfolioImages?: string[];

  @ApiPropertyOptional({
    description: 'Opening hours',
    type: OpeningHoursDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => OpeningHoursDto)
  openingHours?: OpeningHours;

  @ApiPropertyOptional({
    description: 'Pause duration between appointments (minutes)',
    example: 15,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(120)
  pauseDuration?: number;

  @ApiPropertyOptional({
    description: 'Minimum booking notice (hours)',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(168)
  minBookingNotice?: number;

  @ApiPropertyOptional({
    description: 'Minimum cancellation hours',
    example: 24,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(168)
  minCancellationHours?: number;

  @ApiPropertyOptional({
    description: 'Cancellation policy',
    example: "Annulation gratuite jusqu'à 24h avant le rendez-vous",
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  cancellationPolicy?: string;

  @ApiPropertyOptional({
    description: 'Address',
    example: '123 Rue de la Paix',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Paris',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    description: 'Postal code',
    example: '75001',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  postalCode?: string;
}

// ==========================================
// NOTIFICATION PREFERENCES DTO
// ==========================================
export class NotificationPreferencesDto {
  @ApiPropertyOptional({
    description: 'Receive in-app notifications',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  inApp?: boolean;

  @ApiPropertyOptional({
    description: 'Receive email notifications',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @ApiPropertyOptional({
    description: 'Receive appointment reminders',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  appointmentReminders?: boolean;

  @ApiPropertyOptional({
    description: 'Receive marketing emails',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  marketing?: boolean;
}

// ==========================================
// USER RESPONSE DTO (for API responses)
// ==========================================
export class ClientResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ nullable: true })
  phone: string | null;

  @ApiProperty({ nullable: true })
  avatar: string | null;

  @ApiProperty()
  emailVerified: boolean;

  @ApiProperty()
  createdAt: Date;
}

export class PrestataireResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

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

  @ApiProperty()
  phone: string;

  @ApiProperty({ nullable: true })
  avatar: string | null;

  @ApiProperty({ type: [String], nullable: true })
  portfolioImages: string[] | null;

  @ApiProperty({ nullable: true })
  openingHours: OpeningHours | null;

  @ApiProperty()
  pauseDuration: number;

  @ApiProperty()
  minBookingNotice: number;

  @ApiProperty()
  minCancellationHours: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  averageRating: number;

  @ApiProperty()
  totalReviews: number;

  @ApiProperty()
  totalAppointments: number;

  @ApiProperty()
  profileCompleted: boolean;

  @ApiProperty()
  emailVerified: boolean;

  @ApiProperty()
  createdAt: Date;
}
