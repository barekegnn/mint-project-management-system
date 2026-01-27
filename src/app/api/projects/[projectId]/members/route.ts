import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';

export const POST = withErrorHandler(async (request: Request,
  { params }: { params: Promise<{ projectId: string }> }) => {
  const startTime = Date.now();
    const body = await request.json();
    if (!body.memberId) {
      return NextResponse.json(
        { error: 'memberId is required' },
        { status: 400 }
      );
    }

    const { projectId } = await params;
    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    // First, get or create a team for this project
    let team = await prisma.team.findFirst({
      where: {
        projects: {
          some: {
            id: projectId
          }
        }
      }
    });

    if (!team) {
      team = await prisma.team.create({
        data: {
          name: `Team for Project ${projectId}`,
          projects: {
            connect: {
              id: projectId
            }
          }
        }
      });
    }

    // Add member to the team
    await prisma.team.update({
      where: { id: team.id },
      data: {
        members: {
          connect: {
            id: body.memberId
          }
        }
      }
    });

    // Fetch updated project data
    const updatedProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        teams: {
          include: {
            members: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!updatedProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Transform the data to match the frontend interface
    const transformedProject = {
      id: updatedProject.id,
      name: updatedProject.name,
      members: updatedProject.teams.flatMap(team => 
        team.members.map(member => ({
          id: member.id,
          name: member.fullName,
          workload: 0, // This should be calculated based on assigned tasks
        }))
      ),
    };

    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('POST mint_pms', duration);

  return NextResponse.json(transformedProject);
  
});

export const DELETE = withErrorHandler(async (request: Request,
  { params }: { params: Promise<{ projectId: string; memberId: string }> }) => {
  const startTime = Date.now();
    const { projectId, memberId } = await params;

    // Find the team associated with this project
    const team = await prisma.team.findFirst({
      where: {
        projects: {
          some: {
            id: projectId
          }
        }
      }
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Remove member from the team
    await prisma.team.update({
      where: { id: team.id },
      data: {
        members: {
          disconnect: {
            id: memberId
          }
        }
      }
    });

    // Fetch updated project data
    const updatedProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        teams: {
          include: {
            members: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!updatedProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Transform the data to match the frontend interface
    const transformedProject = {
      id: updatedProject.id,
      name: updatedProject.name,
      members: updatedProject.teams.flatMap(team => 
        team.members.map(member => ({
          id: member.id,
          name: member.fullName,
          workload: 0, // This should be calculated based on assigned tasks
        }))
      ),
    };

    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('DELETE mint_pms', duration);

  return NextResponse.json(transformedProject);
  
}); 