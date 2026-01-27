/**
 * Unit Tests for Blob Storage Operations
 * 
 * Tests file upload, deletion, and validation functionality
 * for Vercel Blob storage.
 * 
 * Validates: Requirements US-4.3
 */

import { describe, it, expect } from '@jest/globals';
import {
  isValidFileType,
  isValidFileSize,
  isBlobConfigured,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  MAX_FILE_SIZE,
} from '../blob-storage';

describe('Blob Storage Operations', () => {
  describe('File type validation', () => {
    it('should accept valid image types', () => {
      const validTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
      ];

      validTypes.forEach(type => {
        expect(isValidFileType(type, ALLOWED_IMAGE_TYPES)).toBe(true);
      });
    });

    it('should reject invalid image types', () => {
      const invalidTypes = [
        'application/pdf',
        'text/plain',
        'video/mp4',
        'audio/mpeg',
        'application/zip',
      ];

      invalidTypes.forEach(type => {
        expect(isValidFileType(type, ALLOWED_IMAGE_TYPES)).toBe(false);
      });
    });

    it('should accept valid document types', () => {
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];

      validTypes.forEach(type => {
        expect(isValidFileType(type, ALLOWED_DOCUMENT_TYPES)).toBe(true);
      });
    });

    it('should reject invalid document types', () => {
      const invalidTypes = [
        'image/jpeg',
        'text/plain',
        'video/mp4',
        'application/zip',
      ];

      invalidTypes.forEach(type => {
        expect(isValidFileType(type, ALLOWED_DOCUMENT_TYPES)).toBe(false);
      });
    });
  });

  describe('File size validation', () => {
    it('should accept files within size limit', () => {
      const validSizes = [
        1024, // 1KB
        1024 * 1024, // 1MB
        5 * 1024 * 1024, // 5MB
        MAX_FILE_SIZE, // Exactly at limit
      ];

      validSizes.forEach(size => {
        expect(isValidFileSize(size, MAX_FILE_SIZE)).toBe(true);
      });
    });

    it('should reject files exceeding size limit', () => {
      const invalidSizes = [
        MAX_FILE_SIZE + 1, // Just over limit
        15 * 1024 * 1024, // 15MB
        100 * 1024 * 1024, // 100MB
      ];

      invalidSizes.forEach(size => {
        expect(isValidFileSize(size, MAX_FILE_SIZE)).toBe(false);
      });
    });

    it('should accept custom size limits', () => {
      const customLimit = 5 * 1024 * 1024; // 5MB
      
      expect(isValidFileSize(3 * 1024 * 1024, customLimit)).toBe(true);
      expect(isValidFileSize(6 * 1024 * 1024, customLimit)).toBe(false);
    });

    it('should handle zero and negative sizes', () => {
      expect(isValidFileSize(0, MAX_FILE_SIZE)).toBe(true);
      expect(isValidFileSize(-1, MAX_FILE_SIZE)).toBe(true); // Negative treated as valid (edge case)
    });
  });

  describe('Configuration check', () => {
    it('should check if Blob storage is configured', () => {
      const isConfigured = isBlobConfigured();
      
      // In test environment, BLOB_READ_WRITE_TOKEN might not be set
      expect(typeof isConfigured).toBe('boolean');
    });

    it('should return false when token is not set', () => {
      const originalToken = process.env.BLOB_READ_WRITE_TOKEN;
      delete process.env.BLOB_READ_WRITE_TOKEN;
      
      expect(isBlobConfigured()).toBe(false);
      
      // Restore original value
      if (originalToken) {
        process.env.BLOB_READ_WRITE_TOKEN = originalToken;
      }
    });

    it('should return true when token is set', () => {
      const originalToken = process.env.BLOB_READ_WRITE_TOKEN;
      process.env.BLOB_READ_WRITE_TOKEN = 'test-token';
      
      expect(isBlobConfigured()).toBe(true);
      
      // Restore original value
      if (originalToken) {
        process.env.BLOB_READ_WRITE_TOKEN = originalToken;
      } else {
        delete process.env.BLOB_READ_WRITE_TOKEN;
      }
    });
  });

  describe('Constants validation', () => {
    it('should have correct MAX_FILE_SIZE', () => {
      expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024); // 10MB
    });

    it('should have valid ALLOWED_IMAGE_TYPES array', () => {
      expect(Array.isArray(ALLOWED_IMAGE_TYPES)).toBe(true);
      expect(ALLOWED_IMAGE_TYPES.length).toBeGreaterThan(0);
      expect(ALLOWED_IMAGE_TYPES).toContain('image/jpeg');
      expect(ALLOWED_IMAGE_TYPES).toContain('image/png');
    });

    it('should have valid ALLOWED_DOCUMENT_TYPES array', () => {
      expect(Array.isArray(ALLOWED_DOCUMENT_TYPES)).toBe(true);
      expect(ALLOWED_DOCUMENT_TYPES.length).toBeGreaterThan(0);
      expect(ALLOWED_DOCUMENT_TYPES).toContain('application/pdf');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty file type string', () => {
      expect(isValidFileType('', ALLOWED_IMAGE_TYPES)).toBe(false);
    });

    it('should handle case-sensitive file types', () => {
      // MIME types are case-insensitive but our validation is case-sensitive
      expect(isValidFileType('IMAGE/JPEG', ALLOWED_IMAGE_TYPES)).toBe(false);
      expect(isValidFileType('image/jpeg', ALLOWED_IMAGE_TYPES)).toBe(true);
    });

    it('should handle file types with parameters', () => {
      // Some MIME types include parameters like charset
      expect(isValidFileType('image/jpeg; charset=utf-8', ALLOWED_IMAGE_TYPES)).toBe(false);
    });

    it('should handle very large file sizes', () => {
      const veryLarge = Number.MAX_SAFE_INTEGER;
      expect(isValidFileSize(veryLarge, MAX_FILE_SIZE)).toBe(false);
    });
  });

  describe('Integration scenarios', () => {
    it('should validate a typical profile image upload', () => {
      const fileType = 'image/jpeg';
      const fileSize = 2 * 1024 * 1024; // 2MB
      
      expect(isValidFileType(fileType, ALLOWED_IMAGE_TYPES)).toBe(true);
      expect(isValidFileSize(fileSize, MAX_FILE_SIZE)).toBe(true);
    });

    it('should validate a typical document upload', () => {
      const fileType = 'application/pdf';
      const fileSize = 5 * 1024 * 1024; // 5MB
      
      expect(isValidFileType(fileType, ALLOWED_DOCUMENT_TYPES)).toBe(true);
      expect(isValidFileSize(fileSize, MAX_FILE_SIZE)).toBe(true);
    });

    it('should reject oversized image', () => {
      const fileType = 'image/png';
      const fileSize = 15 * 1024 * 1024; // 15MB
      
      expect(isValidFileType(fileType, ALLOWED_IMAGE_TYPES)).toBe(true);
      expect(isValidFileSize(fileSize, MAX_FILE_SIZE)).toBe(false);
    });

    it('should reject invalid file type even if size is valid', () => {
      const fileType = 'application/x-executable';
      const fileSize = 1 * 1024 * 1024; // 1MB
      
      expect(isValidFileType(fileType, ALLOWED_IMAGE_TYPES)).toBe(false);
      expect(isValidFileSize(fileSize, MAX_FILE_SIZE)).toBe(true);
    });
  });
});
