import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';

export const GET = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
    const tasks = await prisma.task.findMany({
      include: {
        project: true,
        assignedTo: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('GET mint_pms', duration);

  return NextResponse.json(tasks);
  
}); 