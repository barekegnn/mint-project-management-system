/**
 * Unit Tests for Health Check Endpoint
 * 
 * Tests the /api/health endpoint to ensure it correctly reports
 * the health status of the application and its services.
 * 
 * Requirements: US-6.4
 * - Test returns 200 when services are healthy
 * - Test returns 503 when database is down
 * - Test includes all required fields in response
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { GET } from '../route';
import prisma from '@/lib/prisma';

// Mock the prisma client
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    $queryRaw: jest.fn(),
  },
}));

describe('Health Check Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Successful Health Checks', () => {
    it('should return 200 when all services are healthy', async () => {
      // Mock successful database query with low latency
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

      const request = new Request('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      // Check status code
      expect(response.status).toBe(200);

      // Check response structure
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('services');
      expect(data).toHaveProperty('uptime');

      // Check overall status
      expect(data.status).toBe('healthy');

      // Check services array
      expect(Array.isArray(data.services)).toBe(true);
      expect(data.services.length).toBeGreaterThan(0);

      // Check database service
      const dbService = data.services.find((s: any) => s.service === 'database');
      expect(dbService).toBeDefined();
      expect(dbService.status).toBe('healthy');
      expect(dbService).toHaveProperty('latency');
      expect(typeof dbService.latency).toBe('number');

      // Check API service
      const apiService = data.services.find((s: any) => s.service === 'api');
      expect(apiService).toBeDefined();
      expect(apiService.status).toBe('healthy');
      expect(apiService).toHaveProperty('latency');
    });

    it('should include valid timestamp in ISO format', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

      const request = new Request('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      // Check timestamp is valid ISO string
      expect(data.timestamp).toBeDefined();
      const timestamp = new Date(data.timestamp);
      expect(timestamp.toString()).not.toBe('Invalid Date');
      expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should include uptime as a number', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

      const request = new Request('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(data.uptime).toBeDefined();
      expect(typeof data.uptime).toBe('number');
      expect(data.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should include Cache-Control header', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

      const request = new Request('http://localhost:3000/api/health');
      const response = await GET(request);

      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toBeDefined();
      expect(cacheControl).toBeTruthy();
    });
  });

  describe('Degraded Service Scenarios', () => {
    it('should return degraded status when database latency is high', async () => {
      // Mock slow database query (>1000ms)
      (prisma.$queryRaw as jest.Mock).mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve([{ '?column?': 1 }]), 1100);
        });
      });

      const request = new Request('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      // Should still return 503 for degraded services
      expect(response.status).toBe(503);
      expect(data.status).toBe('degraded');

      const dbService = data.services.find((s: any) => s.service === 'database');
      expect(dbService).toBeDefined();
      expect(dbService.status).toBe('degraded');
      expect(dbService.latency).toBeGreaterThan(1000);
    });
  });

  describe('Service Failure Scenarios', () => {
    it('should return 503 when database is down', async () => {
      // Mock database connection failure
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(
        new Error('Connection refused')
      );

      const request = new Request('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      // Check status code
      expect(response.status).toBe(503);

      // Check overall status
      expect(data.status).toBe('unhealthy');

      // Check database service status
      const dbService = data.services.find((s: any) => s.service === 'database');
      expect(dbService).toBeDefined();
      expect(dbService.status).toBe('down');
      expect(dbService.message).toBe('Database connection failed');
      expect(dbService.latency).toBeUndefined();
    });

    it('should include error message when database fails', async () => {
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(
        new Error('Database timeout')
      );

      const request = new Request('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      const dbService = data.services.find((s: any) => s.service === 'database');
      expect(dbService).toBeDefined();
      expect(dbService.message).toBeDefined();
      expect(typeof dbService.message).toBe('string');
    });

    it('should still report API as healthy when database is down', async () => {
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(
        new Error('Connection refused')
      );

      const request = new Request('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      // API service should still be healthy
      const apiService = data.services.find((s: any) => s.service === 'api');
      expect(apiService).toBeDefined();
      expect(apiService.status).toBe('healthy');
    });
  });

  describe('Response Structure Validation', () => {
    it('should include all required fields in response', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

      const request = new Request('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      // Required top-level fields
      const requiredFields = ['status', 'timestamp', 'services', 'uptime'];
      requiredFields.forEach(field => {
        expect(data).toHaveProperty(field);
      });

      // Services should be an array
      expect(Array.isArray(data.services)).toBe(true);

      // Each service should have required fields
      data.services.forEach((service: any) => {
        expect(service).toHaveProperty('service');
        expect(service).toHaveProperty('status');
        expect(typeof service.service).toBe('string');
        expect(['healthy', 'degraded', 'down']).toContain(service.status);
      });
    });

    it('should have at least database and api services', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

      const request = new Request('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      const serviceNames = data.services.map((s: any) => s.service);
      expect(serviceNames).toContain('database');
      expect(serviceNames).toContain('api');
    });

    it('should have valid status values', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

      const request = new Request('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      const validStatuses = ['healthy', 'degraded', 'unhealthy'];
      expect(validStatuses).toContain(data.status);

      data.services.forEach((service: any) => {
        const validServiceStatuses = ['healthy', 'degraded', 'down'];
        expect(validServiceStatuses).toContain(service.status);
      });
    });
  });

  describe('Latency Measurements', () => {
    it('should measure database latency accurately', async () => {
      // Mock database query with known delay
      (prisma.$queryRaw as jest.Mock).mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve([{ '?column?': 1 }]), 100);
        });
      });

      const request = new Request('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      const dbService = data.services.find((s: any) => s.service === 'database');
      expect(dbService).toBeDefined();
      expect(dbService.latency).toBeGreaterThanOrEqual(90); // Allow some variance
      expect(dbService.latency).toBeLessThan(200);
    });

    it('should not include latency when service is down', async () => {
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(
        new Error('Connection refused')
      );

      const request = new Request('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      const dbService = data.services.find((s: any) => s.service === 'database');
      expect(dbService).toBeDefined();
      expect(dbService.latency).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple rapid requests', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

      const request = new Request('http://localhost:3000/api/health');
      
      // Make multiple concurrent requests
      const responses = await Promise.all([
        GET(request),
        GET(request),
        GET(request),
      ]);

      // All should succeed
      responses.forEach(async (response) => {
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.status).toBe('healthy');
      });
    });

    it('should handle database query returning unexpected data', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      // Should still complete successfully
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('services');
    });
  });
});
