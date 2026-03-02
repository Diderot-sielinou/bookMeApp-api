/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { AppointmentsService } from '../appointments/appointments.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BadgesService } from '../badges/badges.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly notificationsService: NotificationsService,
    private readonly badgesService: BadgesService,
    private readonly emailService: EmailService
  ) {}

  /**
   * Send 24h reminders every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async send24hReminders() {
    this.logger.log('Running 24h reminder job');

    try {
      const appointments = await this.appointmentsService.findAppointmentsForReminder(
        24,
        'reminder24hSent'
      );

      for (const appointment of appointments) {
        try {
          // Create notification
          await this.notificationsService.notifyAppointmentReminder(
            appointment as Parameters<
              typeof this.notificationsService.notifyAppointmentReminder
            >[0],
            24
          );

          // Mark as sent
          await this.appointmentsService.markReminderSent(appointment.id, 'reminder24hSent');

          this.logger.log(`24h reminder sent for appointment ${appointment.id}`);
        } catch (error) {
          this.logger.error(`Failed to send 24h reminder for ${appointment.id}: ${error.message}`);
        }
      }

      this.logger.log(`Sent ${appointments.length} 24h reminders`);
    } catch (error) {
      this.logger.error(`24h reminder job failed: ${error.message}`);
    }
  }

  /**
   * Send 1h reminders every 15 minutes
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async send1hReminders() {
    this.logger.log('Running 1h reminder job');

    try {
      const appointments = await this.appointmentsService.findAppointmentsForReminder(
        1,
        'reminder1hSent'
      );

      for (const appointment of appointments) {
        try {
          // Create notification
          await this.notificationsService.notifyAppointmentReminder(
            appointment as Parameters<
              typeof this.notificationsService.notifyAppointmentReminder
            >[0],
            1
          );

          // Mark as sent
          await this.appointmentsService.markReminderSent(appointment.id, 'reminder1hSent');

          this.logger.log(`1h reminder sent for appointment ${appointment.id}`);
        } catch (error) {
          this.logger.error(`Failed to send 1h reminder for ${appointment.id}: ${error.message}`);
        }
      }

      this.logger.log(`Sent ${appointments.length} 1h reminders`);
    } catch (error) {
      this.logger.error(`1h reminder job failed: ${error.message}`);
    }
  }

  /**
   * Send review requests every hour (2h after completion)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async sendReviewRequests() {
    this.logger.log('Running review request job');

    try {
      const appointments = await this.appointmentsService.findAppointmentsForReviewRequest();

      for (const appointment of appointments) {
        try {
          // Create notification
          await this.notificationsService.notifyReviewRequest(
            appointment as Parameters<typeof this.notificationsService.notifyReviewRequest>[0]
          );

          // Mark as sent
          await this.appointmentsService.markReminderSent(appointment.id, 'reviewRequestSent');

          this.logger.log(`Review request sent for appointment ${appointment.id}`);
        } catch (error) {
          this.logger.error(
            `Failed to send review request for ${appointment.id}: ${error.message}`
          );
        }
      }

      this.logger.log(`Sent ${appointments.length} review requests`);
    } catch (error) {
      this.logger.error(`Review request job failed: ${error.message}`);
    }
  }

  /**
   * Auto-complete old appointments every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async autoCompleteAppointments() {
    this.logger.log('Running auto-complete appointments job');

    try {
      const count = await this.appointmentsService.autoCompleteOldAppointments();
      this.logger.log(`Auto-completed ${count} appointments`);
    } catch (error) {
      this.logger.error(`Auto-complete job failed: ${error.message}`);
    }
  }

  /**
   * Recalculate badges daily at 3 AM
   */
  @Cron('0 3 * * *')
  async recalculateBadges() {
    this.logger.log('Running badge recalculation job');

    try {
      await this.badgesService.recalculateAllBadges();
      this.logger.log('Badge recalculation completed');
    } catch (error) {
      this.logger.error(`Badge recalculation failed: ${error.message}`);
    }
  }

  /**
   * Cleanup expired badges daily at 4 AM
   */
  @Cron('0 4 * * *')
  async cleanupExpiredBadges() {
    this.logger.log('Running expired badge cleanup job');

    try {
      const count = await this.badgesService.cleanupExpiredBadges();
      this.logger.log(`Cleaned up ${count} expired badges`);
    } catch (error) {
      this.logger.error(`Badge cleanup failed: ${error.message}`);
    }
  }

  /**
   * Cleanup old notifications weekly on Sunday at 5 AM
   */
  @Cron('0 5 * * 0')
  async cleanupOldNotifications() {
    this.logger.log('Running notification cleanup job');

    try {
      const count = await this.notificationsService.deleteOldNotifications(30);
      this.logger.log(`Cleaned up ${count} old notifications`);
    } catch (error) {
      this.logger.error(`Notification cleanup failed: ${error.message}`);
    }
  }
}
