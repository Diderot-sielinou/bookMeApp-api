/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import dayjs from 'dayjs';

import { Appointment } from './entities/appointment.entity';
import { Slot } from '../slots/entities/slot.entity';
import { Service } from '../services/entities/service.entity';
import { Client } from '../users/entities/client.entity';
import { Prestataire } from '../users/entities/prestataire.entity';
import { BookAppointmentDto, CancelAppointmentDto, QueryAppointmentsDto } from './dto';
import { AppointmentStatus, SlotStatus, UserRole, PrestataireStatus } from '../common/constants';
import { normalizePagination, createPaginatedResult } from '../common/utils/pagination.util';
import { PaginatedResult } from '../common/interfaces';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Slot)
    private readonly slotRepository: Repository<Slot>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Prestataire)
    private readonly prestataireRepository: Repository<Prestataire>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Book an appointment with atomic transaction and pessimistic lock
   * Prevents double booking
   */
  async bookAppointment(dto: BookAppointmentDto, clientId: string): Promise<Appointment> {
    // Validate client exists
    const client = await this.clientRepository.findOne({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    // Use transaction with pessimistic lock to prevent race conditions
    const appointment = await this.dataSource.transaction(async (manager) => {
      // 1. Lock the slot FOR UPDATE - SANS relations
      const slot = await manager.findOne(Slot, {
        where: { id: dto.slotId, deletedAt: IsNull() },
        lock: { mode: 'pessimistic_write' },
      });

      if (!slot) {
        throw new NotFoundException('Slot not found');
      }

      // 2. Verify slot is still available
      if (slot.status !== SlotStatus.AVAILABLE) {
        throw new ConflictException('Slot is no longer available');
      }

      // 3. Charger le prestataire SÉPARÉMENT (sans lock)
      const prestataire = await manager.findOne(Prestataire, {
        where: { id: slot.prestataireId },
      });

      if (!prestataire || prestataire.status !== PrestataireStatus.ACTIVE) {
        throw new BadRequestException('Prestataire is not available');
      }

      // 4. Verify service exists and belongs to prestataire
      const service = await manager.findOne(Service, {
        where: { id: dto.serviceId, prestataireId: slot.prestataireId, isActive: true },
      });

      if (!service) {
        throw new NotFoundException('Service not found or not available');
      }

      // 5. Check minimum booking notice
      const slotDateTime = dayjs(slot.date)
        .hour(parseInt(slot.startTime.split(':')[0]))
        .minute(parseInt(slot.startTime.split(':')[1]));

      const hoursUntilSlot = slotDateTime.diff(dayjs(), 'hour');

      if (hoursUntilSlot < prestataire.minBookingNotice) {
        throw new BadRequestException(
          `Minimum ${prestataire.minBookingNotice}h booking notice required`
        );
      }

      // 6. Check if client already has an appointment at this time
      // ✅ CORRIGÉ: Utiliser une sous-requête au lieu d'une relation
      const existingAppointment = await manager
        .createQueryBuilder(Appointment, 'appointment')
        .innerJoin('appointment.slot', 'slot')
        .where('appointment.clientId = :clientId', { clientId })
        .andWhere('appointment.status = :status', { status: AppointmentStatus.CONFIRMED })
        .andWhere('slot.date = :date', { date: slot.date })
        .andWhere('slot.startTime = :startTime', { startTime: slot.startTime })
        .getOne();

      if (existingAppointment) {
        throw new ConflictException('You already have an appointment at this time');
      }

      // 7. Create appointment
      const newAppointment = manager.create(Appointment, {
        clientId,
        prestataireId: slot.prestataireId,
        slotId: slot.id,
        serviceId: dto.serviceId,
        status: AppointmentStatus.CONFIRMED,
        clientNote: dto.clientNote || null,
        priceAtBooking: service.price,
      });

      await manager.save(newAppointment);

      // 8. Update slot status to RESERVED
      slot.status = SlotStatus.RESERVED;
      await manager.save(slot);

      // 9. Increment prestataire appointment count
      await manager.increment(Prestataire, { id: slot.prestataireId }, 'totalAppointments', 1);

      this.logger.log(`Appointment booked: ${newAppointment.id} by client ${clientId}`);

      return newAppointment;
    });

    // 10. Load full appointment with relations (APRÈS la transaction)
    const fullAppointment = await this.appointmentRepository.findOne({
      where: { id: appointment.id },
      relations: ['client', 'client.user', 'prestataire', 'prestataire.user', 'slot', 'service'],
    });

    // 11. Emit events (async, after transaction)
    this.eventEmitter.emit('appointment.created', {
      appointment: fullAppointment,
    });

    return fullAppointment!;
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(
    appointmentId: string,
    userId: string,
    userRole: UserRole,
    dto: CancelAppointmentDto
  ): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
      relations: ['client', 'prestataire', 'slot', 'service'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Verify user is participant
    if (appointment.clientId !== userId && appointment.prestataireId !== userId) {
      throw new ForbiddenException('You are not authorized to cancel this appointment');
    }

    // Verify appointment is confirmed
    if (appointment.status !== AppointmentStatus.CONFIRMED) {
      throw new BadRequestException('Only confirmed appointments can be cancelled');
    }

    // Check cancellation window (only for clients)
    if (userRole === UserRole.CLIENT) {
      const slotDateTime = dayjs(appointment.slot.date)
        .hour(parseInt(appointment.slot.startTime.split(':')[0]))
        .minute(parseInt(appointment.slot.startTime.split(':')[1]));

      const hoursUntilSlot = slotDateTime.diff(dayjs(), 'hour');

      if (hoursUntilSlot < appointment.prestataire.minCancellationHours) {
        throw new BadRequestException(
          `Cancellation must be at least ${appointment.prestataire.minCancellationHours}h before the appointment`
        );
      }
    }

    // Update appointment within transaction
    await this.dataSource.transaction(async (manager) => {
      // Update appointment status
      appointment.status = AppointmentStatus.CANCELLED;
      appointment.cancelledBy = userId;
      appointment.cancelledAt = new Date();
      appointment.cancellationReason = dto.reason || null;

      await manager.save(appointment);

      // Release the slot
      await manager.update(
        Slot,
        { id: appointment.slotId },
        {
          status: SlotStatus.AVAILABLE,
        }
      );
    });

    this.logger.log(`Appointment cancelled: ${appointmentId} by ${userRole} ${userId}`);

    // Emit cancellation event
    this.eventEmitter.emit('appointment.cancelled', {
      appointment,
      cancelledBy: userId,
      cancelledByRole: userRole,
    });

    return appointment;
  }

  /**
   * Mark appointment as completed
   */
  async completeAppointment(appointmentId: string, prestataireId: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId, prestataireId },
      relations: ['slot'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status !== AppointmentStatus.CONFIRMED) {
      throw new BadRequestException('Only confirmed appointments can be marked as completed');
    }

    // Verify appointment time has passed
    const slotDateTime = dayjs(appointment.slot.date)
      .hour(parseInt(appointment.slot.endTime.split(':')[0]))
      .minute(parseInt(appointment.slot.endTime.split(':')[1]));

    if (dayjs().isBefore(slotDateTime)) {
      throw new BadRequestException('Cannot complete appointment before its end time');
    }

    appointment.status = AppointmentStatus.COMPLETED;
    appointment.completedAt = new Date();

    await this.appointmentRepository.save(appointment);

    this.logger.log(`Appointment completed: ${appointmentId}`);

    // Emit completion event (triggers review request after 2h)
    this.eventEmitter.emit('appointment.completed', { appointment });

    return appointment;
  }

  /**
   * Find appointment by ID
   */
  async findById(appointmentId: string, userId: string, userRole: UserRole): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
      relations: ['client', 'prestataire', 'slot', 'service', 'review'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Verify access rights
    if (
      userRole !== UserRole.ADMIN &&
      appointment.clientId !== userId &&
      appointment.prestataireId !== userId
    ) {
      throw new ForbiddenException('You are not authorized to view this appointment');
    }

    return appointment;
  }

  /**
   * Find appointments for a user
   */
  async findByUser(
    userId: string,
    userRole: UserRole,
    dto: QueryAppointmentsDto
  ): Promise<PaginatedResult<Appointment>> {
    const { page, limit, skip } = normalizePagination(dto.page, dto.limit);

    const queryBuilder = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.client', 'client')
      .leftJoinAndSelect('appointment.prestataire', 'prestataire')
      .leftJoinAndSelect('appointment.slot', 'slot')
      .leftJoinAndSelect('appointment.service', 'service');

    // Filter by user
    if (userRole === UserRole.CLIENT) {
      queryBuilder.andWhere('appointment.clientId = :userId', { userId });
    } else if (userRole === UserRole.PRESTATAIRE) {
      queryBuilder.andWhere('appointment.prestataireId = :userId', { userId });
    }

    // Filter by status
    if (dto.status) {
      // On s'assure que c'est un tableau
      const statuses = Array.isArray(dto.status) ? dto.status : [dto.status];

      if (statuses.length > 0) {
        // Note les trois points avant 'statuses' : c'est CRUCIAL pour le SQL "IN"
        queryBuilder.andWhere('appointment.status IN (:...statuses)', { statuses });
      }
    }

    // Filter by view (upcoming, past, all)
    const now = new Date();
    if (dto.view === 'upcoming') {
      queryBuilder.andWhere('slot.date >= :now', { now });
      queryBuilder.andWhere('appointment.status = :confirmedStatus', {
        confirmedStatus: AppointmentStatus.CONFIRMED,
      });
    } else if (dto.view === 'past') {
      queryBuilder.andWhere('(slot.date < :now OR appointment.status IN (:...pastStatuses))', {
        now,
        pastStatuses: [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED],
      });
    }

    // Filter by date range
    if (dto.startDate) {
      queryBuilder.andWhere('slot.date >= :startDate', { startDate: dto.startDate });
    }
    if (dto.endDate) {
      queryBuilder.andWhere('slot.date <= :endDate', { endDate: dto.endDate });
    }

    // Filter by service
    if (dto.serviceId) {
      queryBuilder.andWhere('appointment.serviceId = :serviceId', {
        serviceId: dto.serviceId,
      });
    }

    // Order by slot date
    queryBuilder.orderBy('slot.date', 'ASC').addOrderBy('slot.startTime', 'ASC');

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    const appointments = await queryBuilder.getMany();

    return createPaginatedResult(appointments, total, page, limit);
  }

  /**
   * Find today's appointments for a prestataire
   */
  async findTodayForPrestataire(prestataireId: string): Promise<Appointment[]> {
    const today = dayjs().format('YYYY-MM-DD');

    return this.appointmentRepository.find({
      where: {
        prestataireId,
        status: AppointmentStatus.CONFIRMED,
        slot: { date: new Date(today) },
      },
      relations: ['client', 'slot', 'service'],
      order: { slot: { startTime: 'ASC' } },
    });
  }

  /**
   * Find appointments needing reminders (for cron job)
   */
  async findAppointmentsForReminder(
    hoursAhead: number,
    reminderField: 'reminder24hSent' | 'reminder1hSent'
  ): Promise<Appointment[]> {
    const targetTime = dayjs().add(hoursAhead, 'hour');
    const windowStart = targetTime.subtract(30, 'minute');
    const windowEnd = targetTime.add(30, 'minute');

    return this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.client', 'client')
      .leftJoinAndSelect('appointment.prestataire', 'prestataire')
      .leftJoinAndSelect('appointment.slot', 'slot')
      .leftJoinAndSelect('appointment.service', 'service')
      .where('appointment.status = :status', { status: AppointmentStatus.CONFIRMED })
      .andWhere(`appointment.${reminderField} = :sent`, { sent: false })
      .andWhere(
        `CONCAT(slot.date, ' ', slot.startTime)::timestamp BETWEEN :windowStart AND :windowEnd`,
        {
          windowStart: windowStart.toDate(),
          windowEnd: windowEnd.toDate(),
        }
      )
      .getMany();
  }

  /**
   * Find completed appointments needing review requests
   */
  async findAppointmentsForReviewRequest(): Promise<Appointment[]> {
    const targetTime = dayjs().subtract(2, 'hour');
    const windowStart = targetTime.subtract(30, 'minute');
    const windowEnd = targetTime.add(30, 'minute');

    return this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.client', 'client')
      .leftJoinAndSelect('appointment.prestataire', 'prestataire')
      .leftJoinAndSelect('appointment.slot', 'slot')
      .leftJoinAndSelect('appointment.service', 'service')
      .leftJoinAndSelect('appointment.review', 'review')
      .where('appointment.status = :status', { status: AppointmentStatus.COMPLETED })
      .andWhere('appointment.reviewRequestSent = :sent', { sent: false })
      .andWhere('review.id IS NULL')
      .andWhere('appointment.completedAt BETWEEN :windowStart AND :windowEnd', {
        windowStart: windowStart.toDate(),
        windowEnd: windowEnd.toDate(),
      })
      .getMany();
  }

  /**
   * Mark reminder as sent
   */
  async markReminderSent(
    appointmentId: string,
    reminderField: 'reminder24hSent' | 'reminder1hSent' | 'reviewRequestSent'
  ): Promise<void> {
    await this.appointmentRepository.update(appointmentId, {
      [reminderField]: true,
    });
  }

  /**
   * Auto-complete old appointments (cron job)
   */
  async autoCompleteOldAppointments(): Promise<number> {
    const threshold = dayjs().subtract(24, 'hour').toDate();

    // Use raw query with proper PostgreSQL UPDATE ... FROM syntax
    const result = await this.appointmentRepository.query(
      `UPDATE appointments 
     SET status = $1, 
         completed_at = $2, 
         updated_at = CURRENT_TIMESTAMP
     FROM slots s
     WHERE appointments.slot_id = s.id
       AND appointments.status = $3
       AND CONCAT(s.date, ' ', s.end_time)::timestamp < $4`,
      [AppointmentStatus.COMPLETED, new Date(), AppointmentStatus.CONFIRMED, threshold]
    );

    // PostgreSQL returns affected rows in result[1] for UPDATE queries
    return typeof result === 'object' && Array.isArray(result) ? result[1] || 0 : 0;
  }
}
