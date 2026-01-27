import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/serverAuth";
import { withErrorHandler } from '@/lib/api-error-handler';
import { Logger } from '@/lib/logger';

export const PUT = withErrorHandler(async (request: Request,
  { params }: { params: Promise<{ taskId: string }> }) => {
  const startTime = Date.now();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await params;
    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, description, status, priority, deadline } = body;

    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // Update the task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        status: status || existingTask.status,
        priority: priority || existingTask.priority,
        deadline: deadline ? new Date(deadline) : null,
      },
      include: {
        assignedTo: true,
        project: true,
        labels: true,
        comments: {
          include: {
            author: true,
          },
        },
        attachments: true,
      },
    });

    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('PUT mint_pms', duration);

  return NextResponse.json(updatedTask);
  
});

export const DELETE = withErrorHandler(async (request: Request,
  { params }: { params: Promise<{ taskId: string }> }) => {
  const startTime = Date.now();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await params;
    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    // Get task before deletion to use in notification
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignedTo: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    // Create notification for assigned user if exists
    if (task.assignedToId) {
      await prisma.notification.create({
        data: {
          type: "PROJECT_DELETED",
          message: `Task "${task.title}" has been deleted`,
          userId: task.assignedToId,
          projectId: task.projectId,
        },
      });
    }

    
  // Log slow query if needed
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('DELETE mint_pms', duration);

  return NextResponse.json({ success: true });
  
}); 