import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';

function getTeamColor(teamName: string): string {
  const colors = {
    'Development': 'bg-blue-500',
    'Design': 'bg-purple-500',
    'QA': 'bg-green-500',
    'DevOps': 'bg-orange-500',
    'default': 'bg-gray-500'
  };

  return colors[teamName as keyof typeof colors] || colors.default;
}

export const GET = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
  
  const teams = await prisma.team.findMany({
    include: {
      members: {
        include: {
          assignedTasks: true
        }
      }
    }
  });

  const teamPerformance = teams.map(team => {
    const totalTasks = team.members.reduce((acc, member) => acc + member.assignedTasks.length, 0);
    const completedTasks = team.members.reduce(
      (acc, member) => acc + member.assignedTasks.filter(task => task.status === 'COMPLETED').length,
      0
    );

    return {
      team: team.name,
      completed: completedTasks,
      total: totalTasks,
      color: getTeamColor(team.name)
    };
  });

  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('GET team performance', duration);

  return NextResponse.json(teamPerformance);
}); 