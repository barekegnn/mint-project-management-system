import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ProjectStatus } from "@prisma/client";
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';
import { ValidationError, NotFoundError } from '@/lib/errors';

export const PUT = withErrorHandler(async (request: Request,
  { params }: { params: Promise<{ projectId: string }> }) => {
  const startTime = Date.now();
  const { projectId } = await params;
  const body = await request.json();
  const { name, holderId, status, budget, description, fileName, fileUrl } = body;

  // Validate required fields
  if (!name || !holderId || !budget) {
    throw new ValidationError("Missing required fields");
  }

  // Find the user by ID
  const user = await prisma.user.findUnique({
    where: { id: holderId }
  });

  if (!user) {
    throw new ValidationError("Invalid holder ID");
  }

  // Update the project with holder ID
  const project = await prisma.project.update({
    where: {
      id: projectId
    },
    data: {
      name,
      holder: { connect: { id: user.id } }, // Correct relation syntax
      status: status as ProjectStatus,
      budget,
      description: description || null,
      fileName: fileName || null,
      fileUrl: fileUrl || null,
    },
  });

  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('PUT project', duration);

  return NextResponse.json({
    ...project,
    holder: user.fullName,
    holderId: user.id
  });
});

// PATCH: Partial update (e.g., budget only)
export const PATCH = withErrorHandler(async (request: Request,
  { params }: { params: Promise<{ projectId: string }> }) => {
  const startTime = Date.now();
  const { projectId } = await params;
  const body = await request.json();
  const { budget, description } = body;

  // Validate that at least one field is provided
  if (budget === undefined && description === undefined) {
    throw new ValidationError("At least one field (budget or description) must be provided");
  }

  // Validate budget if provided
  if (budget !== undefined) {
    if (budget === null || budget === "") {
      throw new ValidationError("Budget cannot be empty");
    }
    if (isNaN(parseFloat(budget))) {
      throw new ValidationError("Budget must be a valid number");
    }
  }

  // Build update data object
  const updateData: any = {};
  if (budget !== undefined) updateData.budget = String(budget);
  if (description !== undefined) updateData.description = description || null;

  // Update the project
  const project = await prisma.project.update({
    where: {
      id: projectId
    },
    data: updateData,
    include: {
      holder: {
        select: {
          id: true,
          fullName: true,
          email: true,
        }
      }
    }
  });

  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('PATCH project', duration);

  return NextResponse.json({
    ...project,
    holder: project.holder?.fullName || 'Unassigned',
    holderId: project.holderId
  });
});

export const GET = withErrorHandler(async (request: Request,
  { params }: { params: Promise<{ projectId: string }> }) => {
  const startTime = Date.now();
  const { projectId } = await params;
  
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });
  
  if (!project) {
    throw new NotFoundError("Project");
  }

  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('GET project', duration);

  return NextResponse.json(project);
});

export const DELETE = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) => {
  const startTime = Date.now();
  const { projectId } = await params;
  
  // Delete related notifications first
  await prisma.notification.deleteMany({
    where: { projectId },
  });
  
  // Now delete the project
  await prisma.project.delete({
    where: { id: projectId },
  });

  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('DELETE project', duration);

  return NextResponse.json({ message: "Project deleted" });
});
