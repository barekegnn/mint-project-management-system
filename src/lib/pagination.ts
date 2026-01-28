/**
 * Pagination utilities for API routes
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
    nextCursor?: string;
  };
}

/**
 * Parse pagination parameters from URL search params
 */
export function parsePaginationParams(searchParams: URLSearchParams): PaginationParams {
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const cursor = searchParams.get('cursor') || undefined;

  return {
    page: Math.max(1, page),
    limit: Math.min(100, Math.max(1, limit)), // Max 100 items per page
    cursor,
  };
}

/**
 * Calculate offset for offset-based pagination
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Create pagination result object
 */
export function createPaginationResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginationResult<T> {
  const totalPages = Math.ceil(total / limit);
  const hasMore = page < totalPages;

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore,
    },
  };
}

/**
 * Create cursor-based pagination result
 */
export function createCursorPaginationResult<T extends { id: string }>(
  data: T[],
  limit: number
): Omit<PaginationResult<T>, 'pagination'> & {
  pagination: Omit<PaginationResult<T>['pagination'], 'page' | 'total' | 'totalPages'>;
} {
  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;
  const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : undefined;

  return {
    data: items,
    pagination: {
      limit,
      hasMore,
      nextCursor,
    },
  };
}

/**
 * Prisma pagination options for offset-based pagination
 */
export function getPrismaPaginationOptions(page: number, limit: number) {
  return {
    take: limit,
    skip: calculateOffset(page, limit),
  };
}

/**
 * Prisma pagination options for cursor-based pagination
 */
export function getPrismaCursorOptions(cursor: string | undefined, limit: number) {
  return {
    take: limit + 1, // Fetch one extra to determine if there are more
    skip: cursor ? 1 : 0, // Skip the cursor itself
    cursor: cursor ? { id: cursor } : undefined,
  };
}
