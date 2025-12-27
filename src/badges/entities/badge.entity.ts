import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BadgeType } from '../../common/constants';
import { Prestataire } from '../../users/entities/prestataire.entity';

@Entity('badges')
@Unique(['prestataireId', 'type'])
export class Badge {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Prestataire ID' })
  @Index()
  @Column({ name: 'prestataire_id', type: 'uuid' })
  prestataireId: string;

  @ApiProperty({ enum: BadgeType, description: 'Badge type' })
  @Column({ type: 'enum', enum: BadgeType })
  type: BadgeType;

  @ApiProperty({ description: 'Award timestamp' })
  @CreateDateColumn({ name: 'awarded_at', type: 'timestamp' })
  awardedAt: Date;

  @ApiProperty({ description: 'Expiration timestamp (null for permanent badges)' })
  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @ApiProperty({ description: 'Whether badge is active' })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  // Relations
  @ManyToOne(() => Prestataire, (prestataire) => prestataire.badges, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'prestataire_id' })
  prestataire: Prestataire;

  // Helper to check if badge is expired
  get isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  // Badge display info
  static getBadgeInfo(type: BadgeType): { icon: string; label: string; description: string } {
    const badges: Record<BadgeType, { icon: string; label: string; description: string }> = {
      [BadgeType.TOP_RATED]: {
        icon: '🏆',
        label: 'Top Prestataire',
        description: 'Note ≥ 4.5 avec minimum 10 avis',
      },
      [BadgeType.RESPONSIVE]: {
        icon: '⚡',
        label: 'Réactif',
        description: 'Répond rapidement aux demandes',
      },
      [BadgeType.RELIABLE]: {
        icon: '💎',
        label: 'Fiable',
        description: "Taux d'annulation < 5%",
      },
      [BadgeType.POPULAR]: {
        icon: '🌟',
        label: 'Populaire',
        description: 'Plus de 50 rendez-vous sur 3 mois',
      },
    };
    return badges[type];
  }
}
