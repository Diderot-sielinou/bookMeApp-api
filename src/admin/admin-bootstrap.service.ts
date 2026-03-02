/**
 * AdminBootstrapService
 *
 * Service qui s'exécute au démarrage de l'application pour créer
 * le compte administrateur initial si il n'existe pas.
 *
 * Configuration via variables d'environnement:
 * - ADMIN_EMAIL (requis en production)
 * - ADMIN_PASSWORD (requis en production)
 * - CREATE_ADMIN_ON_STARTUP=true (pour activer)
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/constants';

@Injectable()
export class AdminBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(AdminBootstrapService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService
  ) {}

  async onModuleInit() {
    // Vérifier si la création d'admin est activée
    const createAdmin = this.configService.get<string>('CREATE_ADMIN_ON_STARTUP');

    if (createAdmin !== 'true') {
      this.logger.log('Admin bootstrap désactivé (CREATE_ADMIN_ON_STARTUP !== true)');
      return;
    }

    await this.createInitialAdmin();
  }

  private async createInitialAdmin() {
    try {
      // Récupérer les credentials depuis les variables d'environnement
      const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
      const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');

      // Validation
      if (!adminEmail || !adminPassword) {
        this.logger.warn(
          '⚠️  ADMIN_EMAIL et ADMIN_PASSWORD doivent être définis pour créer un admin'
        );
        return;
      }

      if (adminPassword.length < 8) {
        this.logger.warn('⚠️  ADMIN_PASSWORD doit contenir au moins 8 caractères');
        return;
      }

      // Vérifier si un admin existe déjà
      const existingAdmin = await this.userRepository.findOne({
        where: { role: UserRole.ADMIN },
      });

      if (existingAdmin) {
        this.logger.log(`✅ Un compte admin existe déjà (${existingAdmin.email})`);
        return;
      }

      // Vérifier si l'email est déjà utilisé
      const existingUser = await this.userRepository.findOne({
        where: { email: adminEmail },
      });

      if (existingUser) {
        this.logger.warn(`⚠️  L'email ${adminEmail} est déjà utilisé par un autre compte`);
        return;
      }

      // Créer l'admin
      const hashedPassword = await bcrypt.hash(adminPassword, 12);

      const admin = this.userRepository.create({
        email: adminEmail,
        password: hashedPassword,
        role: UserRole.ADMIN,
        emailVerified: true,
        isActive: true,
      });

      await this.userRepository.save(admin);

      this.logger.log('🎉 ================================');
      this.logger.log('🎉 COMPTE ADMIN CRÉÉ AVEC SUCCÈS');
      this.logger.log(`🎉 Email: ${adminEmail}`);
      this.logger.log('🎉 ================================');
      this.logger.warn('Pensez à changer le mot de passe après la première connexion!');
      this.logger.warn('Désactivez CREATE_ADMIN_ON_STARTUP après la création');
    } catch (error) {
      this.logger.error(" Erreur lors de la création de l'admin:", error);
    }
  }
}
