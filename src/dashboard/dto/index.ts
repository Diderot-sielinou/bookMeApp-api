import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// ==========================================
// DASHBOARD STATISTICS DTO
// ==========================================
export class DashboardStatisticsDto {
  @ApiProperty({ description: 'Appointments today' })
  appointmentsToday: number;

  @ApiProperty({ description: 'Appointments this week' })
  appointmentsThisWeek: number;

  @ApiProperty({ description: 'Appointments this month' })
  appointmentsThisMonth: number;

  @ApiProperty({ description: 'Occupancy rate (%)' })
  occupancyRate: number;

  @ApiProperty({ description: 'Average rating' })
  averageRating: number;

  @ApiProperty({ description: 'Total reviews' })
  totalReviews: number;

  @ApiProperty({ description: 'Cancellation rate (%)' })
  cancellationRate: number;

  @ApiProperty({ description: 'Estimated revenue this month' })
  estimatedRevenue: number;

  @ApiProperty({ description: 'Comparison with last month' })
  comparisonWithLastMonth: {
    appointmentsChange: number; // percentage
    revenueChange: number; // percentage
  };
}

// ==========================================
// DASHBOARD QUERY DTO
// ==========================================
export class DashboardQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for statistics',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for statistics',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

// ==========================================
// APPOINTMENTS BY DAY DTO
// ==========================================
export class AppointmentsByDayDto {
  @ApiProperty()
  date: string;

  @ApiProperty()
  count: number;

  @ApiProperty()
  revenue: number;
}

// ==========================================
// TOP SERVICES DTO
// ==========================================
export class TopServicesDto {
  @ApiProperty()
  serviceId: string;

  @ApiProperty()
  serviceName: string;

  @ApiProperty()
  bookingsCount: number;

  @ApiProperty()
  revenue: number;

  @ApiProperty()
  percentage: number;
}

// ==========================================
// CALENDAR DATA DTO
// ==========================================
export class CalendarDataDto {
  @ApiPropertyOptional({
    description: 'Month (1-12)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month?: number;

  @ApiPropertyOptional({
    description: 'Year',
  })
  @IsOptional()
  @IsInt()
  @Min(2020)
  @Type(() => Number)
  year?: number;
}

// ==========================================
// CALENDAR DAY DTO
// ==========================================
export class CalendarDayDto {
  @ApiProperty()
  date: string;

  @ApiProperty()
  availableSlots: number;

  @ApiProperty()
  reservedSlots: number;

  @ApiProperty()
  blockedSlots: number;

  @ApiProperty()
  appointments: Array<{
    id: string;
    clientName: string;
    serviceName: string;
    startTime: string;
    endTime: string;
    status: string;
  }>;
}

// ==========================================
// UPCOMING APPOINTMENTS DTO
// ==========================================
export class UpcomingAppointmentsQueryDto {
  @ApiPropertyOptional({
    description: 'Number of appointments to return',
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
// RECENT REVIEWS DTO
// ==========================================
export class RecentReviewsQueryDto {
  @ApiPropertyOptional({
    description: 'Number of reviews to return',
    default: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  @Type(() => Number)
  limit?: number;
}

// ==========================================
// REVENUE SUMMARY DTO
// ==========================================
export class RevenueSummaryDto {
  @ApiProperty({ description: 'Total revenue this month' })
  thisMonth: number;

  @ApiProperty({ description: 'Total revenue last month' })
  lastMonth: number;

  @ApiProperty({ description: 'Revenue change percentage' })
  changePercentage: number;

  @ApiProperty({ description: 'Revenue by service' })
  byService: Array<{
    serviceId: string;
    serviceName: string;
    revenue: number;
    percentage: number;
  }>;

  @ApiProperty({ description: 'Daily revenue for the month' })
  daily: Array<{
    date: string;
    revenue: number;
  }>;
}

// ==========================================
// CLIENT STATISTICS DTO
// ==========================================
export class ClientStatisticsDto {
  @ApiProperty({ description: 'Total unique clients' })
  totalClients: number;

  @ApiProperty({ description: 'New clients this month' })
  newClientsThisMonth: number;

  @ApiProperty({ description: 'Returning clients rate (%)' })
  returningClientsRate: number;

  @ApiProperty({ description: 'Top clients by appointments' })
  topClients: Array<{
    clientId: string;
    clientName: string;
    appointmentsCount: number;
    totalSpent: number;
  }>;
}
