import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, Roles } from '../common/decorators';
import { UserRole } from '../common/constants';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PRESTATAIRE)
@ApiBearerAuth('JWT-auth')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics' })
  async getStats(@CurrentUser('id') prestataireId: string) {
    return this.dashboardService.getStats(prestataireId);
  }

  @Get('appointments/chart')
  @ApiOperation({ summary: 'Get appointments by day for chart' })
  @ApiResponse({ status: 200, description: 'Appointments by day' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getAppointmentsByDay(
    @CurrentUser('id') prestataireId: string,
    @Query('days') days?: number
  ) {
    return this.dashboardService.getAppointmentsByDay(
      prestataireId,
      days ? parseInt(days.toString()) : 30
    );
  }

  @Get('revenue/chart')
  @ApiOperation({ summary: 'Get revenue by month for chart' })
  @ApiResponse({ status: 200, description: 'Revenue by month' })
  @ApiQuery({ name: 'months', required: false, type: Number })
  async getRevenueByMonth(
    @CurrentUser('id') prestataireId: string,
    @Query('months') months?: number
  ) {
    return this.dashboardService.getRevenueByMonth(
      prestataireId,
      months ? parseInt(months.toString()) : 12
    );
  }

  @Get('appointments/today')
  @ApiOperation({ summary: "Get today's appointments" })
  @ApiResponse({ status: 200, description: "Today's appointments" })
  async getTodayAppointments(@CurrentUser('id') prestataireId: string) {
    return this.dashboardService.getTodayAppointments(prestataireId);
  }

  @Get('reviews/recent')
  @ApiOperation({ summary: 'Get recent reviews' })
  @ApiResponse({ status: 200, description: 'Recent reviews' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRecentReviews(@CurrentUser('id') prestataireId: string, @Query('limit') limit?: number) {
    return this.dashboardService.getRecentReviews(
      prestataireId,
      limit ? parseInt(limit.toString()) : 5
    );
  }

  @Get('reviews/distribution')
  @ApiOperation({ summary: 'Get rating distribution' })
  @ApiResponse({ status: 200, description: 'Rating distribution' })
  async getRatingDistribution(@CurrentUser('id') prestataireId: string) {
    return this.dashboardService.getRatingDistribution(prestataireId);
  }
}
