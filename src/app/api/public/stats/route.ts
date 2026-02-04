import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-error-handler";
import { Logger } from "@/lib/logger";
import { getCacheHeader } from "@/lib/cache-headers";

/**
 * Public Stats Endpoint
 * 
 * Returns public statistics for the landing page
 * No authentication required
 */
export const GET = withErrorHandler(async () => {
  const startTime = Date.now();

  try {
    // Fetch counts in parallel for better performance
    const [totalProjects, totalUsers, completedProjects] = await Promise.all([
      prisma.project.count(),
      prisma.user.count(),
      prisma.project.count({
        where: {
          status: 'COMPLETED'
        }
      })
    ]);

    // Calculate success rate
    const successRate = totalProjects > 0 
      ? Math.round((completedProjects / totalProjects) * 100) 
      : 0;

    // Log slow query if needed
    const duration = Date.now() - startTime;
    Logger.logSlowQuery('Public stats query', duration);

    const stats = {
      totalProjects,
      totalUsers,
      completedProjects,
      successRate,
      clientSatisfaction: 4.9, // Fixed value, can be made dynamic later
    };

    Logger.info('Public stats fetched', stats);

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': getCacheHeader('short'), // Cache for 5 minutes
      },
    });
  } catch (error) {
    Logger.error('Error fetching public stats', error);
    
    // Return default values on error
    return NextResponse.json({
      totalProjects: 0,
      totalUsers: 0,
      completedProjects: 0,
      successRate: 0,
      clientSatisfaction: 4.9,
    }, {
      headers: {
        'Cache-Control': getCacheHeader('no-cache'),
      },
    });
  }
});
