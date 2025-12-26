/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import dayjs from 'dayjs';

import { AuditLog } from './entities/audit-log.entity';
import { User } from '../users/entities/user.entity';
import { Prestataire } from '../users/entities/prestataire.entity';
import { Client } from '../users/entities/client.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Review } from '../reviews/entities/review.entity';
import { UsersService } from '../users/users.service';
import { PrestataireStatus, UserRole, AppointmentStatus } from '../common/constants';
import { normalizePagination, createPaginatedResult } from '../common/utils/pagination.util';
import { PaginatedResult } from '../common/interfaces';

export interface AdminStats {
  totalUsers: number;
  totalClients: number;
  totalPrestataires: number;
  pendingPrestataires: number;
  totalAppointments: number;
  appointmentsThisMonth: number;
  totalRevenue: number;
  revenueThisMonth: number;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Prestataire)
    private readonly prestataireRepository: Repository<Prestataire>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    private readonly usersService: UsersService
  ) {}

  // ==========================================
  // STATISTICS
  // ==========================================

  async getStats(): Promise<AdminStats> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const startOfMonth = dayjs().startOf('month').toDate();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const endOfMonth = dayjs().endOf('month').toDate();

    const [
      totalUsers,
      totalClients,
      totalPrestataires,
      pendingPrestataires,
      totalAppointments,
      appointmentsThisMonth,
      revenueResult,
      revenueThisMonthResult,
    ] = await Promise.all([
      this.userRepository.count(),
      this.clientRepository.count(),
      this.prestataireRepository.count(),
      this.prestataireRepository.count({
        where: { status: PrestataireStatus.PENDING },
      }),
      this.appointmentRepository.count(),
      this.appointmentRepository.count({
        where: { createdAt: Between(startOfMonth, endOfMonth) },
      }),
      this.appointmentRepository
        .createQueryBuilder('a')
        .select('SUM(a.priceAtBooking)', 'total')
        .where('a.status = :status', { status: AppointmentStatus.COMPLETED })
        .getRawOne(),
      this.appointmentRepository
        .createQueryBuilder('a')
        .select('SUM(a.priceAtBooking)', 'total')
        .where('a.status = :status', { status: AppointmentStatus.COMPLETED })
        .andWhere('a.completedAt BETWEEN :start AND :end', {
          start: startOfMonth,
          end: endOfMonth,
        })
        .getRawOne(),
    ]);

    return {
      totalUsers,
      totalClients,
      totalPrestataires,
      pendingPrestataires,
      totalAppointments,
      appointmentsThisMonth,
      totalRevenue: parseFloat(revenueResult?.total || '0'),
      revenueThisMonth: parseFloat(revenueThisMonthResult?.total || '0'),
    };
  }

  // ==========================================
  // USER MANAGEMENT
  // ==========================================

  async getUsers(options?: {
    role?: UserRole;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResult<User>> {
    const { page, limit, skip } = normalizePagination(options?.page, options?.limit);

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .orderBy('user.createdAt', 'DESC');

    if (options?.role) {
      queryBuilder.andWhere('user.role = :role', { role: options.role });
    }

    if (options?.search) {
      queryBuilder.andWhere('user.email ILIKE :search', {
        search: `%${options.search}%`,
      });
    }

    const total = await queryBuilder.getCount();
    queryBuilder.skip(skip).take(limit);

    const users = await queryBuilder.getMany();

    return createPaginatedResult(users, total, page, limit);
  }

  async suspendUser(userId: string, adminId: string, reason?: string): Promise<void> {
    await this.usersService.suspendUser(userId, reason);
    await this.createAuditLog(adminId, 'USER_SUSPENDED', 'User', userId, {
      reason,
    });
  }

  async reactivateUser(userId: string, adminId: string): Promise<void> {
    await this.usersService.reactivateUser(userId);
    await this.createAuditLog(adminId, 'USER_REACTIVATED', 'User', userId);
  }

  // ==========================================
  // PRESTATAIRE MANAGEMENT
  // ==========================================

  async getPendingPrestataires(options?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<Prestataire>> {
    const { page, limit, skip } = normalizePagination(options?.page, options?.limit);

    const queryBuilder = this.prestataireRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.user', 'user')
      .where('p.status = :status', { status: PrestataireStatus.PENDING })
      .orderBy('user.createdAt', 'ASC');

    const total = await queryBuilder.getCount();
    queryBuilder.skip(skip).take(limit);

    const prestataires = await queryBuilder.getMany();

    return createPaginatedResult(prestataires, total, page, limit);
  }

  async approvePrestataire(prestataireId: string, adminId: string): Promise<Prestataire> {
    const prestataire = await this.usersService.approvePrestataire(prestataireId);
    await this.createAuditLog(adminId, 'PRESTATAIRE_APPROVED', 'Prestataire', prestataireId);
    return prestataire;
  }

  async rejectPrestataire(prestataireId: string, adminId: string, reason: string): Promise<void> {
    await this.usersService.rejectPrestataire(prestataireId, reason);
    await this.createAuditLog(adminId, 'PRESTATAIRE_REJECTED', 'Prestataire', prestataireId, {
      reason,
    });
  }

  // ==========================================
  // REVIEW MODERATION
  // ==========================================

  async getFlaggedReviews(options?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<Review>> {
    const { page, limit, skip } = normalizePagination(options?.page, options?.limit);

    const queryBuilder = this.reviewRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.client', 'client')
      .leftJoinAndSelect('r.prestataire', 'prestataire')
      .where('r.flagged = :flagged', { flagged: true })
      .orderBy('r.updatedAt', 'DESC');

    const total = await queryBuilder.getCount();
    queryBuilder.skip(skip).take(limit);

    const reviews = await queryBuilder.getMany();

    return createPaginatedResult(reviews, total, page, limit);
  }

  async hideReview(reviewId: string, adminId: string): Promise<void> {
    await this.reviewRepository.update(reviewId, { isVisible: false });
    await this.createAuditLog(adminId, 'REVIEW_HIDDEN', 'Review', reviewId);
  }

  async unflagReview(reviewId: string, adminId: string): Promise<void> {
    await this.reviewRepository.update(reviewId, {
      flagged: false,
      flagReason: null,
      flaggedBy: null,
    });
    await this.createAuditLog(adminId, 'REVIEW_UNFLAGGED', 'Review', reviewId);
  }

  // ==========================================
  // AUDIT LOG
  // ==========================================

  async createAuditLog(
    userId: string,
    action: string,
    entityType: string,
    entityId?: string,
    details?: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      userId,
      action,
      entityType,
      entityId,
      details,
      ipAddress,
      userAgent,
    });

    await this.auditLogRepository.save(auditLog);

    this.logger.log(`Audit: ${action} by ${userId} on ${entityType}:${entityId}`);

    return auditLog;
  }

  async getAuditLogs(options?: {
    userId?: string;
    action?: string;
    entityType?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<AuditLog>> {
    const { page, limit, skip } = normalizePagination(options?.page, options?.limit);

    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .orderBy('log.createdAt', 'DESC');

    if (options?.userId) {
      queryBuilder.andWhere('log.userId = :userId', { userId: options.userId });
    }

    if (options?.action) {
      queryBuilder.andWhere('log.action = :action', { action: options.action });
    }

    if (options?.entityType) {
      queryBuilder.andWhere('log.entityType = :entityType', {
        entityType: options.entityType,
      });
    }

    if (options?.startDate) {
      queryBuilder.andWhere('log.createdAt >= :startDate', {
        startDate: options.startDate,
      });
    }

    if (options?.endDate) {
      queryBuilder.andWhere('log.createdAt <= :endDate', {
        endDate: options.endDate,
      });
    }

    const total = await queryBuilder.getCount();
    queryBuilder.skip(skip).take(limit);

    const logs = await queryBuilder.getMany();

    return createPaginatedResult(logs, total, page, limit);
  }
}
