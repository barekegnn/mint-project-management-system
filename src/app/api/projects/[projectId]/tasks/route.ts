import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/serverAuth";
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';
import { AuthenticationError, NotFoundError, ValidationError } from '@/lib/errors';

// GET /api/projects/[projectId]/tasks
export const GET = withErrorHandler(async (request: Request,
  { params }: { params: Promise<{ projectId: string }> }) => {
  const startTime = Date.now();
  const user = await getCurrentUser();
  
  if (!user) {
    throw new AuthenticationError("Unauthorized");
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
    throw new NotFoundError("Project");
  }

  // Get all tasks for the project
  const tasks = await prisma.task.findMany({
    where: {
      projectId
    },
    include: {
      assignedTo: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('GET project tasks', duration);

  return NextResponse.json({ tasks });
});

// POST /api/projects/[projectId]/tasks
export const POST = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) => {
  const startTime = Date.now();
  const user = await getCurrentUser();
  
  if (!user) {
    throw new AuthenticationError("Unauthorized");
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
    throw new NotFoundError("Project");
  }

  const body = await request.json();
  const { title, description, priority, dueDate, assignedToId } = body;

  if (!title) {
    throw new ValidationError("Title is required");
  }

  // Create the task
  const task = await prisma.task.create({
    data: {
      title,
      description,
      priority: priority || "MEDIUM",
      deadline: dueDate ? new Date(dueDate) : null,
      projectId,
      assignedToId: assignedToId || null,
    },
    include: {
      assignedTo: true,
    }
  });

  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('POST project task', duration);

  return NextResponse.json({ task });
}); 