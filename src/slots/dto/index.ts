import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  Matches,
  IsArray,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsBoolean,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SlotStatus, DayOfWeek } from '../../common/constants';

// ==========================================
// CREATE SLOT DTO
// ==========================================
export class CreateSlotDto {
  @ApiProperty({
    description: 'Date of the slot (YYYY-MM-DD)',
    example: '2025-01-15',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Start time (HH:mm)',
    example: '09:00',
  })
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Start time must be in HH:mm format',
  })
  startTime: string;

  @ApiProperty({
    description: 'End time (HH:mm)',
    example: '09:30',
  })
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'End time must be in HH:mm format',
  })
  endTime: string;

  @ApiPropertyOptional({
    description: 'Service ID (optional)',
  })
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiPropertyOptional({
    description: 'Notes for this slot',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

// ==========================================
// CREATE RECURRING SLOTS DTO
// ==========================================
export class CreateRecurringSlotsDto {
  @ApiProperty({
    description: 'Days of the week',
    example: ['monday', 'wednesday', 'friday'],
    enum: DayOfWeek,
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one day of week is required' })
  @IsEnum(DayOfWeek, { each: true })
  daysOfWeek: DayOfWeek[];

  @ApiProperty({
    description: 'Start time (HH:mm)',
    example: '09:00',
  })
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
  startTime: string;

  @ApiProperty({
    description: 'End time (HH:mm)',
    example: '17:00',
  })
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
  endTime: string;

  @ApiProperty({
    description: 'Duration per slot in minutes',
    example: 30,
    minimum: 15,
    maximum: 480,
  })
  @IsInt()
  @Min(15)
  @Max(480)
  slotDuration: number;

  @ApiProperty({
    description: 'Start date (YYYY-MM-DD)',
    example: '2025-01-01',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date (YYYY-MM-DD)',
    example: '2025-01-31',
  })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({
    description: 'Service ID (optional)',
  })
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiPropertyOptional({
    description: 'Pause duration between slots in minutes',
    example: 15,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60)
  pauseDuration?: number;
}

// ==========================================
// UPDATE SLOT DTO
// ==========================================
export class UpdateSlotDto {
  @ApiPropertyOptional({
    description: 'Date of the slot',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Start time (HH:mm)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
  startTime?: string;

  @ApiPropertyOptional({
    description: 'End time (HH:mm)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
  endTime?: string;

  @ApiPropertyOptional({
    description: 'Service ID',
  })
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiPropertyOptional({
    description: 'Slot status',
    enum: SlotStatus,
  })
  @IsOptional()
  @IsEnum(SlotStatus)
  status?: SlotStatus;

  @ApiPropertyOptional({
    description: 'Notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

// ==========================================
// BLOCK SLOTS DTO (for vacations)
// ==========================================
export class BlockSlotsDto {
  @ApiProperty({
    description: 'Start date (YYYY-MM-DD)',
    example: '2025-02-01',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date (YYYY-MM-DD)',
    example: '2025-02-15',
  })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({
    description: 'Reason for blocking',
    example: 'Vacances',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

// ==========================================
// QUERY SLOTS DTO
// ==========================================
export class QuerySlotsDto {
  @ApiPropertyOptional({
    description: 'Prestataire ID',
  })
  @IsOptional()
  @IsUUID()
  prestataireId?: string;

  @ApiPropertyOptional({
    description: 'Filter by date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Start date for range',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for range',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: SlotStatus,
  })
  @IsOptional()
  @IsEnum(SlotStatus)
  status?: SlotStatus;

  @ApiPropertyOptional({
    description: 'Filter by service ID',
  })
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiPropertyOptional({
    description: 'Only show available slots',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  availableOnly?: boolean;

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
// SLOT RESPONSE DTO
// ==========================================
export class SlotResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  prestataireId: string;

  @ApiProperty({ nullable: true })
  serviceId: string | null;

  @ApiProperty()
  date: Date;

  @ApiProperty()
  startTime: string;

  @ApiProperty()
  endTime: string;

  @ApiProperty({ enum: SlotStatus })
  status: SlotStatus;

  @ApiProperty({ nullable: true })
  notes: string | null;

  @ApiProperty()
  isRecurring: boolean;

  @ApiProperty()
  createdAt: Date;

  // Optional related data
  @ApiPropertyOptional()
  service?: {
    id: string;
    name: string;
    price: number;
    duration: number;
  };
}

// ==========================================
// RECURRING SLOTS RESULT
// ==========================================
export class RecurringSlotsResultDto {
  @ApiProperty()
  created: number;

  @ApiProperty()
  skipped: number;

  @ApiProperty({ type: [String] })
  skippedDates: string[];

  @ApiProperty({ type: [SlotResponseDto] })
  slots: SlotResponseDto[];
}
