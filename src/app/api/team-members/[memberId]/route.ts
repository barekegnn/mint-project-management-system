import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/serverAuth";
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';

export const PUT = withErrorHandler(async (request: Request,
  { params }: { params: Promise<{ memberId: string }> }) => {
  const startTime = Date.now();
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fullName } = body;

    if (!fullName) {
      return NextResponse.json(
        { error: "Full name is required" },
        { status: 400 }
      );
    }

    const { memberId } = await params;

    // Verify authorization:
    // - ADMIN can edit any team member
    // - PROJECT_MANAGER can edit members in their teams or members with tasks in their projects
    let teamMember = null as any;
    if (user.role === "ADMIN") {
      teamMember = await prisma.user.findUnique({ where: { id: memberId } });
    } else {
      teamMember = await prisma.user.findFirst({
        where: {
          id: memberId,
          OR: [
            {
              teams: {
                some: {
                  projects: {
                    some: { holderId: user.id }
                  }
                }
              }
            },
            {
              assignedTasks: {
                some: {
                  project: { holderId: user.id }
                }
              }
            }
          ]
        }
      });
    }

    if (!teamMember) {
      return NextResponse.json(
        { error: "Team member not found or not authorized" },
        { status: 404 }
      );
    }

    // Update the team member's full name
    const updatedMember = await prisma.user.update({
      where: {
        id: memberId
      },
      data: {
        fullName
      },
      select: {
        id: true,
        fullName: true,
        email: true
      }
    });

    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('PUT mint_pms', duration);

  return NextResponse.json(updatedMember);
  
}); 

export const DELETE = withErrorHandler(async (request: Request,
  { params }: { params: Promise<{ memberId: string }> }) => {
  const startTime = Date.now();
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { memberId } = await params;
    Logger.info("Attempting to delete team member:", memberId);

    // Verify the team member exists and is a team member
    const teamMember = await prisma.user.findFirst({
      where: {
        id: memberId,
        role: "TEAM_MEMBER"
      },
      include: {
        assignedTasks: true,
        teams: true,
        notifications: true
      }
    });

    if (!teamMember) {
      Logger.info("Team member not found:", memberId);
      return NextResponse.json(
        { error: "Team member not found or not authorized" },
        { status: 404 }
      );
    }

    Logger.info("Found team member:", {
      id: teamMember.id,
      name: teamMember.fullName,
      tasks: teamMember.assignedTasks.length,
      teams: teamMember.teams.length,
      notifications: teamMember.notifications.length
    });

    // First, delete all notifications
    await prisma.notification.deleteMany({
      where: {
        userId: memberId
      }
    });

    // Then, unassign all tasks
    await prisma.task.updateMany({
      where: {
        assignedToId: memberId
      },
      data: {
        assignedToId: null
      }
    });

    // Then, remove team member from all teams
    for (const team of teamMember.teams) {
      await prisma.team.update({
        where: {
          id: team.id
        },
        data: {
          members: {
            disconnect: {
              id: memberId
            }
          }
        }
      });
    }

    // Finally, delete the team member
    await prisma.user.delete({
      where: {
        id: memberId
      }
    });

    Logger.info("Successfully deleted team member:", memberId);
    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('DELETE mint_pms', duration);

  return NextResponse.json({ success: true });
  
}); 