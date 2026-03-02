import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
  // Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';

import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, Roles } from '../common/decorators';
import { UserRole } from '../common/constants';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==========================================
  // STATISTICS
  // ==========================================

  @Get('stats')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Admin statistics' })
  async getStats() {
    return this.adminService.getStats();
  }

  // ==========================================
  // USER MANAGEMENT
  // ==========================================

  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of users' })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getUsers(
    @Query('role') role?: UserRole,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string
  ) {
    return this.adminService.getUsers({
      role,
      page: page ? parseInt(page.toString()) : undefined,
      limit: limit ? parseInt(limit.toString()) : undefined,
      search,
    });
  }

  @Patch('users/:id/suspend')
  @ApiOperation({ summary: 'Suspend a user' })
  @ApiResponse({ status: 200, description: 'User suspended' })
  async suspendUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') adminId: string,
    @Body() body: { reason?: string }
  ) {
    await this.adminService.suspendUser(id, adminId, body.reason);
    return { message: 'User suspended successfully' };
  }

  @Patch('users/:id/reactivate')
  @ApiOperation({ summary: 'Reactivate a user' })
  @ApiResponse({ status: 200, description: 'User reactivated' })
  async reactivateUser(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') adminId: string) {
    await this.adminService.reactivateUser(id, adminId);
    return { message: 'User reactivated successfully' };
  }

  // ==========================================
  // PRESTATAIRE VALIDATION
  // ==========================================

  @Get('prestataires/pending')
  @ApiOperation({ summary: 'Get pending prestataires for approval' })
  @ApiResponse({ status: 200, description: 'List of pending prestataires' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPendingPrestataires(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getPendingPrestataires({
      page: page ? parseInt(page.toString()) : undefined,
      limit: limit ? parseInt(limit.toString()) : undefined,
    });
  }

  @Post('prestataires/:id/approve')
  @ApiOperation({ summary: 'Approve a prestataire' })
  @ApiResponse({ status: 200, description: 'Prestataire approved' })
  async approvePrestataire(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') adminId: string
  ) {
    return this.adminService.approvePrestataire(id, adminId);
  }

  @Post('prestataires/:id/reject')
  @ApiOperation({ summary: 'Reject a prestataire' })
  @ApiResponse({ status: 200, description: 'Prestataire rejected' })
  async rejectPrestataire(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') adminId: string,
    @Body() body: { reason: string }
  ) {
    await this.adminService.rejectPrestataire(id, adminId, body.reason);
    return { message: 'Prestataire rejected successfully' };
  }

  // ==========================================
  // REVIEW MODERATION
  // ==========================================

  @Get('reviews/flagged')
  @ApiOperation({ summary: 'Get flagged reviews' })
  @ApiResponse({ status: 200, description: 'List of flagged reviews' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getFlaggedReviews(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getFlaggedReviews({
      page: page ? parseInt(page.toString()) : undefined,
      limit: limit ? parseInt(limit.toString()) : undefined,
    });
  }

  @Patch('reviews/:id/hide')
  @ApiOperation({ summary: 'Hide a review' })
  @ApiResponse({ status: 200, description: 'Review hidden' })
  async hideReview(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') adminId: string) {
    await this.adminService.hideReview(id, adminId);
    return { message: 'Review hidden successfully' };
  }

  @Patch('reviews/:id/unflag')
  @ApiOperation({ summary: 'Unflag a review' })
  @ApiResponse({ status: 200, description: 'Review unflagged' })
  async unflagReview(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') adminId: string) {
    await this.adminService.unflagReview(id, adminId);
    return { message: 'Review unflagged successfully' };
  }

  // ==========================================
  // AUDIT LOGS
  // ==========================================

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get audit logs' })
  @ApiResponse({ status: 200, description: 'List of audit logs' })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'entityType', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAuditLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.adminService.getAuditLogs({
      userId,
      action,
      entityType,
      page: page ? parseInt(page.toString()) : undefined,
      limit: limit ? parseInt(limit.toString()) : undefined,
    });
  }
}
