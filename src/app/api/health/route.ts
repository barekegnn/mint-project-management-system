/**
 * Health Check Endpoint
 * 
 * Returns the health status of the application and its services
 * 
 * Requirements: US-6.4
 * - Checks database connection with latency measurement
 * - Returns JSON with service status (healthy/degraded/down)
 * - Returns 200 for healthy, 503 for unhealthy
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withErrorHandler } from '@/lib/api-error-handler';
import { getCacheHeader } from '@/lib/cache-headers';

interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  latency?: number;
  message?: string;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: ServiceHealth[];
  uptime: number;
}

export const GET = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
  const services: ServiceHealth[] = [];

  // Check database health
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;
    
    services.push({
      service: 'database',
      status: dbLatency < 1000 ? 'healthy' : 'degraded',
      latency: dbLatency,
    });
  } catch (error) {
    services.push({
      service: 'database',
      status: 'down',
      message: 'Database connection failed',
    });
  }

  // Check API health
  services.push({
    service: 'api',
    status: 'healthy',
    latency: Date.now() - startTime,
  });

  // Determine overall status
  const hasDown = services.some(s => s.status === 'down');
  const hasDegraded = services.some(s => s.status === 'degraded');
  
  const overallStatus = hasDown ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy';
  const statusCode = overallStatus === 'healthy' ? 200 : 503;

  const response: HealthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    services,
    uptime: process.uptime(),
  };

  return NextResponse.json(response, { 
    status: statusCode,
    headers: {
      'Cache-Control': getCacheHeader('short'), // Cache for 5 minutes
    },
  });
});
