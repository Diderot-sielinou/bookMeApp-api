import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import dayjs from 'dayjs';

import { Badge } from './entities/badge.entity';
import { Prestataire } from '../users/entities/prestataire.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Review } from '../reviews/entities/review.entity';
import { BadgeType, BADGE_CRITERIA, AppointmentStatus } from '../common/constants';

@Injectable()
export class BadgesService {
  private readonly logger = new Logger(BadgesService.name);

  constructor(
    @InjectRepository(Badge)
    private readonly badgeRepository: Repository<Badge>,
    @InjectRepository(Prestataire)
    private readonly prestataireRepository: Repository<Prestataire>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Get badges for a prestataire
   */
  async getBadges(prestataireId: string): Promise<Badge[]> {
    return this.badgeRepository.find({
      where: { prestataireId, isActive: true },
      order: { awardedAt: 'DESC' },
    });
  }

  /**
   * Award a badge to a prestataire
   */
  async awardBadge(prestataireId: string, badgeType: BadgeType): Promise<Badge | null> {
    // Check if badge already exists and is active
    const existingBadge = await this.badgeRepository.findOne({
      where: { prestataireId, type: badgeType, isActive: true },
    });

    if (existingBadge) {
      // Extend expiration for existing badge
      existingBadge.expiresAt = dayjs().add(90, 'day').toDate();
      await this.badgeRepository.save(existingBadge);
      return existingBadge;
    }

    // Create new badge
    const badge = this.badgeRepository.create({
      prestataireId,
      type: badgeType,
      awardedAt: new Date(),
      expiresAt: dayjs().add(90, 'day').toDate(),
      isActive: true,
    });

    await this.badgeRepository.save(badge);

    this.logger.log(`Badge ${badgeType} awarded to prestataire ${prestataireId}`);

    // Emit event for notification
    this.eventEmitter.emit('badge.awarded', { badge });

    return badge;
  }

  /**
   * Revoke a badge
   */
  async revokeBadge(prestataireId: string, badgeType: BadgeType): Promise<void> {
    await this.badgeRepository.update({ prestataireId, type: badgeType }, { isActive: false });

    this.logger.log(`Badge ${badgeType} revoked from prestataire ${prestataireId}`);
  }

  /**
   * Calculate and update all badges for a prestataire
   */
  async calculateBadges(prestataireId: string): Promise<Badge[]> {
    const prestataire = await this.prestataireRepository.findOne({
      where: { id: prestataireId },
    });

    if (!prestataire) {
      return [];
    }

    const earnedBadges: Badge[] = [];

    // Check each badge type
    const badgeChecks = [
      { type: BadgeType.TOP_RATED, check: () => this.checkTopRated(prestataire) },
      { type: BadgeType.RESPONSIVE, check: () => this.checkResponsive(prestataireId) },
      { type: BadgeType.RELIABLE, check: () => this.checkReliable(prestataireId) },
      { type: BadgeType.POPULAR, check: () => this.checkPopular(prestataireId) },
    ];

    for (const { type, check } of badgeChecks) {
      const earned = await check();
      if (earned) {
        const badge = await this.awardBadge(prestataireId, type);
        if (badge) earnedBadges.push(badge);
      } else {
        await this.revokeBadge(prestataireId, type);
      }
    }

    return earnedBadges;
  }

  /**
   * Check TOP_RATED badge criteria
   * Minimum 10 reviews with average rating >= 4.5
   */
  private checkTopRated(prestataire: Prestataire): boolean {
    return (
      prestataire.totalReviews >= BADGE_CRITERIA.TOP_RATED.minReviews &&
      parseFloat(prestataire.averageRating.toString()) >= BADGE_CRITERIA.TOP_RATED.minRating
    );
  }

  /**
   * Check RESPONSIVE badge criteria
   * 80%+ of messages answered within 2 hours
   */
  private async checkResponsive(prestataireId: string): Promise<boolean> {
    // This would require message response time tracking
    // For now, simplified check based on having active appointments
    const recentAppointments = await this.appointmentRepository.count({
      where: {
        prestataireId,
        status: AppointmentStatus.CONFIRMED,
      },
    });

    // Placeholder: award if has at least 5 appointments
    return recentAppointments >= BADGE_CRITERIA.RESPONSIVE.minResponseRate;
  }

  /**
   * Check RELIABLE badge criteria
   * Less than 5% cancellation rate
   */
  private async checkReliable(prestataireId: string): Promise<boolean> {
    const totalAppointments = await this.appointmentRepository.count({
      where: { prestataireId },
    });

    if (totalAppointments < 10) return false;

    const cancelledByPrestataire = await this.appointmentRepository.count({
      where: {
        prestataireId,
        status: AppointmentStatus.CANCELLED,
        cancelledBy: prestataireId,
      },
    });

    const cancellationRate = cancelledByPrestataire / totalAppointments;
    return cancellationRate <= BADGE_CRITERIA.RELIABLE.maxCancellationRate;
  }

  /**
   * Check POPULAR badge criteria
   * More than 50 appointments in last 30 days
   */
  private async checkPopular(prestataireId: string): Promise<boolean> {
    const thirtyDaysAgo = dayjs().subtract(30, 'day').toDate();

    const recentAppointments = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.prestataireId = :prestataireId', { prestataireId })
      .andWhere('appointment.status IN (:...statuses)', {
        statuses: [AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED],
      })
      .andWhere('appointment.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .getCount();

    return recentAppointments >= BADGE_CRITERIA.POPULAR.minAppointmentsPerMonth;
  }

  /**
   * Clean up expired badges (cron job)
   */
  async cleanupExpiredBadges(): Promise<number> {
    const result = await this.badgeRepository.update(
      { expiresAt: LessThan(new Date()), isActive: true },
      { isActive: false }
    );

    this.logger.log(`Expired ${result.affected || 0} badges`);

    return result.affected || 0;
  }

  /**
   * Recalculate all badges for all prestataires (cron job)
   */
  async recalculateAllBadges(): Promise<void> {
    const prestataires = await this.prestataireRepository.find({
      select: ['id'],
    });

    for (const prestataire of prestataires) {
      try {
        await this.calculateBadges(prestataire.id);
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        this.logger.error(`Failed to calculate badges for ${prestataire.id}: ${error.message}`);
      }
    }

    this.logger.log(`Recalculated badges for ${prestataires.length} prestataires`);
  }

  // ==========================================
  // EVENT HANDLERS
  // ==========================================

  @OnEvent('review.created')
  async handleReviewCreated(payload: { review: { prestataireId: string } }) {
    // Recalculate badges when a review is created
    await this.calculateBadges(payload.review.prestataireId);
  }

  @OnEvent('appointment.completed')
  async handleAppointmentCompleted(payload: { appointment: { prestataireId: string } }) {
    // Recalculate badges when an appointment is completed
    await this.calculateBadges(payload.appointment.prestataireId);
  }
}
