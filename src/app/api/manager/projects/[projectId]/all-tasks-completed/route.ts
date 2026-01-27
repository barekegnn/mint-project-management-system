import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/serverAuth";
import { TaskStatus } from "@prisma/client";
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';

export const GET = withErrorHandler(async (request: Request, context: { params: Promise<{ projectId: string }> }) => {
  const startTime = Date.now();
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { projectId } = await context.params;

  // Check if user is the manager of the project
  const project = await prisma.project.findUnique({
    where: { id: projectId, holderId: user.id },
    select: { id: true },
  });
  if (!project) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch incomplete tasks (treat COMPLETED, CANCELLED, REVIEW, and BLOCKED as acceptable)
  // Define acceptable statuses for final report
  const acceptableStatuses = [TaskStatus.COMPLETED, TaskStatus.REVIEW, TaskStatus.BLOCKED];

  const incompleteTasks = await prisma.task.findMany({
    where: { projectId, status: { notIn: acceptableStatuses } },
    select: { id: true, title: true, status: true },
    orderBy: { createdAt: 'asc' },
  });

  
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('GET mint_pms', duration);

  return NextResponse.json({
    allCompleted: incompleteTasks.length === 0,
    incompleteTasks,
  });
}); 