import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';

export const GET = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
    // Get total projects
    const totalProjects = await prisma.project.count();
    
    // Get completed projects
    const completedProjects = await prisma.project.count({
      where: { status: 'COMPLETED' }
    });

    // Get on-time projects (simplified - just count completed projects)
    const onTimeProjects = completedProjects;

    // Get resource utilization
    const totalTeamMembers = await prisma.user.count({
      where: { role: 'TEAM_MEMBER' }
    });
    const activeTeamMembers = await prisma.user.count({
      where: {
        role: 'TEAM_MEMBER',
        assignedTasks: {
          some: {
            status: 'IN_PROGRESS'
          }
        }
      }
    });

    // Calculate budget efficiency (simplified - no budget tracking available)
    const budgetEfficiency = 0;

    // Calculate metrics
    const completionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;
    const onTimeDelivery = completedProjects > 0 ? (onTimeProjects / completedProjects) * 100 : 0;
    const resourceUtilization = totalTeamMembers > 0 ? (activeTeamMembers / totalTeamMembers) * 100 : 0;

    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('GET mint_pms', duration);

  return NextResponse.json({
      completionRate: Math.round(completionRate),
      onTimeDelivery: Math.round(onTimeDelivery),
      resourceUtilization: Math.round(resourceUtilization),
      budgetEfficiency: Math.round(budgetEfficiency)
    });
  
}); 