import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';

export const GET = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
    // Get total active users (users created in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Use Promise.all to run queries in parallel for better performance
    const [
      activeUsers,
      totalManagers,
      totalProjects,
      projectStatusCounts,
      projects
    ] = await Promise.all([
      // Get total active users
      prisma.user.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      }),
      
      // Get total project managers
      prisma.user.count({
        where: {
          role: "PROJECT_MANAGER"
        }
      }),
      
      // Get total projects
      prisma.project.count(),
      
      // Get project counts by status
      prisma.project.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      }),
      
      // Get all projects to calculate total budget - only select budget field
      prisma.project.findMany({
        select: {
          budget: true
        }
      })
    ]);

    // Convert the counts to a more usable format
    const projectCounts = {
      PLANNED: 0,
      ACTIVE: 0,
      COMPLETED: 0,
      CANCELLED: 0
    };

    projectStatusCounts.forEach(({ status, _count }) => {
      projectCounts[status] = _count.status;
    });

    // Calculate total budget
    const totalBudget = projects.reduce((sum, project) => {
      // Remove any currency symbols and convert to number
      const budgetValue = parseFloat(project.budget.replace(/[^0-9.-]+/g, ''));
      return sum + (isNaN(budgetValue) ? 0 : budgetValue);
    }, 0);

    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('GET admin stats', duration);

  return NextResponse.json({
      activeUsers,
      totalProjects,
      totalBudget,
      projectCounts,
      totalManagers
    });
  
}); 