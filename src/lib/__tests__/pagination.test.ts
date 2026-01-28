import { describe, it, expect } from '@jest/globals';
import {
  parsePaginationParams,
  calculateOffset,
  createPaginationResult,
  createCursorPaginationResult,
  getPrismaPaginationOptions,
  getPrismaCursorOptions,
} from '../pagination';

describe('Pagination Utilities', () => {
  describe('parsePaginationParams', () => {
    it('should parse valid pagination parameters', () => {
      const searchParams = new URLSearchParams('page=2&limit=50');
      const result = parsePaginationParams(searchParams);
      
      expect(result.page).toBe(2);
      expect(result.limit).toBe(50);
    });

    it('should use default values when parameters are missing', () => {
      const searchParams = new URLSearchParams('');
      const result = parsePaginationParams(searchParams);
      
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should enforce minimum page of 1', () => {
      const searchParams = new URLSearchParams('page=0');
      const result = parsePaginationParams(searchParams);
      
      expect(result.page).toBe(1);
    });

    it('should enforce maximum limit of 100', () => {
      const searchParams = new URLSearchParams('limit=200');
      const result = parsePaginationParams(searchParams);
      
      expect(result.limit).toBe(100);
    });

    it('should parse cursor parameter', () => {
      const searchParams = new URLSearchParams('cursor=abc123');
      const result = parsePaginationParams(searchParams);
      
      expect(result.cursor).toBe('abc123');
    });
  });

  describe('calculateOffset', () => {
    it('should calculate correct offset for page 1', () => {
      expect(calculateOffset(1, 20)).toBe(0);
    });

    it('should calculate correct offset for page 2', () => {
      expect(calculateOffset(2, 20)).toBe(20);
    });

    it('should calculate correct offset for page 5 with limit 10', () => {
      expect(calculateOffset(5, 10)).toBe(40);
    });
  });

  describe('createPaginationResult', () => {
    it('should create correct pagination result', () => {
      const data = [{ id: '1' }, { id: '2' }];
      const result = createPaginationResult(data, 100, 1, 20);
      
      expect(result.data).toEqual(data);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.total).toBe(100);
      expect(result.pagination.totalPages).toBe(5);
      expect(result.pagination.hasMore).toBe(true);
    });

    it('should indicate no more pages on last page', () => {
      const data = [{ id: '1' }];
      const result = createPaginationResult(data, 21, 2, 20);
      
      expect(result.pagination.hasMore).toBe(false);
    });
  });

  describe('createCursorPaginationResult', () => {
    it('should create cursor pagination result with more data', () => {
      const data = [
        { id: '1' },
        { id: '2' },
        { id: '3' },
      ];
      const result = createCursorPaginationResult(data, 2);
      
      expect(result.data).toHaveLength(2);
      expect(result.pagination.hasMore).toBe(true);
      expect(result.pagination.nextCursor).toBe('2');
    });

    it('should create cursor pagination result without more data', () => {
      const data = [
        { id: '1' },
        { id: '2' },
      ];
      const result = createCursorPaginationResult(data, 2);
      
      expect(result.data).toHaveLength(2);
      expect(result.pagination.hasMore).toBe(false);
      expect(result.pagination.nextCursor).toBeUndefined();
    });
  });

  describe('getPrismaPaginationOptions', () => {
    it('should return correct Prisma options', () => {
      const options = getPrismaPaginationOptions(2, 20);
      
      expect(options.take).toBe(20);
      expect(options.skip).toBe(20);
    });
  });

  describe('getPrismaCursorOptions', () => {
    it('should return correct cursor options with cursor', () => {
      const options = getPrismaCursorOptions('abc123', 20);
      
      expect(options.take).toBe(21); // +1 to check for more
      expect(options.skip).toBe(1);
      expect(options.cursor).toEqual({ id: 'abc123' });
    });

    it('should return correct cursor options without cursor', () => {
      const options = getPrismaCursorOptions(undefined, 20);
      
      expect(options.take).toBe(21);
      expect(options.skip).toBe(0);
      expect(options.cursor).toBeUndefined();
    });
  });
});
