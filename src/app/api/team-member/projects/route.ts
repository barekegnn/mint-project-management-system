import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/serverAuth";
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';

export const GET = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get only projects where the team member has assigned tasks
    const projects = await prisma.project.findMany({
      where: {
        tasks: {
          some: {
            assignedToId: user.id
          }
        }
      },
      include: {
        teams: {
          where: {
            members: {
              some: {
                id: user.id
              }
            }
          },
          select: {
            id: true,
            name: true,
            members: {
              select: {
                id: true,
                fullName: true,
                email: true
              }
            }
          }
        },
        tasks: {
          where: {
            assignedToId: user.id
          },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            deadline: true
          }
        }
      }
    });

    // Transform the data to use project name in team name
    const transformedProjects = projects.map(project => ({
      ...project,
      teams: project.teams.map(team => ({
        ...team,
        name: team.name.replace(`Team for Project ${project.id}`, `Team for ${project.name}`)
      }))
    }));

    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('GET mint_pms', duration);

  return NextResponse.json({ projects: transformedProjects });
  
}); 