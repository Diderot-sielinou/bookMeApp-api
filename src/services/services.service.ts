import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Service } from './entities/service.entity';
import { CreateServiceDto, UpdateServiceDto } from './dto';

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>
  ) {}

  /**
   * Create a new service
   */
  async create(prestataireId: string, dto: CreateServiceDto): Promise<Service> {
    const service = this.serviceRepository.create({
      ...dto,
      prestataireId,
    });

    await this.serviceRepository.save(service);

    this.logger.log(`Service created: ${service.id} for prestataire ${prestataireId}`);

    return service;
  }

  /**
   * Find all services for a prestataire
   */
  async findByPrestataire(prestataireId: string, activeOnly = true): Promise<Service[]> {
    const query = this.serviceRepository
      .createQueryBuilder('service')
      .where('service.prestataireId = :prestataireId', { prestataireId });

    if (activeOnly) {
      query.andWhere('service.isActive = :isActive', { isActive: true });
    }

    return query.orderBy('service.displayOrder', 'ASC').getMany();
  }

  /**
   * Find a single service by ID
   */
  async findById(id: string): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: ['prestataire'],
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  /**
   * Update a service
   */
  async update(id: string, prestataireId: string, dto: UpdateServiceDto): Promise<Service> {
    const service = await this.findById(id);

    // Verify ownership
    if (service.prestataireId !== prestataireId) {
      throw new ForbiddenException('You can only update your own services');
    }

    Object.assign(service, dto);
    await this.serviceRepository.save(service);

    this.logger.log(`Service updated: ${id}`);

    return service;
  }

  /**
   * Delete a service (soft delete - sets isActive to false)
   */
  async delete(id: string, prestataireId: string): Promise<void> {
    const service = await this.findById(id);

    // Verify ownership
    if (service.prestataireId !== prestataireId) {
      throw new ForbiddenException('You can only delete your own services');
    }

    // Soft delete - just mark as inactive
    service.isActive = false;
    await this.serviceRepository.save(service);

    this.logger.log(`Service soft deleted: ${id}`);
  }

  /**
   * Reorder services
   */
  async reorder(prestataireId: string, serviceIds: string[]): Promise<Service[]> {
    const services = await this.findByPrestataire(prestataireId, false);

    // Update display order
    for (let i = 0; i < serviceIds.length; i++) {
      const service = services.find((s) => s.id === serviceIds[i]);
      if (service) {
        service.displayOrder = i;
        await this.serviceRepository.save(service);
      }
    }

    return this.findByPrestataire(prestataireId, false);
  }
}
