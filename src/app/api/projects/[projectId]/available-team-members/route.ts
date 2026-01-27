import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/serverAuth";
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';

export const GET = withErrorHandler(async (request: Request,
  { params }: { params: Promise<{ projectId: string }> }) => {
  const startTime = Date.now();
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { projectId } = await params;

    // Verify the project exists and belongs to the current user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        holderId: user.id
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Get team members (users with TEAM_MEMBER role)
    const teamMembers = await prisma.user.findMany({
      where: {
        role: 'TEAM_MEMBER',
        status: 'ACTIVE'
      },
      select: {
        id: true,
        fullName: true,
        email: true
      }
    });

    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('GET mint_pms', duration);

  return NextResponse.json({ teamMembers });
  
}); 