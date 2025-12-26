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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { ReviewsService } from './reviews.service';
import {
  CreateReviewDto,
  UpdateReviewDto,
  RespondReviewDto,
  FlagReviewDto,
  QueryReviewsDto,
} from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, Roles, Public } from '../common/decorators';
import { UserRole } from '../common/constants';

// reviews.controller.ts - Corriger l'ORDRE des routes

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // ==========================================
  // STATIC ROUTES FIRST (routes sans paramètres dynamiques)
  // ==========================================

  @Get('my/reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my reviews (client)' })
  @ApiResponse({ status: 200, description: 'List of my reviews' })
  async getMyReviews(@CurrentUser('id') clientId: string, @Query() query: QueryReviewsDto) {
    return this.reviewsService.findByClient(clientId, query);
  }

  @Get('received')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PRESTATAIRE)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get reviews received by prestataire' })
  @ApiResponse({ status: 200, description: 'List of received reviews' })
  async getReceivedReviews(
    @CurrentUser('id') prestataireId: string,
    @Query() query: QueryReviewsDto
  ) {
    return this.reviewsService.findByPrestataire(prestataireId, query);
  }

  @Get('admin/flagged')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get flagged reviews (admin)' })
  @ApiResponse({ status: 200, description: 'List of flagged reviews' })
  async getFlaggedReviews(@Query() query: QueryReviewsDto) {
    return this.reviewsService.findFlaggedReviews(query);
  }

  @Get('prestataire/:prestataireId')
  @Public()
  @ApiOperation({ summary: 'Get reviews for a prestataire' })
  @ApiResponse({ status: 200, description: 'List of reviews' })
  async getReviewsForPrestataire(
    @Param('prestataireId', ParseUUIDPipe) prestataireId: string,
    @Query() query: QueryReviewsDto
  ) {
    return this.reviewsService.findByPrestataire(prestataireId, query);
  }

  @Get('prestataire/:prestataireId/stats')
  @Public()
  @ApiOperation({ summary: 'Get review statistics for a prestataire' })
  @ApiResponse({ status: 200, description: 'Review statistics' })
  async getReviewStats(@Param('prestataireId', ParseUUIDPipe) prestataireId: string) {
    return this.reviewsService.getReviewStats(prestataireId);
  }

  // ==========================================
  // PARAMETERIZED ROUTES LAST (routes avec :id)
  // ==========================================

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get review by ID' })
  @ApiResponse({ status: 200, description: 'Review details' })
  async getReview(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewsService.findById(id);
  }

  // ==========================================
  // POST/PATCH/DELETE (ordre moins important)
  // ==========================================

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a review for a completed appointment' })
  @ApiResponse({ status: 201, description: 'Review created' })
  async createReview(@CurrentUser('id') clientId: string, @Body() dto: CreateReviewDto) {
    return this.reviewsService.createReview(clientId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a review (max 2 edits)' })
  @ApiResponse({ status: 200, description: 'Review updated' })
  async updateReview(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') clientId: string,
    @Body() dto: UpdateReviewDto
  ) {
    return this.reviewsService.updateReview(id, clientId, dto);
  }

  @Patch(':id/respond')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PRESTATAIRE)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Respond to a review' })
  @ApiResponse({ status: 200, description: 'Response added' })
  async respondToReview(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') prestataireId: string,
    @Body() dto: RespondReviewDto
  ) {
    return this.reviewsService.respondToReview(id, prestataireId, dto);
  }

  @Patch(':id/hide')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Hide a review (admin)' })
  @ApiResponse({ status: 200, description: 'Review hidden' })
  async hideReview(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewsService.hideReview(id);
  }

  @Patch(':id/unflag')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Unflag a review (admin)' })
  @ApiResponse({ status: 200, description: 'Review unflagged' })
  async unflagReview(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewsService.unflagReview(id);
  }

  @Post(':id/flag')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Flag a review for moderation' })
  @ApiResponse({ status: 200, description: 'Review flagged' })
  async flagReview(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: FlagReviewDto
  ) {
    return this.reviewsService.flagReview(id, userId, dto);
  }
}
