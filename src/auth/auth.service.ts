/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Logger,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Redis from 'ioredis';
import dayjs from 'dayjs';

import { User } from '../users/entities/user.entity';
import { Client } from '../users/entities/client.entity';
import { Prestataire } from '../users/entities/prestataire.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import {
  RegisterClientDto,
  RegisterPrestataireDto,
  LoginDto,
  AuthTokens,
  AuthResponse,
} from './dto';
import { hashPassword, comparePassword, generateToken } from '../common/utils/hash.util';
import { UserRole, PrestataireStatus } from '../common/constants';
import { JwtPayload } from '../common/interfaces';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly JWT_BLACKLIST_PREFIX = 'jwt:blacklist:';

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Prestataire)
    private readonly prestataireRepository: Repository<Prestataire>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    @Inject('REDIS_CLIENT') private readonly redis: Redis
  ) {}

  /**
   * Register a new client
   */
  async registerClient(dto: RegisterClientDto): Promise<{ user: User; message: string }> {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await hashPassword(dto.password);

    // Generate verification token
    const verificationToken = generateToken();
    const verificationExpires = dayjs().add(24, 'hours').toDate();

    // Create user
    const user = this.userRepository.create({
      email: dto.email.toLowerCase(),
      password: hashedPassword,
      role: UserRole.CLIENT,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    await this.userRepository.save(user);

    // Create client profile
    const client = this.clientRepository.create({
      id: user.id,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone || null,
    });

    await this.clientRepository.save(client);

    // Emit event for email verification
    this.eventEmitter.emit('user.registered', {
      user,
      verificationToken,
      type: 'client',
    });

    this.logger.log(`New client registered: ${user.email}`);

    return {
      user,
      message: 'Account created. Please verify your email.',
    };
  }

  /**
   * Register a new prestataire
   */
  async registerPrestataire(dto: RegisterPrestataireDto): Promise<{ user: User; message: string }> {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await hashPassword(dto.password);

    // Generate verification token
    const verificationToken = generateToken();
    const verificationExpires = dayjs().add(24, 'hours').toDate();

    // Create user
    const user = this.userRepository.create({
      email: dto.email.toLowerCase(),
      password: hashedPassword,
      role: UserRole.PRESTATAIRE,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    await this.userRepository.save(user);

    // Create prestataire profile
    const prestataire = this.prestataireRepository.create({
      id: user.id,
      businessName: dto.businessName,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      categories: dto.categories,
      status: PrestataireStatus.PENDING,
    });

    await this.prestataireRepository.save(prestataire);

    // Emit event for email verification
    this.eventEmitter.emit('user.registered', {
      user,
      verificationToken,
      type: 'prestataire',
    });

    this.logger.log(`New prestataire registered: ${user.email}`);

    return {
      user,
      message: 'Account created. Please verify your email and wait for admin approval.',
    };
  }

  /**
   * Validate user credentials
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * Login user and generate tokens
   */
  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const user = await this.validateUser(dto.email, dto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is suspended');
    }

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Save refresh token
    await this.saveRefreshToken(user.id, tokens.refreshToken, ipAddress, userAgent);

    // Update last login
    await this.userRepository.update(user.id, { lastLoginAt: new Date() });

    // Emit login event
    this.eventEmitter.emit('user.login', { user, ipAddress, userAgent });

    this.logger.log(`User logged in: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      tokens,
    };
  }

  /**
   * Logout user and invalidate token
   */
  async logout(userId: string, accessToken: string): Promise<void> {
    // Add access token to blacklist
    const decoded = this.jwtService.decode(accessToken);
    if (decoded?.exp) {
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await this.redis.setex(`${this.JWT_BLACKLIST_PREFIX}${accessToken}`, ttl, '1');
      }
    }

    // Revoke all refresh tokens for user
    await this.refreshTokenRepository.update({ userId, isRevoked: false }, { isRevoked: true });

    this.logger.log(`User logged out: ${userId}`);
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshTokenString: string): Promise<AuthTokens> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshTokenString, isRevoked: false },
      relations: ['user'],
    });

    if (!refreshToken || !refreshToken.isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = refreshToken.user;

    if (!user.isActive) {
      throw new UnauthorizedException('Account is suspended');
    }

    // Generate new tokens
    const tokens = this.generateTokens(user);

    // Revoke old refresh token
    await this.refreshTokenRepository.update(refreshToken.id, { isRevoked: true });

    // Save new refresh token
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: MoreThan(new Date()),
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.userRepository.update(user.id, {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    });

    // Emit email verified event
    this.eventEmitter.emit('user.email_verified', { user });

    this.logger.log(`Email verified for user: ${user.email}`);

    return { message: 'Email verified successfully' };
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const resetToken = generateToken();
    const resetExpires = dayjs().add(1, 'hour').toDate();

    await this.userRepository.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    });

    // Emit password reset event
    this.eventEmitter.emit('user.password_reset_request', {
      user,
      resetToken,
    });

    this.logger.log(`Password reset requested for: ${user.email}`);

    return { message: 'If the email exists, a reset link has been sent' };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: {
        passwordResetToken: token,
        passwordResetExpires: MoreThan(new Date()),
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await hashPassword(newPassword);

    await this.userRepository.update(user.id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    });

    // Revoke all refresh tokens
    await this.refreshTokenRepository.update(
      { userId: user.id, isRevoked: false },
      { isRevoked: true }
    );

    // Emit password changed event
    this.eventEmitter.emit('user.password_changed', { user });

    this.logger.log(`Password reset completed for: ${user.email}`);

    return { message: 'Password has been reset successfully' };
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isPasswordValid = await comparePassword(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedPassword = await hashPassword(newPassword);

    await this.userRepository.update(userId, { password: hashedPassword });

    this.logger.log(`Password changed for user: ${user.email}`);

    return { message: 'Password changed successfully' };
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return { message: 'If the email exists, a verification link has been sent' };
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    const verificationToken = generateToken();
    const verificationExpires = dayjs().add(24, 'hours').toDate();

    await this.userRepository.update(user.id, {
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    this.eventEmitter.emit('user.verification_resend', {
      user,
      verificationToken,
    });

    return { message: 'If the email exists, a verification link has been sent' };
  }

  /**
   * Check if JWT token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const result = await this.redis.get(`${this.JWT_BLACKLIST_PREFIX}${token}`);
    return result !== null;
  }

  // backend/src/auth/auth.service.ts

  /**
   * Récupère l'utilisateur actuel avec son profil complet
   */
  async getMe(userId: string, role: UserRole) {
    // 1. Récupérer les infos de base de l'utilisateur
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: [
        'id',
        'email',
        'role',
        'emailVerified',
        'twoFactorEnabled',
        'lastLoginAt',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new NotFoundException('user not found');
    }

    // 2. Récupérer le profil selon le rôle
    let profile = null;
    if (role === UserRole.CLIENT) {
      profile = await this.clientRepository.findOne({ where: { id: userId } });
    } else if (role === UserRole.PRESTATAIRE) {
      profile = await this.prestataireRepository.findOne({
        where: { id: userId },
        relations: ['services', 'badges'],
      });
    }

    // 3. Retourner la structure attendue par le frontend
    return {
      user,
      profile,
    };
  }

  // ==========================================
  // PRIVATE METHODS
  // ==========================================

  private generateTokens(user: User): AuthTokens {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshPayload = {
      ...payload,
      tokenId: generateToken(16),
    };

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d'),
    });

    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '7d');
    const expiresInSeconds = this.parseExpiresIn(expiresIn);

    return {
      accessToken,
      refreshToken,
      expiresIn: expiresInSeconds,
    };
  }

  private async saveRefreshToken(
    userId: string,
    token: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d');
    const expiresAt = dayjs().add(parseInt(expiresIn), 'days').toDate();

    const refreshToken = this.refreshTokenRepository.create({
      userId,
      token,
      expiresAt,
      ipAddress,
      userAgent,
    });

    await this.refreshTokenRepository.save(refreshToken);
  }

  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 604800; // Default 7 days

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 604800;
    }
  }
}
