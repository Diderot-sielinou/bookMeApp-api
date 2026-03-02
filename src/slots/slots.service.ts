/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  // ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm';
import dayjs from 'dayjs';

import { Slot } from './entities/slot.entity';
import { Service } from '../services/entities/service.entity';
import { Prestataire } from '../users/entities/prestataire.entity';
import {
  CreateSlotDto,
  CreateRecurringSlotsDto,
  UpdateSlotDto,
  BlockSlotsDto,
  QuerySlotsDto,
  RecurringSlotsResultDto,
} from './dto';
import { SlotStatus, DayOfWeek } from '../common/constants';
import { normalizePagination, createPaginatedResult } from '../common/utils/pagination.util';
import {
  hasTimeOverlap,
  parseTimeToMinutes,
  minutesToTimeString,
  // getDayOfWeek,
  generateDateRange,
} from '../common/utils/date.util';
import { PaginatedResult } from '../common/interfaces';

@Injectable()
export class SlotsService {
  private readonly logger = new Logger(SlotsService.name);
  private readonly MAX_RECURRING_SLOTS = 100;

  constructor(
    @InjectRepository(Slot)
    private readonly slotRepository: Repository<Slot>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(Prestataire)
    private readonly prestataireRepository: Repository<Prestataire>
  ) {}

  /**
   * Create a single slot
   */
  async createSlot(prestataireId: string, dto: CreateSlotDto): Promise<Slot> {
    // Validate date is in the future
    const slotDate = dayjs(dto.date);
    if (slotDate.isBefore(dayjs(), 'day')) {
      throw new BadRequestException('Cannot create slot in the past');
    }

    // Validate time format
    if (!this.isValidTime(dto.startTime) || !this.isValidTime(dto.endTime)) {
      throw new BadRequestException('Invalid time format. Use HH:mm');
    }

    // Validate end time is after start time
    if (parseTimeToMinutes(dto.endTime) <= parseTimeToMinutes(dto.startTime)) {
      throw new BadRequestException('End time must be after start time');
    }

    // Validate service if provided
    if (dto.serviceId) {
      const service = await this.serviceRepository.findOne({
        where: { id: dto.serviceId, prestataireId, isActive: true },
      });
      if (!service) {
        throw new NotFoundException('Service not found');
      }
    }

    // Check for overlapping slots
    const hasOverlap = await this.checkOverlap(
      prestataireId,
      new Date(dto.date),
      dto.startTime,
      dto.endTime
    );

    if (hasOverlap) {
      throw new ConflictException('Slot overlaps with existing slot');
    }

    const slot = this.slotRepository.create({
      prestataireId,
      date: new Date(dto.date),
      startTime: dto.startTime,
      endTime: dto.endTime,
      serviceId: dto.serviceId || null,
      notes: dto.notes || null,
      status: SlotStatus.AVAILABLE,
    });

    await this.slotRepository.save(slot);

    this.logger.log(`Slot created: ${slot.id} for prestataire ${prestataireId}`);

    return slot;
  }

  /**
   * Create recurring slots
   */
  async createRecurringSlots(
    prestataireId: string,
    dto: CreateRecurringSlotsDto
  ): Promise<RecurringSlotsResultDto> {
    // Validate dates
    const startDate = dayjs(dto.startDate);
    const endDate = dayjs(dto.endDate);

    if (startDate.isBefore(dayjs(), 'day')) {
      throw new BadRequestException('Start date cannot be in the past');
    }

    if (endDate.isBefore(startDate)) {
      throw new BadRequestException('End date must be after start date');
    }

    // Validate time format
    if (!this.isValidTime(dto.startTime) || !this.isValidTime(dto.endTime)) {
      throw new BadRequestException('Invalid time format. Use HH:mm');
    }

    // Validate slot duration
    if (dto.slotDuration < 15 || dto.slotDuration > 480) {
      throw new BadRequestException('Slot duration must be between 15 and 480 minutes');
    }

    // Validate service if provided
    if (dto.serviceId) {
      const service = await this.serviceRepository.findOne({
        where: { id: dto.serviceId, prestataireId, isActive: true },
      });
      if (!service) {
        throw new NotFoundException('Service not found');
      }
    }

    // Get prestataire for pause duration
    const prestataire = await this.prestataireRepository.findOne({
      where: { id: prestataireId },
    });

    const pauseDuration = dto.pauseDuration ?? prestataire?.pauseDuration ?? 0;

    // Generate slots
    const slots: Slot[] = [];
    const skippedDates: string[] = [];

    const dayOfWeekMap: Record<DayOfWeek, number> = {
      [DayOfWeek.SUNDAY]: 0,
      [DayOfWeek.MONDAY]: 1,
      [DayOfWeek.TUESDAY]: 2,
      [DayOfWeek.WEDNESDAY]: 3,
      [DayOfWeek.THURSDAY]: 4,
      [DayOfWeek.FRIDAY]: 5,
      [DayOfWeek.SATURDAY]: 6,
    };

    const targetDays = dto.daysOfWeek.map((d) => dayOfWeekMap[d]);

    for (const date of generateDateRange(startDate.toDate(), endDate.toDate())) {
      const currentDay = dayjs(date);

      // Check if this is a target day
      if (!targetDays.includes(currentDay.day())) {
        continue;
      }

      // Skip if date is in the past
      if (currentDay.isBefore(dayjs(), 'day')) {
        continue;
      }

      // Generate time slots for this day
      const daySlots = await this.generateDaySlots(
        prestataireId,
        date,
        dto.startTime,
        dto.endTime,
        dto.slotDuration,
        pauseDuration,
        dto.serviceId
      );

      if (daySlots.length === 0) {
        skippedDates.push(currentDay.format('YYYY-MM-DD'));
      } else {
        slots.push(...daySlots);
      }

      // Check max slots limit
      if (slots.length >= this.MAX_RECURRING_SLOTS) {
        this.logger.warn(`Max recurring slots limit reached (${this.MAX_RECURRING_SLOTS})`);
        break;
      }
    }

    // Bulk insert slots
    if (slots.length > 0) {
      await this.slotRepository.save(slots);
    }

    this.logger.log(`Recurring slots created: ${slots.length} for prestataire ${prestataireId}`);

    return {
      created: slots.length,
      skipped: skippedDates.length,
      skippedDates,
      slots: slots.map((s) => ({
        id: s.id,
        prestataireId: s.prestataireId,
        serviceId: s.serviceId,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        status: s.status,
        notes: s.notes,
        isRecurring: s.isRecurring,
        createdAt: s.createdAt,
      })),
    };
  }

  /**
   * Generate time slots for a specific day
   */
  private async generateDaySlots(
    prestataireId: string,
    date: Date,
    dayStartTime: string,
    dayEndTime: string,
    slotDuration: number,
    pauseDuration: number,
    serviceId?: string
  ): Promise<Slot[]> {
    const slots: Slot[] = [];
    const recurringPatternId = `recurring-${Date.now()}`;

    let currentMinutes = parseTimeToMinutes(dayStartTime);
    const endMinutes = parseTimeToMinutes(dayEndTime);

    while (currentMinutes + slotDuration <= endMinutes) {
      const startTime = minutesToTimeString(currentMinutes);
      const endTime = minutesToTimeString(currentMinutes + slotDuration);

      // Check for overlap with existing slots
      const hasOverlap = await this.checkOverlap(prestataireId, date, startTime, endTime);

      if (!hasOverlap) {
        const slot = this.slotRepository.create({
          prestataireId,
          date,
          startTime,
          endTime,
          serviceId: serviceId || null,
          status: SlotStatus.AVAILABLE,
          isRecurring: true,
          recurringPatternId,
        });
        slots.push(slot);
      }

      // Move to next slot (duration + pause)
      currentMinutes += slotDuration + pauseDuration;
    }

    return slots;
  }

  /**
   * Update a slot
   */
  async updateSlot(slotId: string, prestataireId: string, dto: UpdateSlotDto): Promise<Slot> {
    const slot = await this.slotRepository.findOne({
      where: { id: slotId, prestataireId, deletedAt: IsNull() },
    });

    if (!slot) {
      throw new NotFoundException('Slot not found');
    }

    // Cannot update reserved slots
    if (slot.status === SlotStatus.RESERVED) {
      throw new BadRequestException('Cannot modify a reserved slot');
    }

    // Validate date if changing
    if (dto.date) {
      const newDate = dayjs(dto.date);
      if (newDate.isBefore(dayjs(), 'day')) {
        throw new BadRequestException('Cannot set slot date to the past');
      }
    }

    // Validate time if changing
    const newStartTime = dto.startTime || slot.startTime;
    const newEndTime = dto.endTime || slot.endTime;

    if (parseTimeToMinutes(newEndTime) <= parseTimeToMinutes(newStartTime)) {
      throw new BadRequestException('End time must be after start time');
    }

    // Check for overlap if date/time changed
    if (dto.date || dto.startTime || dto.endTime) {
      const newDate = dto.date ? new Date(dto.date) : slot.date;
      const hasOverlap = await this.checkOverlap(
        prestataireId,
        newDate,
        newStartTime,
        newEndTime,
        slotId // Exclude current slot
      );

      if (hasOverlap) {
        throw new ConflictException('Slot overlaps with existing slot');
      }
    }

    // Validate service if changing
    if (dto.serviceId) {
      const service = await this.serviceRepository.findOne({
        where: { id: dto.serviceId, prestataireId, isActive: true },
      });
      if (!service) {
        throw new NotFoundException('Service not found');
      }
    }

    // Update slot
    Object.assign(slot, {
      ...(dto.date && { date: new Date(dto.date) }),
      ...(dto.startTime && { startTime: dto.startTime }),
      ...(dto.endTime && { endTime: dto.endTime }),
      ...(dto.serviceId !== undefined && { serviceId: dto.serviceId }),
      ...(dto.status && { status: dto.status }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
    });

    await this.slotRepository.save(slot);

    this.logger.log(`Slot updated: ${slotId}`);

    return slot;
  }

  /**
   * Delete a slot (soft delete)
   */
  async deleteSlot(slotId: string, prestataireId: string): Promise<void> {
    const slot = await this.slotRepository.findOne({
      where: { id: slotId, prestataireId, deletedAt: IsNull() },
    });

    if (!slot) {
      throw new NotFoundException('Slot not found');
    }

    if (slot.status === SlotStatus.RESERVED) {
      throw new BadRequestException('Cannot delete a reserved slot. Cancel the appointment first.');
    }

    slot.deletedAt = new Date();
    await this.slotRepository.save(slot);

    this.logger.log(`Slot deleted: ${slotId}`);
  }

  /**
   * Block slots for a date range (vacations)
   */
  async blockSlots(
    prestataireId: string,
    dto: BlockSlotsDto
  ): Promise<{ blocked: number; conflicting: number }> {
    const startDate = dayjs(dto.startDate);
    const endDate = dayjs(dto.endDate);

    if (startDate.isAfter(endDate)) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Find available slots in range
    const availableSlots = await this.slotRepository.find({
      where: {
        prestataireId,
        status: SlotStatus.AVAILABLE,
        date: Between(startDate.toDate(), endDate.toDate()),
        deletedAt: IsNull(),
      },
    });

    // Block available slots
    for (const slot of availableSlots) {
      slot.status = SlotStatus.BLOCKED;
      slot.notes = dto.reason || 'Blocked';
    }

    await this.slotRepository.save(availableSlots);

    // Count reserved slots (cannot be blocked)
    const reservedCount = await this.slotRepository.count({
      where: {
        prestataireId,
        status: SlotStatus.RESERVED,
        date: Between(startDate.toDate(), endDate.toDate()),
        deletedAt: IsNull(),
      },
    });

    this.logger.log(`Slots blocked: ${availableSlots.length} for prestataire ${prestataireId}`);

    return {
      blocked: availableSlots.length,
      conflicting: reservedCount,
    };
  }

  /**
   * Find slot by ID
   */
  async findById(slotId: string): Promise<Slot> {
    const slot = await this.slotRepository.findOne({
      where: { id: slotId, deletedAt: IsNull() },
      relations: ['service', 'prestataire'],
    });

    if (!slot) {
      throw new NotFoundException('Slot not found');
    }

    return slot;
  }

  /**
   * Find slots with filters
   */
  async findSlots(dto: QuerySlotsDto): Promise<PaginatedResult<Slot>> {
    const { page, limit, skip } = normalizePagination(dto.page, dto.limit);

    const queryBuilder = this.slotRepository
      .createQueryBuilder('slot')
      .leftJoinAndSelect('slot.service', 'service')
      .where('slot.deletedAt IS NULL');

    // Filter by prestataire
    if (dto.prestataireId) {
      queryBuilder.andWhere('slot.prestataireId = :prestataireId', {
        prestataireId: dto.prestataireId,
      });
    }

    // Filter by date
    if (dto.date) {
      queryBuilder.andWhere('slot.date = :date', { date: dto.date });
    }

    // Filter by date range
    if (dto.startDate) {
      queryBuilder.andWhere('slot.date >= :startDate', { startDate: dto.startDate });
    }
    if (dto.endDate) {
      queryBuilder.andWhere('slot.date <= :endDate', { endDate: dto.endDate });
    }

    // Filter by status
    if (dto.status) {
      queryBuilder.andWhere('slot.status = :status', { status: dto.status });
    }

    // Filter available only
    if (dto.availableOnly) {
      queryBuilder.andWhere('slot.status = :availableStatus', {
        availableStatus: SlotStatus.AVAILABLE,
      });
      // Hide past slots
      queryBuilder.andWhere('slot.date >= :today', { today: new Date() });
    }

    // Filter by service
    if (dto.serviceId) {
      queryBuilder.andWhere('slot.serviceId = :serviceId', {
        serviceId: dto.serviceId,
      });
    }

    // Order by date and time
    queryBuilder.orderBy('slot.date', 'ASC').addOrderBy('slot.startTime', 'ASC');

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    const slots = await queryBuilder.getMany();

    return createPaginatedResult(slots, total, page, limit);
  }

  /**
   * Find available slots for a prestataire (public view)
   */
  async findAvailableSlots(
    prestataireId: string,
    startDate?: string,
    endDate?: string,
    serviceId?: string
  ): Promise<Slot[]> {
    const queryBuilder = this.slotRepository
      .createQueryBuilder('slot')
      .leftJoinAndSelect('slot.service', 'service')
      .where('slot.prestataireId = :prestataireId', { prestataireId })
      .andWhere('slot.status = :status', { status: SlotStatus.AVAILABLE })
      .andWhere('slot.deletedAt IS NULL')
      .andWhere('slot.date >= :today', { today: dayjs().format('YYYY-MM-DD') });

    if (startDate) {
      queryBuilder.andWhere('slot.date >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('slot.date <= :endDate', { endDate });
    }

    if (serviceId) {
      queryBuilder.andWhere('(slot.serviceId = :serviceId OR slot.serviceId IS NULL)', {
        serviceId,
      });
    }

    queryBuilder.orderBy('slot.date', 'ASC').addOrderBy('slot.startTime', 'ASC');

    return queryBuilder.getMany();
  }

  // ==========================================
  // PRIVATE METHODS
  // ==========================================

  /**
   * Check if a slot overlaps with existing slots
   */
  private async checkOverlap(
    prestataireId: string,
    date: Date,
    startTime: string,
    endTime: string,
    excludeSlotId?: string
  ): Promise<boolean> {
    const queryBuilder = this.slotRepository
      .createQueryBuilder('slot')
      .where('slot.prestataireId = :prestataireId', { prestataireId })
      .andWhere('slot.date = :date', { date })
      .andWhere('slot.deletedAt IS NULL')
      .andWhere('slot.status != :blockedStatus', { blockedStatus: SlotStatus.BLOCKED });

    if (excludeSlotId) {
      queryBuilder.andWhere('slot.id != :excludeSlotId', { excludeSlotId });
    }

    const existingSlots = await queryBuilder.getMany();

    for (const existingSlot of existingSlots) {
      if (hasTimeOverlap(startTime, endTime, existingSlot.startTime, existingSlot.endTime)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Validate time format (HH:mm)
   */
  private isValidTime(time: string): boolean {
    return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
  }
}
