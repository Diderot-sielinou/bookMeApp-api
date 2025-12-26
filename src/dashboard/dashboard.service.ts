/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import dayjs from 'dayjs';

import { Appointment } from '../appointments/entities/appointment.entity';
import { Review } from '../reviews/entities/review.entity';
import { Slot } from '../slots/entities/slot.entity';
import { Prestataire } from '../users/entities/prestataire.entity';
import { AppointmentStatus, SlotStatus } from '../common/constants';

export interface DashboardStats {
  totalAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  cancellationRate: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
  totalSlots: number;
  availableSlots: number;
  bookedSlots: number;
}

export interface AppointmentsByDay {
  date: string;
  count: number;
}

export interface RevenueByMonth {
  month: string;
  revenue: number;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Slot)
    private readonly slotRepository: Repository<Slot>,
    @InjectRepository(Prestataire)
    private readonly prestataireRepository: Repository<Prestataire>
  ) {}

  /**
   * Get dashboard statistics for a prestataire
   */
  async getStats(prestataireId: string): Promise<DashboardStats> {
    const prestataire = await this.prestataireRepository.findOne({
      where: { id: prestataireId },
    });

    // Get appointment counts
    const totalAppointments = await this.appointmentRepository.count({
      where: { prestataireId },
    });

    const upcomingAppointments = await this.appointmentRepository
      .createQueryBuilder('a')
      .leftJoin('a.slot', 's')
      .where('a.prestataireId = :prestataireId', { prestataireId })
      .andWhere('a.status = :status', { status: AppointmentStatus.CONFIRMED })
      .andWhere('s.date >= :today', { today: new Date() })
      .getCount();

    const completedAppointments = await this.appointmentRepository.count({
      where: { prestataireId, status: AppointmentStatus.COMPLETED },
    });

    const cancelledAppointments = await this.appointmentRepository.count({
      where: { prestataireId, status: AppointmentStatus.CANCELLED },
    });

    const cancellationRate = totalAppointments > 0 ? cancelledAppointments / totalAppointments : 0;

    // Calculate revenue
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const revenueResult = await this.appointmentRepository
      .createQueryBuilder('a')
      .select('SUM(a.priceAtBooking)', 'total')
      .where('a.prestataireId = :prestataireId', { prestataireId })
      .andWhere('a.status = :status', { status: AppointmentStatus.COMPLETED })
      .getRawOne();

    const totalRevenue = parseFloat(revenueResult?.total || '0');

    // Get slot counts
    const today = dayjs().format('YYYY-MM-DD');

    const totalSlots = await this.slotRepository.count({
      where: { prestataireId, deletedAt: IsNull() },
    });

    const availableSlots = await this.slotRepository
      .createQueryBuilder('s')
      .where('s.prestataireId = :prestataireId', { prestataireId })
      .andWhere('s.status = :status', { status: SlotStatus.AVAILABLE })
      .andWhere('s.date >= :today', { today })
      .andWhere('s.deletedAt IS NULL')
      .getCount();

    const bookedSlots = await this.slotRepository
      .createQueryBuilder('s')
      .where('s.prestataireId = :prestataireId', { prestataireId })
      .andWhere('s.status = :status', { status: SlotStatus.RESERVED })
      .andWhere('s.date >= :today', { today })
      .andWhere('s.deletedAt IS NULL')
      .getCount();

    return {
      totalAppointments,
      upcomingAppointments,
      completedAppointments,
      cancelledAppointments,
      cancellationRate: Math.round(cancellationRate * 100) / 100,
      totalRevenue,
      averageRating: prestataire ? parseFloat(prestataire.averageRating.toString()) : 0,
      totalReviews: prestataire?.totalReviews || 0,
      totalSlots,
      availableSlots,
      bookedSlots,
    };
  }

  /**
   * Get appointments by day for the last N days
   */
  async getAppointmentsByDay(
    prestataireId: string,
    days: number = 30
  ): Promise<AppointmentsByDay[]> {
    const startDate = dayjs().subtract(days, 'day').startOf('day').toDate();
    const endDate = dayjs().endOf('day').toDate();

    const results = await this.appointmentRepository
      .createQueryBuilder('a')
      .leftJoin('a.slot', 's')
      .select('DATE(s.date)', 'date')
      .addSelect('COUNT(a.id)', 'count')
      .where('a.prestataireId = :prestataireId', { prestataireId })
      .andWhere('s.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('DATE(s.date)')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Fill in missing days
    const appointmentsByDay: AppointmentsByDay[] = [];
    let currentDate = dayjs(startDate);

    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
      const dateStr = currentDate.format('YYYY-MM-DD');
      const found = results.find((r) => r.date === dateStr);

      appointmentsByDay.push({
        date: dateStr,
        count: found ? parseInt(found.count) : 0,
      });

      currentDate = currentDate.add(1, 'day');
    }

    return appointmentsByDay;
  }

  /**
   * Get revenue by month for the last N months
   */
  async getRevenueByMonth(prestataireId: string, months: number = 12): Promise<RevenueByMonth[]> {
    const startDate = dayjs().subtract(months, 'month').startOf('month').toDate();

    const results = await this.appointmentRepository
      .createQueryBuilder('a')
      .select("TO_CHAR(a.createdAt, 'YYYY-MM')", 'month')
      .addSelect('SUM(a.priceAtBooking)', 'revenue')
      .where('a.prestataireId = :prestataireId', { prestataireId })
      .andWhere('a.status = :status', { status: AppointmentStatus.COMPLETED })
      .andWhere('a.createdAt >= :startDate', { startDate })
      .groupBy("TO_CHAR(a.createdAt, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .getRawMany();

    // Fill in missing months
    const revenueByMonth: RevenueByMonth[] = [];
    let currentMonth = dayjs(startDate);
    const endMonth = dayjs();

    while (currentMonth.isBefore(endMonth) || currentMonth.isSame(endMonth, 'month')) {
      const monthStr = currentMonth.format('YYYY-MM');
      const found = results.find((r) => r.month === monthStr);

      revenueByMonth.push({
        month: monthStr,
        revenue: found ? parseFloat(found.revenue) : 0,
      });

      currentMonth = currentMonth.add(1, 'month');
    }

    return revenueByMonth;
  }

  /**
   * Get today's appointments
   */
  async getTodayAppointments(prestataireId: string): Promise<Appointment[]> {
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
   * Get recent reviews
   */
  async getRecentReviews(prestataireId: string, limit: number = 5): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { prestataireId, isVisible: true },
      relations: ['client', 'appointment', 'appointment.service'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get rating distribution
   */
  async getRatingDistribution(prestataireId: string): Promise<Record<number, number>> {
    const results = await this.reviewRepository
      .createQueryBuilder('r')
      .select('r.rating', 'rating')
      .addSelect('COUNT(r.id)', 'count')
      .where('r.prestataireId = :prestataireId', { prestataireId })
      .andWhere('r.isVisible = :isVisible', { isVisible: true })
      .groupBy('r.rating')
      .getRawMany();

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    results.forEach((r) => {
      distribution[r.rating] = parseInt(r.count);
    });

    return distribution;
  }
}
