// ==========================================
// API RESPONSE INTERFACES
// ==========================================
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ErrorDetail[];
  };
  timestamp: string;
  path?: string;
}

export interface ErrorDetail {
  field: string;
  message: string;
}

// ==========================================
// PAGINATION INTERFACES
// ==========================================
export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface CursorPaginationMeta {
  hasMore: boolean;
  nextCursor: string | null;
  total?: number;
}

export interface CursorPaginatedResult<T> {
  data: T[];
  meta: CursorPaginationMeta;
}

// ==========================================
// QUERY INTERFACES
// ==========================================
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface CursorPaginationQuery {
  cursor?: string;
  limit?: number;
}

export interface SortQuery {
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface DateRangeQuery {
  startDate?: Date;
  endDate?: Date;
}

// ==========================================
// JWT PAYLOAD INTERFACES
// ==========================================
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload extends JwtPayload {
  tokenId: string;
}

// ==========================================
// REQUEST INTERFACES
// ==========================================
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

// ==========================================
// OPENING HOURS INTERFACE
// ==========================================
export interface TimeSlot {
  start: string; // HH:mm format
  end: string; // HH:mm format
}

export interface OpeningHours {
  monday?: TimeSlot[] | 'closed';
  tuesday?: TimeSlot[] | 'closed';
  wednesday?: TimeSlot[] | 'closed';
  thursday?: TimeSlot[] | 'closed';
  friday?: TimeSlot[] | 'closed';
  saturday?: TimeSlot[] | 'closed';
  sunday?: TimeSlot[] | 'closed';
}

// ==========================================
// NOTIFICATION INTERFACES
// ==========================================
export interface NotificationPayload {
  type: string;
  title: string;
  message: string;
  relatedId?: string;
  data?: Record<string, unknown>;
}

// ==========================================
// STATISTICS INTERFACES
// ==========================================
export interface DashboardStatistics {
  appointmentsToday: number;
  appointmentsThisWeek: number;
  appointmentsThisMonth: number;
  occupancyRate: number;
  averageRating: number;
  totalReviews: number;
  cancellationRate: number;
  estimatedRevenue: number;
  comparisonWithLastMonth: {
    appointments: number;
    revenue: number;
  };
}

export interface PlatformStatistics {
  totalUsers: number;
  totalClients: number;
  totalPrestataires: number;
  newUsersThisMonth: number;
  newUsersThisWeek: number;
  totalAppointments: number;
  appointmentsThisMonth: number;
  globalCancellationRate: number;
  conversionRate: number;
}

// ==========================================
// SEARCH INTERFACES
// ==========================================
export interface SearchFilters {
  query?: string;
  categories?: string[];
  minRating?: number;
  minPrice?: number;
  maxPrice?: number;
  hasAvailability?: boolean;
  badges?: string[];
}

export interface SearchSortOptions {
  field: 'relevance' | 'rating' | 'reviews' | 'price' | 'createdAt';
  order: 'ASC' | 'DESC';
}
