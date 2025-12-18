import { PAGINATION } from '../constants';
import {
  PaginationMeta,
  PaginatedResult,
  CursorPaginatedResult,
  // CursorPaginationMeta,
} from '../interfaces';

/**
 * Calculate pagination metadata
 */
export function calculatePaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    perPage: limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Create a paginated result
 */
export function createPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  return {
    data,
    meta: calculatePaginationMeta(total, page, limit),
  };
}

/**
 * Normalize pagination parameters
 */
export function normalizePagination(
  page?: number,
  limit?: number
): { page: number; limit: number; skip: number } {
  const normalizedPage = Math.max(page || PAGINATION.DEFAULT_PAGE, 1);
  const normalizedLimit = Math.min(
    Math.max(limit || PAGINATION.DEFAULT_LIMIT, 1),
    PAGINATION.MAX_LIMIT
  );
  const skip = (normalizedPage - 1) * normalizedLimit;

  return {
    page: normalizedPage,
    limit: normalizedLimit,
    skip,
  };
}

/**
 * Create a cursor-based paginated result
 */
export function createCursorPaginatedResult<T extends { id: string }>(
  data: T[],
  limit: number,
  total?: number
): CursorPaginatedResult<T> {
  const hasMore = data.length > limit;
  const resultData = hasMore ? data.slice(0, limit) : data;
  const nextCursor = hasMore && resultData.length > 0 ? resultData[resultData.length - 1].id : null;

  return {
    data: resultData,
    meta: {
      hasMore,
      nextCursor,
      ...(total !== undefined && { total }),
    },
  };
}
