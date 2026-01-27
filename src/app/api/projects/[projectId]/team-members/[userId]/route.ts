import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/serverAuth";
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';

export const DELETE = withErrorHandler(async (request: Request,
  { params }: { params: Promise<{ projectId: string; userId: string }> }) => {
  const startTime = Date.now();
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { projectId, userId } = await params;

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

    // Remove the team member - Note: This requires a Team model relationship
    // For now, we'll return a not implemented response
    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('DELETE mint_pms', duration);

  return NextResponse.json(
      { error: "Team member management not yet implemented" },
      { status: 501 }
    );
  
}); 