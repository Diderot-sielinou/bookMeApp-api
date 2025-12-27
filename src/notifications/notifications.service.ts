import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Redis from 'ioredis';

import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Notification } from './entities/notification.entity';
import { NotificationType, UserRole } from '../common/constants';
import { normalizePagination, createPaginatedResult } from '../common/utils/pagination.util';
import { PaginatedResult } from '../common/interfaces';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Create a notification
   */
  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    relatedId?: string;
    data?: Record<string, unknown>;
  }): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      relatedId: data.relatedId,
      data: data.data,
    });

    await this.notificationRepository.save(notification);

    this.logger.log(`Notification created: ${notification.id} for user ${data.userId}`);

    return notification;
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(
    userId: string,
    options?: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
      type?: NotificationType;
    }
  ): Promise<PaginatedResult<Notification>> {
    const { page, limit, skip } = normalizePagination(options?.page, options?.limit);

    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC');

    if (options?.unreadOnly) {
      queryBuilder.andWhere('notification.read = :read', { read: false });
    }

    if (options?.type) {
      queryBuilder.andWhere('notification.type = :type', { type: options.type });
    }

    const total = await queryBuilder.getCount();
    queryBuilder.skip(skip).take(limit);

    const notifications = await queryBuilder.getMany();

    return createPaginatedResult(notifications, total, page, limit);
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, read: false },
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const result = await this.notificationRepository.update(
      { id: notificationId, userId },
      { read: true, readAt: new Date() }
    );

    if (result.affected === 0) {
      throw new NotFoundException('Notification not found');
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<{ marked: number }> {
    const result = await this.notificationRepository.update(
      { userId, read: false },
      { read: true, readAt: new Date() }
    );

    return { marked: result.affected || 0 };
  }

  /**
   * Mark email as sent
   */
  async markEmailSent(notificationId: string): Promise<void> {
    await this.notificationRepository.update(notificationId, {
      emailSent: true,
    });
  }

  /**
   * Delete old notifications (cleanup)
   */
  async deleteOldNotifications(daysOld: number = 30): Promise<number> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - daysOld);

    const result = await this.notificationRepository
      .createQueryBuilder()
      .delete()
      .where('read = :read', { read: true })
      .andWhere('createdAt < :threshold', { threshold })
      .execute();

    this.logger.log(`Deleted ${result.affected || 0} old notifications`);

    return result.affected || 0;
  }

  async deleteNotification(id: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.notificationRepository.delete(id);
  }

  // ==========================================
  // NOTIFICATION CREATION HELPERS
  // ==========================================

  async notifyAppointmentBooked(appointment: {
    id: string;
    prestataireId: string;
    clientId: string;
    service: { name: string };
    slot: { date: Date; startTime: string };
  }): Promise<void> {
    // Notify prestataire
    await this.createNotification({
      userId: appointment.prestataireId,
      type: NotificationType.NEW_BOOKING,
      title: 'Nouvelle réservation',
      message: `Nouveau rendez-vous pour ${appointment.service.name}`,
      relatedId: appointment.id,
      data: {
        appointmentId: appointment.id,
        date: appointment.slot.date,
        time: appointment.slot.startTime,
      },
    });
  }

  async notifyAppointmentCancelled(
    appointment: {
      id: string;
      prestataireId: string;
      clientId: string;
      service: { name: string };
      slot: { date: Date; startTime: string };
    },
    cancelledByRole: string
  ): Promise<void> {
    // Notify the other party
    const recipientId =
      cancelledByRole === 'client' ? appointment.prestataireId : appointment.clientId;

    await this.createNotification({
      userId: recipientId,
      type: NotificationType.CANCELLATION,
      title: 'Rendez-vous annulé',
      message: `Le rendez-vous pour ${appointment.service.name} a été annulé`,
      relatedId: appointment.id,
      data: {
        appointmentId: appointment.id,
        date: appointment.slot.date,
        time: appointment.slot.startTime,
        cancelledBy: cancelledByRole,
      },
    });
  }

  async notifyAppointmentReminder(
    appointment: {
      id: string;
      clientId: string;
      service: { name: string };
      slot: { date: Date; startTime: string };
      prestataire: { businessName: string };
    },
    hoursAhead: number
  ): Promise<void> {
    await this.createNotification({
      userId: appointment.clientId,
      type: NotificationType.REMINDER,
      title: `Rappel: RDV dans ${hoursAhead}h`,
      message: `N'oubliez pas votre rendez-vous chez ${appointment.prestataire.businessName}`,
      relatedId: appointment.id,
      data: {
        appointmentId: appointment.id,
        serviceName: appointment.service.name,
        date: appointment.slot.date,
        time: appointment.slot.startTime,
      },
    });
  }

  async notifyNewReview(review: {
    id: string;
    prestataireId: string;
    rating: number;
    client: { firstName: string };
  }): Promise<void> {
    await this.createNotification({
      userId: review.prestataireId,
      type: NotificationType.NEW_REVIEW,
      title: 'Nouvel avis',
      message: `${review.client.firstName} vous a laissé un avis ${review.rating}/5`,
      relatedId: review.id,
      data: {
        reviewId: review.id,
        rating: review.rating,
      },
    });
  }

  async notifyReviewRequest(appointment: {
    id: string;
    clientId: string;
    prestataire: { businessName: string };
  }): Promise<void> {
    await this.createNotification({
      userId: appointment.clientId,
      type: NotificationType.SYSTEM,
      title: 'Donnez votre avis',
      message: `Comment s'est passé votre rendez-vous chez ${appointment.prestataire.businessName} ?`,
      relatedId: appointment.id,
      data: {
        appointmentId: appointment.id,
      },
    });
  }

  async notifyNewMessage(data: {
    recipientId: string;
    senderName: string;
    appointmentId: string;
    preview: string;
  }): Promise<void> {
    await this.createNotification({
      userId: data.recipientId,
      type: NotificationType.NEW_MESSAGE,
      title: `Nouveau message de ${data.senderName}`,
      message: data.preview.substring(0, 100),
      relatedId: data.appointmentId,
      data: {
        appointmentId: data.appointmentId,
      },
    });
  }

  async notifyBadgeAwarded(badge: { prestataireId: string; type: string }): Promise<void> {
    const badgeNames: Record<string, string> = {
      TOP_RATED: 'Top Rated',
      RESPONSIVE: 'Réactif',
      RELIABLE: 'Fiable',
      POPULAR: 'Populaire',
    };

    await this.createNotification({
      userId: badge.prestataireId,
      type: NotificationType.BADGE_EARNED,
      title: 'Nouveau badge obtenu !',
      message: `Félicitations ! Vous avez obtenu le badge "${badgeNames[badge.type] || badge.type}"`,
      data: {
        badgeType: badge.type,
      },
    });
  }

  // ✅ new  handler
  @OnEvent('appointment.created')
  async handleAppointmentCreated(payload: {
    appointment: {
      id: string;
      prestataireId: string;
      client: { firstName: string };
      service: { name: string };
      slot: { date: Date; startTime: string };
    };
  }) {
    const { appointment } = payload;

    try {
      // ✅ AJOUTER
      this.logger.log(`[Event] Creating notification for appointment: ${appointment.id}`);

      const notification = await this.createNotification({
        userId: appointment.prestataireId,
        type: NotificationType.NEW_BOOKING,
        title: 'Nouvelle réservation',
        message: `${appointment.client.firstName} a réservé ${appointment.service.name}`,
        relatedId: appointment.id,
        data: {
          appointmentId: appointment.id,
          date: appointment.slot.date,
          time: appointment.slot.startTime,
        },
      });

      this.eventEmitter.emit('notification.created', { notification });
    } catch (error) {
      // ✅ AJOUTER
      this.logger.error(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `Failed to create booking notification: ${error.message}`
      );
    }
  }

  // ✅ AJOUTER ce handler
  @OnEvent('appointment.cancelled')
  async handleAppointmentCancelled(payload: {
    appointment: {
      id: string;
      prestataireId: string;
      clientId: string;
      service: { name: string };
      slot: { date: Date; startTime: string };
    };
    cancelledBy: string;
    cancelledByRole: UserRole;
  }) {
    const { appointment, cancelledByRole } = payload;

    try {
      const recipientId =
        cancelledByRole === UserRole.CLIENT ? appointment.prestataireId : appointment.clientId;

      this.logger.log(`[Event] Creating cancellation notification for: ${recipientId}`);

      const notification = await this.createNotification({
        userId: recipientId,
        type: NotificationType.CANCELLATION,
        title: 'Rendez-vous annulé',
        message: `Le rendez-vous pour ${appointment.service.name} a été annulé`,
        relatedId: appointment.id,
        data: {
          appointmentId: appointment.id,
          cancelledBy: cancelledByRole,
        },
      });

      this.eventEmitter.emit('notification.created', { notification });
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Failed to create cancellation notification: ${error.message}`);
    }
  }
}
