/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  // ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Review } from './entities/review.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Prestataire } from '../users/entities/prestataire.entity';
import {
  CreateReviewDto,
  UpdateReviewDto,
  RespondReviewDto,
  FlagReviewDto,
  QueryReviewsDto,
} from './dto';
import { AppointmentStatus } from '../common/constants';
import { normalizePagination, createPaginatedResult } from '../common/utils/pagination.util';
import { PaginatedResult } from '../common/interfaces';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);
  private readonly MAX_EDITS = 2;

  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Prestataire)
    private readonly prestataireRepository: Repository<Prestataire>,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Create a review for a completed appointment
   */
  async createReview(clientId: string, dto: CreateReviewDto): Promise<Review> {
    // Verify appointment exists and belongs to client
    const appointment = await this.appointmentRepository.findOne({
      where: { id: dto.appointmentId, clientId },
      relations: ['review'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Verify appointment is completed
    if (appointment.status !== AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Can only review completed appointments');
    }

    // Verify no existing review
    if (appointment.review) {
      throw new BadRequestException('Appointment already has a review');
    }

    // Create review
    const review = this.reviewRepository.create({
      appointmentId: dto.appointmentId,
      clientId,
      prestataireId: appointment.prestataireId,
      rating: dto.rating,
      qualityRating: dto.qualityRating,
      punctualityRating: dto.punctualityRating,
      cleanlinessRating: dto.cleanlinessRating,
      comment: dto.comment,
    });

    await this.reviewRepository.save(review);

    // Update prestataire rating
    await this.updatePrestataireRating(appointment.prestataireId);

    this.logger.log(`Review created: ${review.id} for appointment ${dto.appointmentId}`);

    // Emit review created event
    this.eventEmitter.emit('review.created', { review });

    return review;
  }

  /**
   * Update a review (limited edits)
   */
  async updateReview(reviewId: string, clientId: string, dto: UpdateReviewDto): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId, clientId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Check edit limit
    if (review.editCount >= this.MAX_EDITS) {
      throw new BadRequestException(`Maximum ${this.MAX_EDITS} edits allowed`);
    }

    // Store original comment on first edit
    if (review.editCount === 0 && dto.comment && review.comment) {
      review.originalComment = review.comment;
    }

    // Update review
    Object.assign(review, dto);
    review.editCount += 1;
    review.editedAt = new Date();

    await this.reviewRepository.save(review);

    // Update prestataire rating if rating changed
    if (dto.rating) {
      await this.updatePrestataireRating(review.prestataireId);
    }

    this.logger.log(`Review updated: ${reviewId}`);

    return review;
  }

  /**
   * Prestataire responds to a review
   */
  async respondToReview(
    reviewId: string,
    prestataireId: string,
    dto: RespondReviewDto
  ): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId, prestataireId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.prestataireResponse) {
      throw new BadRequestException('Review already has a response');
    }

    review.prestataireResponse = dto.response;
    review.responseAt = new Date();

    await this.reviewRepository.save(review);

    this.logger.log(`Response added to review: ${reviewId}`);

    // Emit response event
    this.eventEmitter.emit('review.responded', { review });

    return review;
  }

  /**
   * Flag a review for moderation
   */
  async flagReview(reviewId: string, userId: string, dto: FlagReviewDto): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.flagged) {
      throw new BadRequestException('Review is already flagged');
    }

    review.flagged = true;
    review.flagReason = dto.reason;
    review.flaggedBy = userId;

    await this.reviewRepository.save(review);

    this.logger.log(`Review flagged: ${reviewId} by ${userId}`);

    // Emit flagged event for admin notification
    this.eventEmitter.emit('review.flagged', { review, reason: dto.reason });

    return review;
  }

  /**
   * Find review by ID
   */
  async findById(reviewId: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId, isVisible: true },
      relations: ['client', 'appointment', 'appointment.service'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  /**
   * Find reviews for a prestataire
   */
  async findByPrestataire(
    prestataireId: string,
    dto: QueryReviewsDto
  ): Promise<PaginatedResult<Review>> {
    const { page, limit, skip } = normalizePagination(dto.page, dto.limit);

    const queryBuilder = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.client', 'client')
      .leftJoinAndSelect('review.appointment', 'appointment')
      .leftJoinAndSelect('appointment.service', 'service')
      .where('review.prestataireId = :prestataireId', { prestataireId })
      .andWhere('review.isVisible = :isVisible', { isVisible: true });

    // Filter by rating
    if (dto.minRating) {
      queryBuilder.andWhere('review.rating >= :minRating', {
        minRating: dto.minRating,
      });
    }
    if (dto.maxRating) {
      queryBuilder.andWhere('review.rating <= :maxRating', {
        maxRating: dto.maxRating,
      });
    }

    // Order
    const sortBy = dto.sortBy || 'createdAt';
    const sortOrder = dto.sortOrder || 'DESC';
    queryBuilder.orderBy(`review.${sortBy}`, sortOrder);

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    const reviews = await queryBuilder.getMany();

    return createPaginatedResult(reviews, total, page, limit);
  }

  /**
   * Find reviews by client
   */
  async findByClient(clientId: string, dto: QueryReviewsDto): Promise<PaginatedResult<Review>> {
    const { page, limit, skip } = normalizePagination(dto.page, dto.limit);

    const queryBuilder = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.prestataire', 'prestataire')
      .leftJoinAndSelect('review.appointment', 'appointment')
      .leftJoinAndSelect('appointment.service', 'service')
      .where('review.clientId = :clientId', { clientId });

    // Order
    queryBuilder.orderBy('review.createdAt', 'DESC');

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    const reviews = await queryBuilder.getMany();

    return createPaginatedResult(reviews, total, page, limit);
  }

  /**
   * Get review statistics for a prestataire
   */
  async getReviewStats(prestataireId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    distribution: Record<number, number>;
    averageQuality?: number;
    averagePunctuality?: number;
    averageCleanliness?: number;
  }> {
    const stats = await this.reviewRepository
      .createQueryBuilder('review')
      .where('review.prestataireId = :prestataireId', { prestataireId })
      .andWhere('review.isVisible = :isVisible', { isVisible: true })
      .select([
        'AVG(review.rating) as "averageRating"',
        'COUNT(review.id) as "totalReviews"',
        'AVG(review.qualityRating) as "averageQuality"',
        'AVG(review.punctualityRating) as "averagePunctuality"',
        'AVG(review.cleanlinessRating) as "averageCleanliness"',
      ])
      .getRawOne();

    // Get rating distribution
    const distribution = await this.reviewRepository
      .createQueryBuilder('review')
      .where('review.prestataireId = :prestataireId', { prestataireId })
      .andWhere('review.isVisible = :isVisible', { isVisible: true })
      .select(['review.rating', 'COUNT(review.id) as count'])
      .groupBy('review.rating')
      .getRawMany();

    const distributionMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach((d) => {
      distributionMap[d.rating] = parseInt(d.count);
    });

    return {
      averageRating: parseFloat(stats.averageRating) || 0,
      totalReviews: parseInt(stats.totalReviews) || 0,
      distribution: distributionMap,
      averageQuality: stats.averageQuality ? parseFloat(stats.averageQuality) : undefined,
      averagePunctuality: stats.averagePunctuality
        ? parseFloat(stats.averagePunctuality)
        : undefined,
      averageCleanliness: stats.averageCleanliness
        ? parseFloat(stats.averageCleanliness)
        : undefined,
    };
  }

  // ==========================================
  // ADMIN METHODS
  // ==========================================

  /**
   * Hide a review (admin moderation)
   */
  async hideReview(reviewId: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.isVisible = false;
    await this.reviewRepository.save(review);

    // Update prestataire rating
    await this.updatePrestataireRating(review.prestataireId);

    this.logger.log(`Review hidden: ${reviewId}`);

    return review;
  }

  /**
   * Unflag a review (admin cleared)
   */
  async unflagReview(reviewId: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.flagged = false;
    review.flagReason = null;
    review.flaggedBy = null;

    await this.reviewRepository.save(review);

    this.logger.log(`Review unflagged: ${reviewId}`);

    return review;
  }

  /**
   * Find flagged reviews (for admin)
   */
  async findFlaggedReviews(dto: QueryReviewsDto): Promise<PaginatedResult<Review>> {
    const { page, limit, skip } = normalizePagination(dto.page, dto.limit);

    const queryBuilder = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.client', 'client')
      .leftJoinAndSelect('review.prestataire', 'prestataire')
      .where('review.flagged = :flagged', { flagged: true })
      .orderBy('review.updatedAt', 'DESC');

    const total = await queryBuilder.getCount();
    queryBuilder.skip(skip).take(limit);

    const reviews = await queryBuilder.getMany();

    return createPaginatedResult(reviews, total, page, limit);
  }

  // ==========================================
  // PRIVATE METHODS
  // ==========================================

  /**
   * Update prestataire average rating with temporal weighting
   */
  private async updatePrestataireRating(prestataireId: string): Promise<void> {
    // Get all visible reviews with temporal weighting
    // More recent reviews have higher weight
    const reviews = await this.reviewRepository.find({
      where: { prestataireId, isVisible: true },
      order: { createdAt: 'DESC' },
    });

    if (reviews.length === 0) {
      await this.prestataireRepository.update(prestataireId, {
        averageRating: 0,
        totalReviews: 0,
      });
      return;
    }

    // Calculate weighted average (more recent = higher weight)
    let totalWeight = 0;
    let weightedSum = 0;

    reviews.forEach((review, index) => {
      // Weight decreases exponentially with age
      // First review (most recent) gets weight 1, then 0.95, 0.9, etc.
      const weight = Math.pow(0.95, index);
      weightedSum += review.rating * weight;
      totalWeight += weight;
    });

    const weightedAverage = weightedSum / totalWeight;

    await this.prestataireRepository.update(prestataireId, {
      averageRating: Math.round(weightedAverage * 100) / 100,
      totalReviews: reviews.length,
    });
  }
}
