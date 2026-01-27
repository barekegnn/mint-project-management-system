import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';

export const GET = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
    const projects = await prisma.project.findMany({
      include: {
        tasks: true
      }
    });

    const projectTimeline = projects.map(project => {
      const totalTasks = project.tasks.length;
      const completedTasks = project.tasks.filter(task => task.status === 'COMPLETED').length;
      const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      return {
        project: project.name,
        start: project.createdAt.toISOString().split('T')[0],
        end: project.dueDate ? project.dueDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        progress: Math.round(progress)
      };
    });

    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('GET mint_pms', duration);

  return NextResponse.json(projectTimeline);
  
}); 