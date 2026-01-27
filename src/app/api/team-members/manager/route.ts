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

    // Get all team members managed by this manager
    const teamMembers = await prisma.user.findMany({
      where: {
        OR: [
          // Team members created by this manager
          {
            createdBy: user.id
          },
          // Team members in teams of projects managed by this manager
          {
            teams: {
              some: {
                projects: {
                  some: {
                    holderId: user.id
                  }
                }
              }
            }
          },
          // Team members directly assigned to projects managed by this manager
          {
            assignedTasks: {
              some: {
                project: {
                  holderId: user.id
                }
              }
            }
          }
        ],
        role: "TEAM_MEMBER"
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        assignedTasks: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            deadline: true,
            project: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    Logger.info('Found team members:', teamMembers.length);

    // Transform the data to match the frontend interface
    const transformedMembers = teamMembers.map(member => ({
      id: member.id,
      name: member.fullName,
      email: member.email,
      tasks: member.assignedTasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        deadline: task.deadline,
        project: task.project
      }))
    }));

    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('GET mint_pms', duration);

  return NextResponse.json(transformedMembers);
  
}); 