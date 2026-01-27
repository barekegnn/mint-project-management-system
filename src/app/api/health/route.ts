/**
 * Health Check Endpoint
 * 
 * Returns the health status of the application and its services
 */

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withErrorHandler } from '@/lib/api-error-handler';

const prisma = new PrismaClient();

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

  return NextResponse.json(response, { status: statusCode });
});
