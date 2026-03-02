/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  MaxLength,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsArray,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { AppointmentStatus } from '../../common/constants';

// ==========================================
// BOOK APPOINTMENT DTO
// ==========================================
export class BookAppointmentDto {
  @ApiProperty({
    description: 'Slot ID to book',
    example: 'uuid',
  })
  @IsUUID()
  slotId: string;

  @ApiProperty({
    description: 'Service ID',
    example: 'uuid',
  })
  @IsUUID()
  serviceId: string;

  @ApiPropertyOptional({
    description: 'Client note for the appointment',
    example: 'Je souhaiterais une coupe dégradée',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  clientNote?: string;
}

// ==========================================
// CANCEL APPOINTMENT DTO
// ==========================================
export class CancelAppointmentDto {
  @ApiPropertyOptional({
    description: 'Reason for cancellation',
    example: 'Imprévu personnel',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

// ==========================================
// QUERY APPOINTMENTS DTO
// ==========================================
export class QueryAppointmentsDto {
  @ApiPropertyOptional({ enum: AppointmentStatus, isArray: true })
  @IsOptional()
  @Transform(({ value }) => {
    // Handle undefined/null - return undefined to let @IsOptional handle it
    if (value === undefined || value === null) return undefined;
    // Already an array - return as-is
    if (Array.isArray(value)) return value;
    // Single string value - wrap in array
    if (typeof value === 'string') return [value];
    return value;
  })
  @IsArray()
  @IsEnum(AppointmentStatus, { each: true })
  status?: AppointmentStatus[];

  @ApiPropertyOptional({
    description: 'Filter by client ID',
  })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({
    description: 'Filter by prestataire ID',
  })
  @IsOptional()
  @IsUUID()
  prestataireId?: string;

  @ApiPropertyOptional({
    description: 'Filter by service ID',
  })
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiPropertyOptional({
    description: 'Start date filter',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;
  @ApiPropertyOptional({
    description: 'End date filter',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'View type',
    enum: ['upcoming', 'past', 'all'],
    default: 'all',
  })
  @IsOptional()
  @IsString()
  view?: 'upcoming' | 'past' | 'all';

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
// APPOINTMENT RESPONSE DTO
// ==========================================
export class AppointmentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  clientId: string;

  @ApiProperty()
  prestataireId: string;

  @ApiProperty()
  slotId: string;

  @ApiProperty()
  serviceId: string;

  @ApiProperty({ enum: AppointmentStatus })
  status: AppointmentStatus;

  @ApiProperty({ nullable: true })
  clientNote: string | null;

  @ApiProperty({ nullable: true })
  cancelledBy: string | null;

  @ApiProperty({ nullable: true })
  cancelledAt: Date | null;

  @ApiProperty({ nullable: true })
  cancellationReason: string | null;

  @ApiProperty()
  priceAtBooking: number;

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
    phone: string | null;
    avatar: string | null;
  };

  @ApiPropertyOptional()
  prestataire?: {
    id: string;
    businessName: string;
    firstName: string;
    lastName: string;
    phone: string;
    avatar: string | null;
  };

  @ApiPropertyOptional()
  slot?: {
    id: string;
    date: Date;
    startTime: string;
    endTime: string;
  };

  @ApiPropertyOptional()
  service?: {
    id: string;
    name: string;
    duration: number;
    price: number;
  };
}
