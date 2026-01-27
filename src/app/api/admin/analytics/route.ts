import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/serverAuth';
import { getCacheHeader } from '@/lib/cache-headers';
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';

// Helper function to convert BigInt to Number
function convertBigIntToNumber(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return Number(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToNumber);
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      result[key] = convertBigIntToNumber(obj[key]);
    }
    return result;
  }

  return obj;
}

export const GET = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
    Logger.info('Analytics API: Starting request');
    
    const user = await getCurrentUser();
    Logger.info('Analytics API: Current user:', user);

    if (!user) {
      Logger.info('Analytics API: No user found');
      return NextResponse.json({ error: 'Unauthorized - No user found' }, { status: 401 });
    }

    if (user.role !== 'ADMIN') {
      Logger.info('Analytics API: User is not admin', { userId: user.id, role: user.role });
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    Logger.info('Analytics API: Fetching data...');

    // Get total projects
    const totalProjects = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "Project"
    `;
    Logger.info('Analytics API: Total projects:', totalProjects);

    // Get projects by status
    const projectsByStatus = await prisma.$queryRaw`
      SELECT status, COUNT(*) as count 
      FROM "Project" 
      GROUP BY status
    `;
    Logger.info('Analytics API: Projects by status:', projectsByStatus);

    // Get total budget
    const totalBudget = await prisma.$queryRaw`
      SELECT COALESCE(SUM(CAST(budget AS INTEGER)), 0) as total 
      FROM "Project"
    `;
    Logger.info('Analytics API: Total budget:', totalBudget);

    // Get total number of project managers
    const totalManagers = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT "holderId") as count
      FROM "Project"
      WHERE "holderId" IS NOT NULL
    `;
    Logger.info('Analytics API: Total managers:', totalManagers);

    // Get projects by manager
    const projectsByManager = await prisma.$queryRaw`
      SELECT 
        COALESCE(u."fullName", 'Unassigned') as manager,
        COUNT(p.id) as count
      FROM "Project" p
      LEFT JOIN "User" u ON p."holderId" = u.id
      GROUP BY u."fullName"
      ORDER BY count DESC
    `;
    Logger.info('Analytics API: Projects by manager:', projectsByManager);

    // Get recent projects
    const recentProjects = await prisma.$queryRaw`
      SELECT 
        p.*,
        COALESCE(u."fullName", 'Unassigned') as holder_name
      FROM "Project" p
      LEFT JOIN "User" u ON p."holderId" = u.id
      ORDER BY p."createdAt" DESC
      LIMIT 5
    `;
    Logger.info('Analytics API: Recent projects:', recentProjects);

    // Get project completion rate
    const completionRate = await prisma.$queryRaw`
      SELECT 
        COALESCE(
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0),
          0
        ) as rate
      FROM "Project"
    `;
    Logger.info('Analytics API: Completion rate:', completionRate);

    const response = {
      totalProjects: Number((totalProjects as any[])[0].count),
      projectsByStatus: convertBigIntToNumber(projectsByStatus),
      totalBudget: Number((totalBudget as any[])[0].total || 0),
      totalManagers: Number((totalManagers as any[])[0].count),
      projectsByManager: convertBigIntToNumber(projectsByManager),
      recentProjects: convertBigIntToNumber(recentProjects),
      completionRate: Number((completionRate as any[])[0].rate || 0)
    };

    Logger.info('Analytics API: Sending response:', response);
    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('GET mint_pms', duration);

  return NextResponse.json(response, {
      headers: {
        'Cache-Control': getCacheHeader('stale-while-revalidate'), // Cache but revalidate in background
      },
    });
  
}); 