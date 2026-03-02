// ==========================================
// USER ROLES
// ==========================================
export enum UserRole {
  CLIENT = 'CLIENT',
  PRESTATAIRE = 'PRESTATAIRE',
  ADMIN = 'ADMIN',
}

// ==========================================
// ADMIN ROLES
// ==========================================
export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  MODERATOR = 'MODERATOR',
  SUPPORT = 'SUPPORT',
}

// ==========================================
// PRESTATAIRE STATUS
// ==========================================
export enum PrestataireStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

// ==========================================
// SLOT STATUS
// ==========================================
export enum SlotStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  BLOCKED = 'BLOCKED',
}

// ==========================================
// APPOINTMENT STATUS
// ==========================================
export enum AppointmentStatus {
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

// ==========================================
// BADGE TYPES
// ==========================================
export enum BadgeType {
  TOP_RATED = 'TOP_RATED',
  RESPONSIVE = 'RESPONSIVE',
  RELIABLE = 'RELIABLE',
  POPULAR = 'POPULAR',
}

// ==========================================
// NOTIFICATION TYPES
// ==========================================
export enum NotificationType {
  NEW_BOOKING = 'NEW_BOOKING',
  CANCELLATION = 'CANCELLATION',
  REMINDER = 'REMINDER',
  NEW_REVIEW = 'NEW_REVIEW',
  NEW_MESSAGE = 'NEW_MESSAGE',
  BADGE_EARNED = 'BADGE_EARNED',
  SYSTEM = 'SYSTEM',
}

// ==========================================
// DAYS OF WEEK
// ==========================================
export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

// ==========================================
// PROFESSIONAL CATEGORIES
// ==========================================
export const PROFESSIONAL_CATEGORIES = [
  'Coiffure',
  'Esthétique',
  'Massage',
  'Bien-être',
  'Sport & Fitness',
  'Médical',
  'Paramédical',
  'Conseil',
  'Coaching',
  'Formation',
  'Juridique',
  'Comptabilité',
  'Immobilier',
  'Artisanat',
  'Photographie',
  'Événementiel',
  'Autre',
] as const;

export type ProfessionalCategory = (typeof PROFESSIONAL_CATEGORIES)[number];

// ==========================================
// PAGINATION DEFAULTS
// ==========================================
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// ==========================================
// CACHE TTL (in seconds)
// ==========================================
export const CACHE_TTL = {
  PROFILE: 1800, // 30 minutes
  PRESTATAIRE_PROFILE: 1800, // 30 minutes
  AVAILABLE_SLOTS: 300, // 5 minutes
  STATS: 3600, // 1 hour
  STATISTICS: 3600, // 1 hour
  BADGES: 86400, // 24 hours
  SEARCH_RESULTS: 900, // 15 minutes
} as const;

// ==========================================
// VALIDATION CONSTANTS
// ==========================================
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  BIO_MAX_LENGTH: 500,
  SERVICE_NAME_MAX_LENGTH: 100,
  SERVICE_DESCRIPTION_MAX_LENGTH: 500,
  REVIEW_COMMENT_MIN_LENGTH: 10,
  REVIEW_COMMENT_MAX_LENGTH: 1000,
  REVIEW_RESPONSE_MAX_LENGTH: 500,
  MESSAGE_MAX_LENGTH: 2000,
  PORTFOLIO_MAX_IMAGES: 10,
  FILE_MAX_SIZE_MB: 5,
  SERVICE_MIN_DURATION: 15,
  SERVICE_MAX_DURATION: 480,
} as const;

// ==========================================
// TIME CONSTANTS
// ==========================================
export const TIME_CONSTANTS = {
  EMAIL_VERIFICATION_EXPIRY_HOURS: 24,
  PASSWORD_RESET_EXPIRY_HOURS: 1,
  REVIEW_WINDOW_DAYS: 14,
  REVIEW_EDIT_WINDOW_HOURS: 48,
  MESSAGE_ARCHIVE_DAYS: 90,
  INACTIVE_ACCOUNT_YEARS: 3,
  DEFAULT_CANCELLATION_HOURS: 24,
  DEFAULT_MIN_BOOKING_NOTICE_HOURS: 1,
} as const;

// ==========================================
// BADGE CRITERIA
// ==========================================
export const BADGE_CRITERIA = {
  TOP_RATED: {
    minRating: 4.5,
    minReviews: 10,
  },
  RESPONSIVE: {
    minResponseRate: 5, // Used as minimum threshold
    maxResponseTimeHours: 2,
    periodDays: 30,
  },
  RELIABLE: {
    maxCancellationRate: 0.05,
    periodDays: 30,
  },
  POPULAR: {
    minAppointmentsPerMonth: 50,
    periodDays: 90,
  },
} as const;
