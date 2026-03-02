import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { User } from './entities/user.entity';
import { Client } from './entities/client.entity';
import { Prestataire } from './entities/prestataire.entity';
import { UpdateClientDto, UpdatePrestataireDto } from './dto';
import { PrestataireStatus } from '../common/constants';
// import { UserRole, PrestataireStatus } from '../common/constants';

interface CancellationStats {
  total: string; // TypeORM often returns SQL COUNT SUM values as strings
  cancelled: string;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Prestataire)
    private readonly prestataireRepository: Repository<Prestataire>,
    private readonly eventEmitter: EventEmitter2
  ) {}

  // ==========================================
  // USER METHODS
  // ==========================================

  async findUserById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  // ==========================================
  // CLIENT METHODS
  // ==========================================

  async findClientById(id: string): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  async updateClient(id: string, dto: UpdateClientDto): Promise<Client> {
    const client = await this.findClientById(id);

    // Update client fields
    Object.assign(client, dto);
    await this.clientRepository.save(client);

    this.logger.log(`Client updated: ${id}`);

    return client;
  }

  async getClientWithAppointments(id: string): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { id },
      relations: ['user', 'appointments', 'appointments.prestataire', 'appointments.service'],
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  // ==========================================
  // PRESTATAIRE METHODS
  // ==========================================

  async findPrestataireById(id: string): Promise<Prestataire> {
    const prestataire = await this.prestataireRepository.findOne({
      where: { id },
      relations: ['user', 'services', 'badges'],
    });

    if (!prestataire) {
      throw new NotFoundException('Prestataire not found');
    }

    return prestataire;
  }

  async findPrestataireByIdPublic(id: string): Promise<Prestataire> {
    const prestataire = await this.prestataireRepository.findOne({
      where: { id, status: PrestataireStatus.ACTIVE },
      relations: ['services', 'badges'],
    });

    if (!prestataire) {
      throw new NotFoundException('Prestataire not found');
    }

    return prestataire;
  }

  async updatePrestataire(id: string, dto: UpdatePrestataireDto): Promise<Prestataire> {
    const prestataire = await this.findPrestataireById(id);

    // Track if categories changed for potential re-validation
    const categoriesChanged =
      dto.categories && JSON.stringify(dto.categories) !== JSON.stringify(prestataire.categories);

    // Update prestataire fields
    Object.assign(prestataire, dto);

    // Check if profile is now complete
    prestataire.profileCompleted = this.checkProfileComplete(prestataire);

    await this.prestataireRepository.save(prestataire);

    // If categories changed, emit event for potential re-validation
    if (categoriesChanged) {
      this.eventEmitter.emit('prestataire.categories_changed', { prestataire });
    }

    this.logger.log(`Prestataire updated: ${id}`);

    return prestataire;
  }

  async findAllPrestataires(options?: {
    status?: PrestataireStatus;
    categories?: string[];
    page?: number;
    limit?: number;
  }): Promise<{ data: Prestataire[]; total: number }> {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 100);
    const skip = (page - 1) * limit;

    const query = this.prestataireRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.services', 'service')
      .leftJoinAndSelect('p.badges', 'badge');

    if (options?.status) {
      query.andWhere('p.status = :status', { status: options.status });
    } else {
      // By default, only show active prestataires
      query.andWhere('p.status = :status', { status: PrestataireStatus.ACTIVE });
    }

    if (options?.categories?.length) {
      query.andWhere('p.categories && :categories', { categories: options.categories });
    }

    query.orderBy('p.averageRating', 'DESC').skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();

    return { data, total };
  }

  async getPrestataireStats(id: string): Promise<{
    totalAppointments: number;
    totalReviews: number;
    averageRating: number;
    cancellationRate: number;
  }> {
    const prestataire = await this.findPrestataireById(id);

    // Calculate cancellation rate
    const stats = await this.prestataireRepository
      .createQueryBuilder('p')
      .leftJoin('p.appointments', 'a')
      .where('p.id = :id', { id })
      .select([
        'COUNT(a.id) as total',
        "SUM(CASE WHEN a.status = 'CANCELLED' AND a.cancelled_by_id = :id THEN 1 ELSE 0 END) as cancelled",
      ])
      .setParameter('id', id)
      .getRawOne<CancellationStats>();

    // 3. Accès sécurisé
    const total = stats ? parseInt(stats.total, 10) : 0;
    const cancelled = stats ? parseInt(stats.cancelled, 10) : 0;
    const cancellationRate = total > 0 ? (cancelled / total) * 100 : 0;

    return {
      totalAppointments: prestataire.totalAppointments,
      totalReviews: prestataire.totalReviews,
      averageRating: parseFloat(prestataire.averageRating.toString()),
      cancellationRate: Math.round(cancellationRate * 100) / 100,
    };
  }

  // ==========================================
  // ADMIN METHODS
  // ==========================================

  async suspendUser(userId: string, reason?: string): Promise<void> {
    const user = await this.findUserById(userId);

    await this.userRepository.update(userId, { isActive: false });

    this.eventEmitter.emit('user.suspended', { user, reason });
    this.logger.log(`User suspended: ${userId}`);
  }

  async reactivateUser(userId: string): Promise<void> {
    const user = await this.findUserById(userId);

    await this.userRepository.update(userId, { isActive: true });

    this.eventEmitter.emit('user.reactivated', { user });
    this.logger.log(`User reactivated: ${userId}`);
  }

  async approvePrestataire(prestataireId: string): Promise<Prestataire> {
    const prestataire = await this.findPrestataireById(prestataireId);

    if (prestataire.status !== PrestataireStatus.PENDING) {
      throw new BadRequestException('Prestataire is not pending approval');
    }

    prestataire.status = PrestataireStatus.ACTIVE;
    await this.prestataireRepository.save(prestataire);

    this.eventEmitter.emit('prestataire.approved', { prestataire });
    this.logger.log(`Prestataire approved: ${prestataireId}`);

    return prestataire;
  }

  async rejectPrestataire(prestataireId: string, reason: string): Promise<void> {
    const prestataire = await this.findPrestataireById(prestataireId);

    if (prestataire.status !== PrestataireStatus.PENDING) {
      throw new BadRequestException('Prestataire is not pending approval');
    }

    this.eventEmitter.emit('prestataire.rejected', { prestataire, reason });

    // Delete user and prestataire
    await this.userRepository.delete(prestataireId);

    this.logger.log(`Prestataire rejected and deleted: ${prestataireId}`);
  }

  // ==========================================
  // PRIVATE METHODS
  // ==========================================

  private checkProfileComplete(prestataire: Prestataire): boolean {
    return !!(
      prestataire.businessName &&
      prestataire.firstName &&
      prestataire.lastName &&
      prestataire.phone &&
      prestataire.categories?.length > 0 &&
      prestataire.bio
    );
  }
}
